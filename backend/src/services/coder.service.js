// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const axios = require('axios');
const crypto = require('crypto');
const httpStatus = require('http-status');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const coderConfig = require('../utils/coderConfig');

const getCoderApiBase = () => {
  const coderCfg = coderConfig.getCoderConfigSync();
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const base = String(coderCfg.coderUrl || '').replace(/\/$/, '');
  if (!base) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'CODER_URL is not configured');
  }

  return `${base}/api/v2`;
};

const normalizeIdForName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/**
 * Get Coder API headers with admin token
 */
const getAdminHeaders = () => {
  const coderCfg = coderConfig.getCoderConfigSync();
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }
  if (!coderCfg.adminApiKey) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'CODER_ADMIN_API_KEY is not configured');
  }

  return {
    'Coder-Session-Token': coderCfg.adminApiKey,
    'Content-Type': 'application/json',
  };
};

const getHeadersWithToken = (sessionToken) => {
  if (!sessionToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Missing Coder session token');
  }
  return {
    'Coder-Session-Token': sessionToken,
    'Content-Type': 'application/json',
  };
};

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24h
const TOKEN_LIFETIME_DURATION = '24h';
const TOKEN_REFRESH_SAFETY_MS = 5 * 60 * 1000; // refresh if expiring within 5m
// Bump when token generation policy changes so cached tokens are rotated automatically.
const TOKEN_POLICY_VERSION = 'v2';

/**
 * Get (and cache) a user-scoped token for Coder API calls.
 *
 * Admin API key is only used here to mint a safer token. All subsequent
 * workspace operations should use the returned token via getHeadersWithToken().
 *
 * @param {import('mongoose').Document & {coder_username?: string, coder_scoped_token?: string, coder_scoped_token_expires_at?: Date, coder_scoped_token_allow?: string, save: Function}} user
 * @param {Object} [options]
 * @param {string} [options.workspaceId] - If provided, restrict token allow-list to this workspace.
 * @returns {Promise<string>} scoped token
 */
const getOrCreateUserScopedToken = async (user, options = {}) => {
  const { workspaceId } = options;
  if (!user?.coder_username) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Coder user not found. Prepare workspace first.');
  }

  const desiredAllow = workspaceId ? `${TOKEN_POLICY_VERSION}|workspace:${workspaceId}` : `${TOKEN_POLICY_VERSION}|global`;
  const expiresAt = user.coder_scoped_token_expires_at ? new Date(user.coder_scoped_token_expires_at).getTime() : 0;
  const stillValid = user.coder_scoped_token && expiresAt > Date.now() + TOKEN_REFRESH_SAFETY_MS;
  const allowMatches = String(user.coder_scoped_token_allow || '') === desiredAllow;

  if (stillValid && allowMatches) {
    return user.coder_scoped_token;
  }

  const token = await generateSessionToken(user.coder_username, { workspaceId });
  if (!token) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Failed to generate Coder user-scoped token');
  }

  user.coder_scoped_token = token;
  user.coder_scoped_token_expires_at = new Date(Date.now() + TOKEN_LIFETIME_MS);
  user.coder_scoped_token_allow = desiredAllow;
  await user.save();

  return token;
};

/**
 * Get default organization (Coder Community Edition only supports one default org)
 * @returns {Promise<string>} Organization ID
 */
const getOrCreateDefaultOrganization = async () => {
  try {
    // Get all organizations
    const orgsResponse = await axios.get(`${getCoderApiBase()}/organizations`, {
      headers: getAdminHeaders(),
    });

    // Handle both response formats: array directly or wrapped in 'organizations' property
    let organizations = [];
    if (Array.isArray(orgsResponse.data)) {
      organizations = orgsResponse.data;
    } else if (orgsResponse.data?.organizations && Array.isArray(orgsResponse.data.organizations)) {
      organizations = orgsResponse.data.organizations;
    }

    logger.info(`Found ${organizations.length} organization(s) in Coder`);
    if (organizations.length > 0) {
      logger.debug(
        `Organizations: ${JSON.stringify(organizations.map((org) => ({ name: org.name, id: org.id, is_default: org.is_default })))}`,
      );
    }

    // Find the default organization (marked with is_default: true)
    const defaultOrg = organizations.find((org) => org.is_default === true);

    if (defaultOrg) {
      logger.info(`Using default Coder organization: ${defaultOrg.name} (${defaultOrg.id})`);
      return defaultOrg.id;
    }

    // Fallback: look for organization named "coder" (default name)
    const coderOrg = organizations.find((org) => org.name === 'coder');
    if (coderOrg) {
      logger.info(`Using Coder organization: ${coderOrg.name} (${coderOrg.id})`);
      return coderOrg.id;
    }

    // Last resort: use first available organization
    if (organizations.length > 0) {
      logger.warn(`No default organization found, using first available: ${organizations[0].name}`);
      return organizations[0].id;
    }

    // If no organizations found, try to get organization from admin user as fallback
    if (organizations.length === 0) {
      logger.warn(`No organizations found via organizations endpoint, trying to get from admin user...`);
      try {
        // Get the admin user to find their organization
        const usersResponse = await axios.get(`${getCoderApiBase()}/users`, {
          headers: getAdminHeaders(),
        });

        const users = Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data?.users || [];

        // Find the first user with organization_ids
        const userWithOrg = users.find((u) => u.organization_ids && u.organization_ids.length > 0);
        if (userWithOrg && userWithOrg.organization_ids.length > 0) {
          const orgId = userWithOrg.organization_ids[0];
          logger.info(`Using organization from admin user: ${orgId}`);
          return orgId;
        }
      } catch (userError) {
        logger.error(`Failed to get organization from user: ${userError.message}`);
      }
    }

    // If still no organizations found, log the full response for debugging
    logger.error(`No organizations found. API response: ${JSON.stringify(orgsResponse.data)}`);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'No organizations found in Coder instance. Please ensure Coder is properly initialized with at least one organization.',
    );
  } catch (error) {
    logger.error(`Failed to get default organization: ${error.message}`);
    if (error.response) {
      logger.error(
        `Organization API error - Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`,
      );
      logger.error(`Request URL: ${error.config?.url}, Headers: ${JSON.stringify(error.config?.headers)}`);
    } else if (error.request) {
      logger.error(`No response received from Coder API. Request: ${JSON.stringify(error.request)}`);
    }
    throw error;
  }
};

/**
 * Generate random password for Coder users (they won't use it)
 */
const generateRandomPassword = () => {
  return `pwd_${crypto.randomBytes(24).toString('base64url')}`;
};

/**
 * Ensure a Coder user is active.
 * Some Coder deployments can return newly-created/existing users with
 * non-active statuses (for example dormant), which blocks app access.
 * @param {Object} user - Coder user object
 * @returns {Promise<Object>} User object (possibly updated)
 */
const ensureUserIsActive = async (user) => {
  if (!user || user.status === 'active') {
    return user;
  }

  try {
    await axios.put(`${getCoderApiBase()}/users/${user.id}/status/activate`, {}, { headers: getAdminHeaders() });
    logger.info(`Activated Coder user: ${user.username} (${user.id}) from status ${user.status}`);
    return { ...user, status: 'active' };
  } catch (error) {
    logger.error(`Failed to activate user ${user.username} (status ${user.status}): ${error.message}`);
    return user;
  }
};

/**
 * Ensure user exists in Coder, create if not
 * @param {string} userId - Internal user ID
 * @param {string} username - Username for Coder
 * @param {string} email - User email
 * @returns {Promise<Object>} Coder user object
 */
const ensureUserExists = async (userId, username, email) => {
  try {
    // Check if user exists
    const usersResponse = await axios.get(`${getCoderApiBase()}/users`, {
      headers: getAdminHeaders(),
      params: { q: username },
    });

    const existingUser = usersResponse.data.users?.find((u) => u.username === username || u.email === email);

    if (existingUser) {
      const activeUser = await ensureUserIsActive(existingUser);
      logger.info(`Coder user already exists: ${username}`);
      return activeUser;
    }

    // Get or create default organization
    const organizationId = await getOrCreateDefaultOrganization();

    // Create new user with organization
    const createResponse = await axios.post(
      `${getCoderApiBase()}/users`,
      {
        email,
        username,
        password: generateRandomPassword(), // Random password, user won't use it
        login_type: 'password',
        organization_ids: [organizationId], // Required by Coder API v2
      },
      { headers: getAdminHeaders() },
    );

    logger.info(`Created Coder user: ${username} in organization ${organizationId}`);
    const activeCreatedUser = await ensureUserIsActive(createResponse.data);
    return activeCreatedUser;
  } catch (error) {
    logger.error(`Failed to ensure Coder user exists: ${error.message}`);
    logger.error(
      `Error details: ${JSON.stringify({
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        code: error.code,
      })}`,
    );
    if (error.response) {
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Coder API error: ${error.response.data?.message || error.message || JSON.stringify(error.response.data)}`,
      );
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        `Cannot connect to Coder at ${coderConfig.getCoderConfigSync().coderUrl}. Is Coder running?`,
      );
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Coder service error: ${error.message}`);
  }
};

/**
 * Generate a user-scoped session token with optional allow-list restrictions.
 * Note: Token generation may not be available in all Coder versions.
 * For iframe embedding, the workspace URL can be used directly without a token.
 * @param {string} coderUsername - Coder username
 * @param {Object} [options]
 * @param {string} [options.workspaceId] - Restrict token to a single workspace
 * @returns {Promise<string|null>} Session token or null if not available
 */
const generateSessionToken = async (coderUsername, options = {}) => {
  const { workspaceId } = options;
  const allowList = workspaceId ? [`workspace:${workspaceId}`] : undefined;

  const tokenEndpoints = [
    {
      url: `${getCoderApiBase()}/users/${coderUsername}/tokens`,
      body: {
        name: `autowrx-session-${Date.now()}`,
        lifetime: TOKEN_LIFETIME_DURATION,
        ...(allowList ? { allow: allowList } : {}),
      },
    },
    {
      // Backward-compatible endpoint on older/newer Coder variants.
      url: `${getCoderApiBase()}/users/${coderUsername}/keys/tokens`,
      body: {
        token_name: `autowrx-session-${Date.now()}`,
        lifetime: TOKEN_LIFETIME_DURATION,
        ...(allowList ? { allow: allowList } : {}),
      },
    },
    {
      // Some deployments expose /keys directly for API key creation.
      url: `${getCoderApiBase()}/users/${coderUsername}/keys`,
      body: {
        token_name: `autowrx-session-${Date.now()}`,
        lifetime: TOKEN_LIFETIME_DURATION,
        ...(allowList ? { allow: allowList } : {}),
      },
    },
  ];

  try {
    for (const endpoint of tokenEndpoints) {
      try {
        const response = await axios.post(endpoint.url, endpoint.body, { headers: getAdminHeaders() });
        const token = response.data?.key || response.data?.token || response.data?.id || response.data;
        if (!token) {
          logger.warn(`Token creation succeeded via ${endpoint.url} but no token was returned for user: ${coderUsername}`);
          return null;
        }
        logger.info(
          `Generated user-scoped Coder session token for user: ${coderUsername} via ${endpoint.url}${workspaceId ? ` (allow: workspace:${workspaceId})` : ''}`,
        );
        return typeof token === 'string' ? token : JSON.stringify(token);
      } catch (endpointError) {
        if (endpointError.response?.status === 404) {
          logger.warn(`Token endpoint unavailable (404): ${endpoint.url}`);
          continue;
        }
        logger.warn(
          `Token endpoint failed (${endpointError.response?.status || endpointError.code || 'unknown'}): ${endpoint.url}`,
        );
        continue;
      }
    }

    logger.warn(`No supported token endpoint is available for user: ${coderUsername}`);
    return null;
  } catch (error) {
    logger.error(`Failed to generate Coder session token: ${error.message}`);
    if (error.response) {
      logger.error(`Token creation error - Status: ${error.response.status}`);
      logger.error(`Error details: ${JSON.stringify(error.response.data)}`);

      // For other errors, log but don't fail - token is optional
      if (error.response.status >= 500) {
        logger.warn(`Token generation failed but continuing without token`);
        return null;
      }
    }

    // For non-404 errors, return null instead of throwing
    // The workspace URL can still be used without authentication
    logger.warn(`Token generation unavailable, continuing without token`);
    return null;
  }
};

/**
 * Get or create workspace for a user and prototype
 * @param {string} coderUserId - Coder user ID
 * @param {string} workspaceName - Workspace name (e.g., "prototype-{prototypeId}")
 * @param {string} templateId - Coder template ID
 * @param {string} prototypesHostPath - Host path for prototypes folder (bind-mount)
 * @param {string} githubToken - Optional GitHub token (currently unused)
 * @param {string} gitRepoUrl - Git repository URL (currently unused)
 * @param {string} sessionToken - User-scoped token used for user operations
 * @returns {Promise<Object>} Workspace object
 */
const getOrCreateWorkspace = async (
  coderUserId,
  workspaceName,
  templateId,
  prototypesHostPath,
  _githubToken = null, // Reserved for future template parameters.
  _gitRepoUrl = null, // Reserved for future template parameters.
  sessionToken = null,
) => {
  try {
    // Check if workspace exists
    const workspacesResponse = await axios.get(`${getCoderApiBase()}/workspaces`, {
      headers: getHeadersWithToken(sessionToken),
      params: { q: workspaceName },
    });

    // Handle both response formats: array directly or wrapped in 'workspaces' property
    let workspaces = [];
    if (Array.isArray(workspacesResponse.data)) {
      workspaces = workspacesResponse.data;
    } else if (workspacesResponse.data?.workspaces && Array.isArray(workspacesResponse.data.workspaces)) {
      workspaces = workspacesResponse.data.workspaces;
    }

    const existingWorkspace = workspaces.find((w) => {
      const ownerId = w.owner_id || w.owner?.id || w.owner;
      return w.name === workspaceName && String(ownerId) === String(coderUserId);
    });

    if (existingWorkspace) {
      logger.info(`Coder workspace already exists: ${workspaceName}`);
      return existingWorkspace;
    }

    // Create new workspace - pass prototypes_host_path from config
    const richParameterValues = [
      {
        name: 'prototypes_host_path',
        value: prototypesHostPath || coderConfig.getCoderConfigSync().prototypesPath || '/var/lib/autowrx/prototypes',
      },
    ];

    // Optional git parameters are intentionally not used in current flow.
    // if (gitRepoUrl) {
    //   richParameterValues.push({ name: 'git_repo', value: gitRepoUrl });
    // }
    // if (githubToken) {
    //   richParameterValues.push({ name: 'github_token', value: githubToken });
    // }

    // Create workspace as the user (token-based), per Coder REST API docs.
    // Prefer /users/me/workspaces so we don't need admin org membership endpoints here.
    const createResponse = await axios.post(
      `${getCoderApiBase()}/users/me/workspaces`,
      {
        template_id: templateId,
        name: workspaceName,
        rich_parameter_values: richParameterValues,
      },
      { headers: getHeadersWithToken(sessionToken) },
    );

    logger.info(`Created Coder workspace: ${workspaceName} as user ${coderUserId}`);
    return createResponse.data;
  } catch (error) {
    logger.error(`Failed to get or create Coder workspace: ${error.message}`);
    if (error.response) {
      logger.error(`Workspace creation error - Status: ${error.response.status}`);
      logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
      logger.error(`Request URL: ${error.config?.url}`);
      logger.error(`Request body: ${JSON.stringify(error.config?.data)}`);

      // Extract validation errors if present
      const validationErrors = error.response.data?.validations || error.response.data?.detail;
      if (validationErrors) {
        logger.error(`Validation errors: ${JSON.stringify(validationErrors)}`);
      }

      // Handle duplicate workspace race condition:
      // Coder may return a 500 with a "duplicate key value violates unique constraint"
      // error when a workspace with the same owner/name already exists.
      const isDuplicateKeyError =
        typeof validationErrors === 'string' &&
        validationErrors.includes('duplicate key value violates unique constraint "workspaces_owner_id_lower_idx"');

      if (error.response.status === 500 && isDuplicateKeyError) {
        logger.warn(
          `Duplicate workspace constraint hit for ${workspaceName}, attempting to find existing workspace instead of failing.`,
        );
        try {
          // Re-query workspaces and return the existing one if found
          const retryResponse = await axios.get(`${getCoderApiBase()}/workspaces`, {
            headers: getAdminHeaders(),
            params: { q: workspaceName },
          });

          let retryWorkspaces = [];
          if (Array.isArray(retryResponse.data)) {
            retryWorkspaces = retryResponse.data;
          } else if (retryResponse.data?.workspaces && Array.isArray(retryResponse.data.workspaces)) {
            retryWorkspaces = retryResponse.data.workspaces;
          }

          const existingWorkspace = retryWorkspaces.find((w) => {
            const ownerId = w.owner_id || w.owner?.id || w.owner;
            return w.name === workspaceName && String(ownerId) === String(coderUserId);
          });
          if (existingWorkspace) {
            logger.info(
              `Recovered from duplicate key error by using existing workspace: ${workspaceName} (${existingWorkspace.id})`,
            );
            return existingWorkspace;
          }

          logger.error(`Duplicate key error reported but no existing workspace named ${workspaceName} was found on retry.`);
        } catch (retryError) {
          logger.error(`Failed to recover from duplicate key error for workspace ${workspaceName}: ${retryError.message}`);
        }
      }

      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Coder API error: ${error.response.data?.message || error.message || JSON.stringify(error.response.data)}`,
      );
    }
    throw error;
  }
};

/**
 * Start a stopped workspace
 * @param {string} workspaceId - Workspace ID
 * @param {string} sessionToken - User-scoped token used for user operations
 * @returns {Promise<Object>} Build object or workspace status
 */
const startWorkspace = async (workspaceId, sessionToken = null) => {
  try {
    // First check current workspace status
    const workspace = await getWorkspaceStatus(workspaceId, sessionToken);
    const buildStatus = workspace.latest_build?.status;

    // If already running, return workspace status
    if (buildStatus === 'running') {
      logger.info(`Coder workspace ${workspaceId} is already running`);
      return workspace;
    }

    // If a build is already in progress, return workspace status
    if (buildStatus === 'starting' || buildStatus === 'stopping' || buildStatus === 'deleting') {
      logger.info(`Coder workspace ${workspaceId} build is already ${buildStatus}, waiting...`);
      return workspace;
    }

    // Start the workspace
    const response = await axios.post(
      `${getCoderApiBase()}/workspaces/${workspaceId}/builds`,
      { transition: 'start' },
      { headers: getHeadersWithToken(sessionToken) },
    );

    logger.info(`Started Coder workspace: ${workspaceId}`);
    return response.data;
  } catch (error) {
    // Handle 409 Conflict - build already active
    if (error.response?.status === 409) {
      logger.info(`Coder workspace ${workspaceId} build is already active, fetching status...`);
      // Return current workspace status instead of erroring
      return await getWorkspaceStatus(workspaceId, sessionToken);
    }

    logger.error(`Failed to start Coder workspace: ${error.message}`);
    if (error.response) {
      logger.error(`Start workspace error - Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Coder API error: ${error.response.data?.message || error.message}`,
      );
    }
    throw error;
  }
};

/**
 * Get workspace status
 * @param {string} workspaceId - Workspace ID
 * @param {string} sessionToken - User-scoped token used for user operations
 * @returns {Promise<Object>} Workspace object with status
 */
const getWorkspaceStatus = async (workspaceId, sessionToken = null) => {
  try {
    const response = await axios.get(`${getCoderApiBase()}/workspaces/${workspaceId}`, {
      headers: getHeadersWithToken(sessionToken),
    });

    return response.data;
  } catch (error) {
    logger.error(`Failed to get Coder workspace status: ${error.message}`);
    if (error.response) {
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Coder API error: ${error.response.data?.message || error.message}`,
      );
    }
    throw error;
  }
};

/**
 * First agent on a workspace (Coder populates this after resources are provisioned).
 * @param {Object} workspace - Workspace object from Coder API
 * @returns {Object|null} Agent object or null while build is still starting
 */
const pickFirstWorkspaceAgent = (workspace) => {
  if (workspace.latest_build?.resources?.[0]?.agents?.[0]) {
    return workspace.latest_build.resources[0].agents[0];
  }
  if (workspace.resources?.[0]?.agents?.[0]) {
    return workspace.resources[0].agents[0];
  }
  if (workspace.agents?.[0]) {
    return workspace.agents[0];
  }
  if (workspace.latest_build?.resources) {
    for (const resource of workspace.latest_build.resources) {
      if (resource.agents?.length) {
        return resource.agents[0];
      }
    }
  }
  if (workspace.resources) {
    for (const resource of workspace.resources) {
      if (resource.agents?.length) {
        return resource.agents[0];
      }
    }
  }
  return null;
};

/**
 * Get workspace build timings
 * @param {string} workspaceId - Workspace ID
 * @param {string} sessionToken - User-scoped token used for user operations
 * @returns {Promise<Object>} Workspace build timings
 */
const getWorkspaceTimings = async (workspaceId, sessionToken = null) => {
  try {
    // Coder API: GET /api/v2/workspaces/{workspace}/timings
    const response = await axios.get(`${getCoderApiBase()}/workspaces/${workspaceId}/timings`, {
      headers: getHeadersWithToken(sessionToken),
    });

    return response.data;
  } catch (error) {
    logger.error(`Failed to get Coder workspace timings: ${error.message}`);
    if (error.response) {
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Coder API error: ${error.response.data?.message || error.message}`,
      );
    }
    throw error;
  }
};

/**
 * Get workspace app URL for iframe embedding
 * @param {string} workspaceId - Workspace ID
 * @param {string} appSlug - App slug (default: "code-server")
 * @param {number} maxRetries - Maximum number of retries (default: 5)
 * @param {number} retryDelay - Delay between retries in ms (default: 2000)
 * @returns {Promise<string>} App URL
 */
const getWorkspaceAppUrl = async (workspaceId, appSlug = 'code-server', maxRetries = 5, retryDelay = 2000, sessionToken) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const workspace = await getWorkspaceStatus(workspaceId, sessionToken);

      // Log workspace structure for debugging
      if (attempt === 1) {
        logger.debug(
          `Workspace structure: ${JSON.stringify({
            id: workspace.id,
            name: workspace.name,
            latest_build: workspace.latest_build
              ? {
                  id: workspace.latest_build.id,
                  status: workspace.latest_build.status,
                  resources_count: workspace.latest_build.resources?.length || 0,
                }
              : null,
            resources: workspace.resources?.length || 0,
            agents: workspace.agents?.length || 0,
          })}`,
        );
      }

      const agent = pickFirstWorkspaceAgent(workspace);
      const apps = agent?.apps;

      if (!agent?.id) {
        if (attempt < maxRetries) {
          logger.info(`Agent not found yet (attempt ${attempt}/${maxRetries}), waiting ${retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }

        // Log full workspace structure for debugging
        logger.error(
          `Workspace agent not found after ${maxRetries} attempts. Full workspace structure: ${JSON.stringify(workspace, null, 2)}`,
        );
        throw new ApiError(httpStatus.NOT_FOUND, 'Workspace agent not found. The agent may still be initializing.');
      }

      // Check if app exists (optional - we can construct URL even without app in response)
      if (apps && apps.length > 0) {
        const app = apps.find((a) => a.slug === appSlug);
        if (!app && attempt < maxRetries) {
          logger.info(`App ${appSlug} not found yet (attempt ${attempt}/${maxRetries}), waiting ${retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }
      }

      // Construct URL (we can construct it even if app isn't in the response yet)
      const username = workspace.owner_name || workspace.owner || workspace.owner_id;
      const workspaceName = workspace.name;
      const agentName = agent.name || 'main';

      if (!username || !workspaceName) {
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          'Cannot construct workspace URL: missing owner or workspace name',
        );
      }

      const url = `${coderConfig.getCoderConfigSync().coderUrl}/@${username}/${workspaceName}.${agentName}/apps/${appSlug}/`;
      logger.info(`Constructed workspace app URL: ${url}`);
      return url;
    } catch (error) {
      if (error instanceof ApiError && attempt < maxRetries) {
        // If it's a NOT_FOUND error and we have retries left, continue
        if (error.statusCode === httpStatus.NOT_FOUND) {
          logger.info(`Workspace agent/app not found (attempt ${attempt}/${maxRetries}), retrying...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }
      }

      // If it's the last attempt or a non-retryable error, throw
      if (attempt === maxRetries || !(error instanceof ApiError && error.statusCode === httpStatus.NOT_FOUND)) {
        if (error instanceof ApiError) {
          throw error;
        }
        logger.error(`Failed to get workspace app URL: ${error.message}`);
        throw error;
      }
    }
  }

  // Should never reach here, but just in case
  throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get workspace app URL after all retries');
};

/**
 * Get the first workspace agent ID for a workspace
 * @param {string} workspaceId - Workspace ID
 * @param {string} sessionToken - User-scoped token
 * @param {number} [maxRetries=5] - Poll while build is still provisioning agents
 * @param {number} [retryDelay=2000] - Ms between polls (aligned with getWorkspaceAppUrl)
 * @returns {Promise<string>} Workspace agent ID
 */
const getWorkspaceAgentId = async (workspaceId, sessionToken, maxRetries = 5, retryDelay = 2000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const workspace = await getWorkspaceStatus(workspaceId, sessionToken);
    const agent = pickFirstWorkspaceAgent(workspace);

    if (agent?.id) {
      return agent.id;
    }

    if (attempt < maxRetries) {
      const buildStatus = workspace.latest_build?.status ?? 'unknown';
      logger.info(
        `Workspace agent not ready for ${workspaceId} (attempt ${attempt}/${maxRetries}, build=${buildStatus}), waiting ${retryDelay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      continue;
    }

    logger.error(
      `Workspace agent not found for workspace ${workspaceId} after ${maxRetries} attempts. Workspace: ${JSON.stringify(workspace, null, 2)}`,
    );
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Workspace agent not available yet. The workspace may still be starting; try again shortly.',
    );
  }
};

/**
 * Sanitize workspace name for Coder (one workspace per user)
 * Coder requirements:
 * - 1-32 characters
 * - Only letters, numbers, and hyphens
 * - Must start and end with letter or number
 * @param {string} userId - User ID
 * @returns {string} Sanitized workspace name
 */
const sanitizeWorkspaceName = (userId) => {
  const normalizedId = normalizeIdForName(userId);
  const idPart = normalizedId.length <= 29 ? normalizedId : `${normalizedId.slice(0, 14)}${normalizedId.slice(-15)}`;
  const name = `ws-${idPart}`;

  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);

  return sanitized || `ws-${Date.now().toString(36)}`;
};

/**
 * Get template ID by name (helper function)
 * @param {string} templateName - Template name
 * @returns {Promise<string>} Template ID
 */
const getTemplateId = async (templateName = 'docker-template') => {
  try {
    const response = await axios.get(`${getCoderApiBase()}/templates`, {
      headers: getAdminHeaders(),
    });

    // Handle both response formats: array directly or wrapped in 'templates' property
    let templates = [];
    if (Array.isArray(response.data)) {
      templates = response.data;
    } else if (response.data?.templates && Array.isArray(response.data.templates)) {
      templates = response.data.templates;
    }

    logger.debug(`Found ${templates.length} template(s) in Coder`);

    const template = templates.find((t) => t.name === templateName);
    if (!template) {
      logger.error(`Template ${templateName} not found. Available templates: ${templates.map((t) => t.name).join(', ')}`);
      throw new ApiError(httpStatus.NOT_FOUND, `Template ${templateName} not found`);
    }

    logger.info(`Found template: ${templateName} (${template.id})`);
    return template.id;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Failed to get template ID: ${error.message}`);
    if (error.response) {
      logger.error(`Template API error - Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

/**
 * Get logs for a workspace agent
 * Wraps Coder API: GET /api/v2/workspaceagents/{workspaceagent}/logs
 * @param {string} workspaceAgentId - Workspace agent ID (UUID)
 * @param {Object} [options] - Query options
 * @param {number} [options.before] - Before log id
 * @param {number} [options.after] - After log id
 * @param {boolean} [options.follow] - Follow log stream
 * @param {boolean} [options.no_compression] - Disable compression for WebSocket connection
 * @param {string} [options.format] - 'json' (default) or 'text'
 * @param {string} [sessionToken] - Optional user-scoped token. If omitted, admin token is used.
 * @returns {Promise<any>} Logs array or text, depending on format
 */
const getWorkspaceAgentLogs = async (workspaceAgentId, options = {}, sessionToken = null) => {
  try {
    const { before, after, follow, no_compression, format } = options;

    const response = await axios.get(`${getCoderApiBase()}/workspaceagents/${workspaceAgentId}/logs`, {
      headers: sessionToken ? getHeadersWithToken(sessionToken) : getAdminHeaders(),
      params: {
        ...(before !== undefined && { before }),
        ...(after !== undefined && { after }),
        ...(follow !== undefined && { follow }),
        ...(no_compression !== undefined && { no_compression }),
        ...(format && { format }),
      },
    });

    return response.data;
  } catch (error) {
    logger.error(`Failed to get workspace agent logs: ${error.message}`);
    if (error.response) {
      logger.error(
        `Workspace agent logs error - Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`,
      );
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Coder API error: ${error.response.data?.message || error.message || JSON.stringify(error.response.data)}`,
      );
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        `Cannot connect to Coder at ${coderConfig.getCoderConfigSync().coderUrl}. Is Coder running?`,
      );
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Coder service error: ${error.message}`);
  }
};

/**
 * Get logs for the first agent of a workspace
 * @param {string} workspaceId - Workspace ID
 * @param {Object} [options] - Query options (same as getWorkspaceAgentLogs)
 * @returns {Promise<any>} Logs array or text, depending on format
 */
const getWorkspaceLogsByWorkspaceId = async (workspaceId, options = {}, sessionToken = null) => {
  const agentId = await getWorkspaceAgentId(workspaceId, sessionToken);
  return getWorkspaceAgentLogs(agentId, options, sessionToken);
};

module.exports = {
  ensureUserExists,
  generateSessionToken,
  getOrCreateUserScopedToken,
  getOrCreateWorkspace,
  startWorkspace,
  getWorkspaceStatus,
  getWorkspaceAppUrl,
  getTemplateId,
  sanitizeWorkspaceName,
  getWorkspaceTimings,
  getWorkspaceAgentLogs,
  getWorkspaceAgentId,
  getWorkspaceLogsByWorkspaceId,
};
