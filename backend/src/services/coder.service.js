// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const httpStatus = require('http-status');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
/* eslint-disable no-use-before-define */

const coderConfig = require('../utils/coderConfig');

const extractCollection = (payload, key) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  return [];
};

const toCoderApiError = (error, fallbackStatus, fallbackPrefix = 'Coder API error') => {
  const upstreamStatus = error?.response?.status || fallbackStatus;
  const message = error?.response?.data?.message || error?.message || JSON.stringify(error?.response?.data || {});

  // Coder may return 401/403 when CODER_ADMIN_API_KEY is invalid or expired. Forwarding those
  // status codes to the browser makes the AutoWRX axios layer treat them as a stale *user*
  // session and repeatedly hit /auth/refresh-tokens while the real fault is server-to-Coder auth.
  let status = upstreamStatus;
  if (upstreamStatus === httpStatus.UNAUTHORIZED || upstreamStatus === httpStatus.FORBIDDEN) {
    status = httpStatus.BAD_GATEWAY;
  }

  return new ApiError(status, `${fallbackPrefix}: ${message}`);
};

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

const extractWorkspaceOwnerUsername = (workspace) => {
  const rawOwner = workspace?.owner;
  const ownerFromObject =
    rawOwner && typeof rawOwner === 'object'
      ? (rawOwner.username || rawOwner.name || rawOwner.id)
      : null;
  return String(workspace?.owner_name || ownerFromObject || workspace?.owner_id || rawOwner || '').trim();
};

const assertUserScopedPrototypePath = (prototypesHostPath, expectedUserHostPath) => {
  const rawInput = String(prototypesHostPath || '').trim();
  const rawExpected = String(expectedUserHostPath || '').trim();
  if (!rawInput || !rawExpected) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid prototypes host path for workspace provisioning');
  }
  const resolvedInput = path.resolve(rawInput);
  const resolvedExpected = path.resolve(rawExpected);
  if (resolvedInput !== resolvedExpected) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `Invalid prototypes host path. Expected user-scoped path "${resolvedExpected}"`,
    );
  }
};

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

const TOKEN_LIFETIME_DURATION = '168h'; // 7d
const TOKEN_REUSE_BUFFER_MS = 5 * 60 * 1000;
const TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
const TRANSIENT_HTTP_STATUSES = new Set([httpStatus.TOO_MANY_REQUESTS, 502, 503, 504]);
const TRANSIENT_NETWORK_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNABORTED', 'EAI_AGAIN']);

const isTransientCoderError = (error) => {
  const status = error?.response?.status;
  if (TRANSIENT_HTTP_STATUSES.has(status)) return true;
  const code = String(error?.code || '').toUpperCase();
  return TRANSIENT_NETWORK_CODES.has(code);
};

const withTransientRetry = async (fn, options = {}) => {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 250;
  let attempt = 1;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxAttempts || !isTransientCoderError(error)) {
        throw error;
      }
      const waitMs = baseDelayMs * 2 ** (attempt - 1);
      logger.warn(`Transient Coder API error, retrying attempt ${attempt + 1}/${maxAttempts} after ${waitMs}ms: ${error.message}`);
      await delay(waitMs);
      attempt += 1;
    }
  }
};

const resolveWorkspaceTtlMsFromConfig = () => {
  const ttlSeconds = Number(coderConfig.getCoderConfigSync().workspaceTtlSeconds);
  if (!Number.isFinite(ttlSeconds) || ttlSeconds < 0) {
    return 0;
  }
  return Math.floor(ttlSeconds * 1000);
};

/**
 * Generate a user-scoped token for Coder API calls.
 *
 * Admin API key is only used here to mint a safer token. All subsequent
 * workspace operations should use the returned token via getHeadersWithToken().
 *
 * @param {import('mongoose').Document & {coder_username?: string}} user
 * @param {Object} [options]
 * @param {string} [options.workspaceId] - If provided, restrict token allow-list to this workspace.
 * @param {string} [options.coderUserId] - Preferred Coder user UUID for path targeting.
 * @returns {Promise<string>} scoped token
 */
const getOrCreateUserScopedToken = async (user, options = {}) => {
  const { workspaceId, coderUserId } = options;
  if (!user?.coder_username) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Coder user not found. Prepare workspace first.');
  }

  const now = Date.now();
  const tokenExpiresAtMs = user?.coder_scoped_token_expires_at
    ? new Date(user.coder_scoped_token_expires_at).getTime()
    : 0;
  if (
    typeof user.coder_scoped_token === 'string' &&
    user.coder_scoped_token.trim() &&
    Number.isFinite(tokenExpiresAtMs) &&
    tokenExpiresAtMs > now + TOKEN_REUSE_BUFFER_MS
  ) {
    return user.coder_scoped_token.trim();
  }

  const token = await generateSessionToken(user.coder_username, { workspaceId, coderUserId });
  if (!token) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Failed to generate Coder user-scoped token');
  }

  const nextExpiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS);
  user.coder_scoped_token = token;
  user.coder_scoped_token_expires_at = nextExpiresAt;
  user.coder_scoped_token_allow = workspaceId ? `workspace:${workspaceId}` : 'all';
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

    const organizations = extractCollection(orgsResponse.data, 'organizations');

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

        const users = extractCollection(usersResponse.data, 'users');

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
    // Handle 409 Conflict - user already exists (email collision with different username)
    if (error.response?.status === 409) {
      logger.info(`Coder user creation conflict for ${username}, fetching existing user by email...`);
      try {
        const usersResponse = await axios.get(`${getCoderApiBase()}/users`, {
          headers: getAdminHeaders(),
          params: { q: email },
        });
        const existingUser = usersResponse.data.users?.find((u) => u.email === email);
        if (existingUser) {
          const activeUser = await ensureUserIsActive(existingUser);
          logger.info(`Found existing Coder user by email: ${existingUser.username}`);
          return activeUser;
        }
      } catch (retryError) {
        logger.error(`Failed to fetch existing user after 409: ${retryError.message}`);
      }
    }

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
      throw toCoderApiError(error, httpStatus.INTERNAL_SERVER_ERROR);
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
 * @param {string} [options.coderUserId] - Preferred Coder user UUID for endpoint path
 * @returns {Promise<string|null>} Session token or null if not available
 */
async function generateSessionToken(coderUsername, options = {}) {
  const { workspaceId, coderUserId } = options;
  const userPathId = encodeURIComponent(coderUserId || coderUsername);

  try {
    // Coder Users API: POST /users/{user}/keys/tokens
    const url = `${getCoderApiBase()}/users/${userPathId}/keys/tokens`;
    const minimalBody = {
      token_name: `autowrx-session-${Date.now()}`,
      scope: 'all',
    };
    const response = await axios.post(url, minimalBody, { headers: getAdminHeaders() });

    const token = response.data?.key;
    if (!token) {
      logger.warn(`Token creation succeeded via ${url} but no token was returned for user: ${coderUsername}`);
      return null;
    }

    logger.info(
      `Generated user-scoped Coder session token for user: ${coderUsername} via ${url}`,
    );
    return token;
  } catch (error) {
    logger.error(`Failed to generate Coder session token: ${error.message}`);
    if (error.response) {
      logger.error(`Token creation error - Status: ${error.response.status}`);
      logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
      throw toCoderApiError(error, httpStatus.BAD_GATEWAY, 'Coder token API failed');
    }

    throw new ApiError(httpStatus.BAD_GATEWAY, `Coder token API failed: ${error.message}`);
  }
}

/**
 * Get or create workspace for a user and prototype
 * @param {string} coderUserId - Coder user ID
 * @param {string} workspaceName - Workspace name (e.g., "prototype-{prototypeId}")
 * @param {string} templateId - Coder template ID
 * @param {string} prototypesHostPath - Host path for prototypes folder (bind-mount)
 * @param {string} sessionToken - User-scoped token used for user operations
 * @returns {Promise<Object>} Workspace object
 */
const getOrCreateWorkspace = async (
  coderUserId,
  workspaceName,
  templateId,
  prototypesHostPath,
  expectedUserHostPath,
  sessionToken = null,
) => {
  try {
    assertUserScopedPrototypePath(prototypesHostPath, expectedUserHostPath);

    // Check if workspace exists
    const workspacesResponse = await axios.get(`${getCoderApiBase()}/workspaces`, {
      headers: getHeadersWithToken(sessionToken),
      params: { q: workspaceName },
    });

    const workspaces = extractCollection(workspacesResponse.data, 'workspaces');

    const existingWorkspace = workspaces.find((w) => {
      const ownerId = w.owner_id || w.owner?.id || w.owner;
      return w.name === workspaceName && String(ownerId) === String(coderUserId);
    });

    if (existingWorkspace) {
      logger.info(`Coder workspace already exists: ${workspaceName}`);
      return existingWorkspace;
    }

    const coderCfg = coderConfig.getCoderConfigSync();
    // Create new workspace - pass Coder template rich parameters from site config.
    const richParameterValues = [
      {
        name: 'prototypes_host_path',
        value: prototypesHostPath || coderCfg.prototypesPath || '/opt/autowrx/prototypes',
      },
      {
        name: 'redis_url',
        value: coderCfg.redisUrl || '',
      },
    ];

    // Create workspace as the user (token-based), per Coder REST API docs.
    // Prefer /users/me/workspaces so we don't need admin org membership endpoints here.
    const createResponse = await axios.post(
      `${getCoderApiBase()}/users/me/workspaces`,
      {
        template_id: templateId,
        name: workspaceName,
        rich_parameter_values: richParameterValues,
        ttl_ms: resolveWorkspaceTtlMsFromConfig(),
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

          const retryWorkspaces = extractCollection(retryResponse.data, 'workspaces');

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

      throw toCoderApiError(error, httpStatus.INTERNAL_SERVER_ERROR);
    }
    throw error;
  }
};

/**
 * Update workspace TTL using Coder native endpoint.
 * @param {string} workspaceId
 * @param {number} ttlMs
 * @param {string|null} sessionToken
 * @returns {Promise<Object>}
 */
const updateWorkspaceTtl = async (workspaceId, ttlMs, sessionToken = null) => {
  const safeTtlMs = Number.isFinite(Number(ttlMs)) ? Math.max(0, Math.floor(Number(ttlMs))) : 0;
  try {
    const response = await axios.put(
      `${getCoderApiBase()}/workspaces/${workspaceId}/ttl`,
      { ttl_ms: safeTtlMs },
      { headers: getHeadersWithToken(sessionToken) },
    );
    logger.info(`Updated Coder workspace TTL: ${workspaceId} -> ${safeTtlMs}ms`);
    return response.data;
  } catch (error) {
    logger.warn(`Failed to update Coder workspace TTL for ${workspaceId}: ${error.message}`);
    if (error.response) {
      logger.warn(`Update TTL error status=${error.response.status}, data=${JSON.stringify(error.response.data)}`);
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
      return getWorkspaceStatus(workspaceId, sessionToken);
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

/** Build statuses where the workspace is not safe to issue another start yet */
const BUILD_STATUSES_BLOCKING_START = new Set(['running', 'starting', 'stopping']);

/**
 * Poll until latest build is no longer in a transitional "busy" state (after stop, before start).
 * @param {string} workspaceId
 * @param {string|null} sessionToken
 * @param {{ maxAttempts?: number, delayMs?: number }} [options]
 * @returns {Promise<Object>} Last fetched workspace
 */
const waitUntilWorkspaceBuildAllowsStart = async (workspaceId, sessionToken = null, options = {}) => {
  const maxAttempts = options.maxAttempts ?? 45;
  const delayMs = options.delayMs ?? 2000;
  const poll = async (attempt) => {
    const ws = await getWorkspaceStatus(workspaceId, sessionToken);
    const s = ws.latest_build?.status;
    if (!BUILD_STATUSES_BLOCKING_START.has(s) || attempt >= maxAttempts) {
      return ws;
    }
    await delay(delayMs);
    return poll(attempt + 1);
  };
  return poll(1);
};

/**
 * Stop a running workspace (no-op if not running).
 * @param {string} workspaceId
 * @param {string|null} sessionToken
 * @returns {Promise<Object>} Build response or current workspace
 */
const stopWorkspace = async (workspaceId, sessionToken = null) => {
  try {
    const workspace = await getWorkspaceStatus(workspaceId, sessionToken);
    const buildStatus = workspace.latest_build?.status;

    if (!workspace.latest_build || buildStatus !== 'running') {
      logger.info(`Coder workspace ${workspaceId} stop skipped (build status: ${buildStatus ?? 'none'})`);
      return workspace;
    }

    const response = await axios.post(
      `${getCoderApiBase()}/workspaces/${workspaceId}/builds`,
      { transition: 'stop' },
      { headers: getHeadersWithToken(sessionToken) },
    );
    logger.info(`Stop requested for Coder workspace: ${workspaceId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      logger.info(`Coder workspace ${workspaceId} stop conflict, fetching status...`);
      return getWorkspaceStatus(workspaceId, sessionToken);
    }
    logger.error(`Failed to stop Coder workspace: ${error.message}`);
    if (error.response) {
      logger.error(`Stop workspace error - Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Coder API error: ${error.response.data?.message || error.message}`,
      );
    }
    throw error;
  }
};

/**
 * List workspaces visible to the current user session.
 * @param {string|null} sessionToken
 * @returns {Promise<Array>} Workspace list
 */
const listMyWorkspaces = async (sessionToken = null) => {
  const headers = getHeadersWithToken(sessionToken);
  const requestUserScopedList = () =>
    axios.get(`${getCoderApiBase()}/users/me/workspaces`, { headers });
  const requestOwnerFilteredList = () =>
    axios.get(`${getCoderApiBase()}/workspaces`, {
      headers,
      params: { q: 'owner:me' },
    });

  try {
    const response = await requestUserScopedList();
    return extractCollection(response.data, 'workspaces');
  } catch (error) {
    const status = error?.response?.status;
    if (status !== httpStatus.METHOD_NOT_ALLOWED && status !== httpStatus.NOT_FOUND) {
      logger.error(`Failed to list Coder workspaces: ${error.message}`);
      if (error.response) {
        logger.error(`List workspace error - Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
        throw new ApiError(
          error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
          `Coder API error: ${error.response.data?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  try {
    const fallbackResponse = await requestOwnerFilteredList();
    return extractCollection(fallbackResponse.data, 'workspaces');
  } catch (error) {
    logger.error(`Failed to list Coder workspaces (fallback): ${error.message}`);
    if (error.response) {
      logger.error(`List workspace fallback error - Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Coder API error: ${error.response.data?.message || error.message}`,
      );
    }
    throw error;
  }
};

/**
 * Delete a workspace by issuing a delete transition build.
 * @param {string} workspaceId
 * @param {string|null} sessionToken
 * @returns {Promise<Object>} Build response or current workspace
 */
const deleteWorkspace = async (workspaceId, sessionToken = null) => {
  try {
    const response = await axios.post(
      `${getCoderApiBase()}/workspaces/${workspaceId}/builds`,
      { transition: 'delete' },
      { headers: getHeadersWithToken(sessionToken) },
    );
    logger.info(`Delete requested for Coder workspace: ${workspaceId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      logger.info(`Coder workspace ${workspaceId} delete conflict, fetching status...`);
      return getWorkspaceStatus(workspaceId, sessionToken);
    }
    logger.error(`Failed to delete Coder workspace: ${error.message}`);
    if (error.response) {
      logger.error(`Delete workspace error - Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Coder API error: ${error.response.data?.message || error.message}`,
      );
    }
    throw error;
  }
};

/**
 * List all workspaces for admin management.
 * @returns {Promise<Array>}
 */
const listAllWorkspacesAdmin = async () => {
  try {
    const headers = getAdminHeaders();
    const pageSize = 200;
    const all = [];
    let offset = 0;

    // Coder API can paginate workspace lists; fetch all pages for admin management views.
    while (true) {
      const response = await withTransientRetry(
        () =>
          axios.get(`${getCoderApiBase()}/workspaces`, {
            headers,
            params: { limit: pageSize, offset },
          }),
        { maxAttempts: 3, baseDelayMs: 300 }
      );
      const page = extractCollection(response.data, 'workspaces');
      all.push(...page);
      if (page.length < pageSize) {
        break;
      }
      offset += pageSize;
    }

    return all;
  } catch (error) {
    logger.error(`Failed to list all Coder workspaces: ${error.message}`);
    if (error.response) {
      logger.error(`Admin list workspace error - Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Coder API error: ${error.response.data?.message || error.message}`,
      );
    }
    throw error;
  }
};

/**
 * Start workspace as admin.
 * @param {string} workspaceId
 * @returns {Promise<Object>}
 */
const startWorkspaceAsAdmin = async (workspaceId) => {
  try {
    const response = await axios.post(
      `${getCoderApiBase()}/workspaces/${workspaceId}/builds`,
      { transition: 'start' },
      { headers: getAdminHeaders() },
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      return getWorkspaceStatus(workspaceId, coderConfig.getCoderConfigSync().adminApiKey);
    }
    throw toCoderApiError(error, httpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Stop workspace as admin.
 * @param {string} workspaceId
 * @returns {Promise<Object>}
 */
const stopWorkspaceAsAdmin = async (workspaceId) => {
  try {
    const response = await axios.post(
      `${getCoderApiBase()}/workspaces/${workspaceId}/builds`,
      { transition: 'stop' },
      { headers: getAdminHeaders() },
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      return getWorkspaceStatus(workspaceId, coderConfig.getCoderConfigSync().adminApiKey);
    }
    throw toCoderApiError(error, httpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Delete workspace as admin.
 * @param {string} workspaceId
 * @returns {Promise<Object>}
 */
const deleteWorkspaceAsAdmin = async (workspaceId) => {
  try {
    const response = await axios.post(
      `${getCoderApiBase()}/workspaces/${workspaceId}/builds`,
      { transition: 'delete' },
      { headers: getAdminHeaders() },
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      return getWorkspaceStatus(workspaceId, coderConfig.getCoderConfigSync().adminApiKey);
    }
    throw toCoderApiError(error, httpStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 * If Coder reports the workspace build as running but the agent is not connected (or workspace health is false),
 * request stop then start once. Handles zombie state after the container was removed while the API still said "running".
 * @param {string} workspaceId
 * @param {string|null} sessionToken
 * @returns {Promise<Object>} Fresh workspace from GET after recovery attempt
 */
const restoreUnhealthyRunningWorkspace = async (workspaceId, sessionToken = null) => {
  const workspace = await getWorkspaceStatus(workspaceId, sessionToken);
  const buildStatus = workspace.latest_build?.status;
  if (buildStatus !== 'running') {
    return workspace;
  }

  const agent = pickFirstWorkspaceAgent(workspace);
  const agentUnhealthy = !agent || agent.status !== 'connected';
  const healthUnhealthy = workspace.health && workspace.health.healthy === false;
  if (!agentUnhealthy && !healthUnhealthy) {
    return workspace;
  }

  logger.warn(
    `Coder workspace ${workspaceId} reports running but agent/health is unhealthy (agent=${agent?.status ?? 'none'}, workspace_health=${workspace.health?.healthy}). Requesting stop/start recovery.`,
  );

  await stopWorkspace(workspaceId, sessionToken);
  await waitUntilWorkspaceBuildAllowsStart(workspaceId, sessionToken);
  await startWorkspace(workspaceId, sessionToken);
  return getWorkspaceStatus(workspaceId, sessionToken);
};

/**
 * Get workspace status
 * @param {string} workspaceId - Workspace ID
 * @param {string} sessionToken - User-scoped token used for user operations
 * @returns {Promise<Object>} Workspace object with status
 */
async function getWorkspaceStatus(workspaceId, sessionToken = null) {
  try {
    const response = await withTransientRetry(
      () =>
        axios.get(`${getCoderApiBase()}/workspaces/${workspaceId}`, {
          headers: getHeadersWithToken(sessionToken),
        }),
      { maxAttempts: 3, baseDelayMs: 250 }
    );

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
}

/**
 * First agent on a workspace (Coder populates this after resources are provisioned).
 * @param {Object} workspace - Workspace object from Coder API
 * @returns {Object|null} Agent object or null while build is still starting
 */
function pickFirstWorkspaceAgent(workspace) {
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
    const withAgents = workspace.latest_build.resources.find((resource) => resource.agents?.length);
    if (withAgents) {
      return withAgents.agents[0];
    }
  }
  if (workspace.resources) {
    const withAgents = workspace.resources.find((resource) => resource.agents?.length);
    if (withAgents) {
      return withAgents.agents[0];
    }
  }
  return null;
}

/**
 * Get workspace app URL for iframe embedding
 * @param {string} workspaceId - Workspace ID
 * @param {string} appSlug - App slug (default: "code-server")
 * @param {number} maxRetries - Maximum number of retries (default: 5)
 * @param {number} retryDelay - Delay between retries in ms (default: 2000)
 * @returns {Promise<string>} App URL
 */
const getWorkspaceAppUrl = async (
  workspaceId,
  appSlug = 'code-server',
  maxRetries = 5,
  retryDelay = 2000,
  sessionToken = null,
) => {
  const attemptFetch = async (attempt) => {
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
          await delay(retryDelay);
          return attemptFetch(attempt + 1);
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
          await delay(retryDelay);
          return attemptFetch(attempt + 1);
        }
      }

      // Construct URL (we can construct it even if app isn't in the response yet)
      const username = extractWorkspaceOwnerUsername(workspace);
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
          await delay(retryDelay);
          return attemptFetch(attempt + 1);
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
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get workspace app URL after all retries');
  };
  return attemptFetch(1);
};

/**
 * Query params Coder expects for path-based workspace apps (matches frontend iframe URL).
 * @param {string} appUrl
 * @param {string} sessionToken
 * @returns {string}
 */
const appendCoderSessionToAppUrl = (appUrl, sessionToken) => {
  if (!appUrl || !sessionToken) {
    return appUrl;
  }
  const addParam = (base, key, value) => {
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  };
  let out = addParam(appUrl, 'coder_session_token', sessionToken);
  return out;
};

const isProxyGatewayFailure = (status) => status === 502 || status === 503 || status === 504;
const isProxyAppNotReady = (status) => status === 404 || status === 425 || isProxyGatewayFailure(status);

/**
 * Poll the Coder app reverse-proxy until code-server is accepting traffic (avoids first-load 502).
 * Root cause class: code-server listening on 127.0.0.1 only or slow start — see coder/coder#12790, #12292.
 *
 * @param {string} appUrl
 * @param {string} sessionToken
 * @param {Object} [opts]
 * @param {number} [opts.maxAttempts]
 * @param {number} [opts.delayMs]
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<void>}
 */
const waitUntilCoderAppProxyReady = async (appUrl, sessionToken, opts = {}) => {
  const maxAttempts = opts.maxAttempts ?? 25;
  const delayMs = opts.delayMs ?? 1200;
  const timeoutMs = opts.timeoutMs ?? 8000;
  const url = appendCoderSessionToAppUrl(appUrl, sessionToken);

  const probeAttempt = async (attempt) => {
    try {
      const res = await axios.get(url, {
        timeout: timeoutMs,
        maxRedirects: 7,
        validateStatus: () => true,
        maxContentLength: 262144,
        maxBodyLength: 262144,
        headers: { Accept: '*/*' },
      });
      const st = res.status;
      if (st === 401 || st === 403) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          'Coder rejected the session while opening the VS Code app. Try preparing the workspace again.',
        );
      }
      // Treat 404 from app proxy as "not ready yet" (common while agent is still connecting).
      if (st >= 200 && st < 400) {
        logger.info(`Coder VS Code app proxy ready (HTTP ${st}) after ${attempt} attempt(s)`);
        return;
      }
      if (st >= 400 && st < 500 && !isProxyAppNotReady(st)) {
        throw new ApiError(
          httpStatus.BAD_GATEWAY,
          `Coder app returned HTTP ${st} while opening VS Code. Please retry prepare/open.`,
        );
      }
      logger.info(`Coder VS Code app proxy not ready (HTTP ${st}), attempt ${attempt}/${maxAttempts}; waiting ${delayMs}ms`);
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      logger.info(
        `Coder VS Code app proxy probe error (${err.message}), attempt ${attempt}/${maxAttempts}; waiting ${delayMs}ms`,
      );
    }

    if (attempt >= maxAttempts) {
      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        'VS Code is still starting or unreachable through Coder (proxy keeps returning errors). Try again in a few seconds.',
      );
    }

    await delay(delayMs);
    await probeAttempt(attempt + 1);
  };

  await probeAttempt(1);
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
  const attemptFetch = async (attempt) => {
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
      await delay(retryDelay);
      return attemptFetch(attempt + 1);
    }

    logger.error(
      `Workspace agent not found for workspace ${workspaceId} after ${maxRetries} attempts. Workspace: ${JSON.stringify(workspace, null, 2)}`,
    );
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Workspace agent not available yet. The workspace may still be starting; try again shortly.',
    );
  };
  return attemptFetch(1);
};

/**
 * Sanitize workspace name for Coder (one workspace per user per kind)
 * Coder requirements:
 * - 1-32 characters
 * - Only letters, numbers, and hyphens
 * - Must start and end with letter or number
 * @param {string} userId - User ID
 * @param {string} workspaceKind - language bucket (python/cpp/rust)
 * @returns {string} Sanitized workspace name
 */
const sanitizeWorkspaceName = (userId, workspaceKind = 'python') => {
  const normalizedId = normalizeIdForName(userId);
  const idPart = normalizedId.length <= 29 ? normalizedId : `${normalizedId.slice(0, 14)}${normalizedId.slice(-15)}`;
  const normalizedKind = String(workspaceKind || 'python')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') || 'python';
  const suffix = normalizedKind === 'cpp' ? 'cpp' : normalizedKind === 'rust' ? 'rs' : 'py';
  const name = `ws-${idPart}-${suffix}`;

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
const getTemplateId = async (templateName = 'docker-template-python') => {
  try {
    const response = await axios.get(`${getCoderApiBase()}/templates`, {
      headers: getAdminHeaders(),
    });

    const templates = extractCollection(response.data, 'templates');

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

module.exports = {
  ensureUserExists,
  generateSessionToken,
  getOrCreateUserScopedToken,
  getOrCreateWorkspace,
  startWorkspace,
  stopWorkspace,
  listAllWorkspacesAdmin,
  startWorkspaceAsAdmin,
  stopWorkspaceAsAdmin,
  deleteWorkspaceAsAdmin,
  listMyWorkspaces,
  deleteWorkspace,
  restoreUnhealthyRunningWorkspace,
  getWorkspaceStatus,
  getWorkspaceAppUrl,
  waitUntilCoderAppProxyReady,
  getTemplateId,
  sanitizeWorkspaceName,
  getWorkspaceAgentId,
  assertUserScopedPrototypePath,
  updateWorkspaceTtl,
};
