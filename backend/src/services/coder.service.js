// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const axios = require('axios');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const CODER_API_BASE = `${config.coder.url}/api/v2`;

/**
 * Get Coder API headers with admin token
 */
const getAdminHeaders = () => ({
  'Coder-Session-Token': config.coder.adminApiKey,
  'Content-Type': 'application/json',
});

/**
 * Get default organization (Coder Community Edition only supports one default org)
 * @returns {Promise<string>} Organization ID
 */
const getOrCreateDefaultOrganization = async () => {
  try {
    // Get all organizations
    const orgsResponse = await axios.get(`${CODER_API_BASE}/organizations`, {
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
      logger.debug(`Organizations: ${JSON.stringify(organizations.map(org => ({ name: org.name, id: org.id, is_default: org.is_default })))}`);
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
        const usersResponse = await axios.get(`${CODER_API_BASE}/users`, {
          headers: getAdminHeaders(),
        });
        
        const users = Array.isArray(usersResponse.data) 
          ? usersResponse.data 
          : (usersResponse.data?.users || []);
        
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
      'No organizations found in Coder instance. Please ensure Coder is properly initialized with at least one organization.'
    );
  } catch (error) {
    logger.error(`Failed to get default organization: ${error.message}`);
    if (error.response) {
      logger.error(`Organization API error - Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      logger.error(`Request URL: ${error.config?.url}, Headers: ${JSON.stringify(error.config?.headers)}`);
    } else if (error.request) {
      logger.error(`No response received from Coder API. Request: ${JSON.stringify(error.request)}`);
    }
    throw error;
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
    const usersResponse = await axios.get(`${CODER_API_BASE}/users`, {
      headers: getAdminHeaders(),
      params: { q: username },
    });

    const existingUser = usersResponse.data.users?.find((u) => u.username === username || u.email === email);

    if (existingUser) {
      logger.info(`Coder user already exists: ${username}`);
      return existingUser;
    }

    // Get or create default organization
    const organizationId = await getOrCreateDefaultOrganization();

    // Create new user with organization
    const createResponse = await axios.post(
      `${CODER_API_BASE}/users`,
      {
        email,
        username,
        password: generateRandomPassword(), // Random password, user won't use it
        login_type: 'password',
        organization_ids: [organizationId], // Required by Coder API v2
      },
      { headers: getAdminHeaders() }
    );

    logger.info(`Created Coder user: ${username} in organization ${organizationId}`);
    return createResponse.data;
  } catch (error) {
    logger.error(`Failed to ensure Coder user exists: ${error.message}`);
    logger.error(`Error details: ${JSON.stringify({
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      code: error.code,
    })}`);
    if (error.response) {
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Coder API error: ${error.response.data?.message || error.message || JSON.stringify(error.response.data)}`
      );
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        `Cannot connect to Coder at ${config.coder.url}. Is Coder running?`
      );
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Coder service error: ${error.message}`
    );
  }
};

/**
 * Generate a session token for a user (impersonation)
 * Note: Token generation may not be available in all Coder versions.
 * For iframe embedding, the workspace URL can be used directly without a token.
 * @param {string} coderUsername - Coder username
 * @returns {Promise<string|null>} Session token or null if not available
 */
const generateSessionToken = async (coderUsername) => {
  try {
    // Try the API v2 endpoint: /users/{user}/tokens
    // This creates a long-lived API token for the user
    const response = await axios.post(
      `${CODER_API_BASE}/users/${coderUsername}/tokens`,
      {
        name: `autowrx-session-${Date.now()}`,
        lifetime: 86400000, // 24 hours in milliseconds
        scope: 'workspace:*', // Full workspace access
      },
      { headers: getAdminHeaders() }
    );

    // The response should contain a key field with the token
    const token = response.data.key || response.data.id || response.data;
    if (!token) {
      logger.warn(`Token creation succeeded but no token was returned for user: ${coderUsername}`);
      return null;
    }

    logger.info(`Generated Coder session token for user: ${coderUsername}`);
    return typeof token === 'string' ? token : JSON.stringify(token);
  } catch (error) {
    // If endpoint doesn't exist (404), token generation is not available
    // This is OK - workspace URLs can be used directly in iframes
    if (error.response?.status === 404) {
      logger.warn(`Token generation endpoint not available (404). Workspace URL can be used directly without token.`);
      return null;
    }

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
 * @param {string} gitRepoUrl - Git repository URL
 * @param {string} githubToken - Optional GitHub token
 * @returns {Promise<Object>} Workspace object
 */
const getOrCreateWorkspace = async (coderUserId, workspaceName, templateId, gitRepoUrl, githubToken = null) => {
  try {
    // Get organization ID (required for API v2)
    const organizationId = await getOrCreateDefaultOrganization();

    // Check if workspace exists
    const workspacesResponse = await axios.get(`${CODER_API_BASE}/workspaces`, {
      headers: getAdminHeaders(),
      params: { q: workspaceName },
    });

    // Handle both response formats: array directly or wrapped in 'workspaces' property
    let workspaces = [];
    if (Array.isArray(workspacesResponse.data)) {
      workspaces = workspacesResponse.data;
    } else if (workspacesResponse.data?.workspaces && Array.isArray(workspacesResponse.data.workspaces)) {
      workspaces = workspacesResponse.data.workspaces;
    }

    const existingWorkspace = workspaces.find((w) => w.name === workspaceName);

    if (existingWorkspace) {
      logger.info(`Coder workspace already exists: ${workspaceName}`);
      return existingWorkspace;
    }

    // Create new workspace
    const richParameterValues = [
      {
        name: 'git_repo',
        value: gitRepoUrl,
      },
    ];

    if (githubToken) {
      richParameterValues.push({
        name: 'github_token',
        value: githubToken,
      });
    }

    // Use the correct API v2 endpoint format: /organizations/{organization}/members/{user}/workspaces
    const createResponse = await axios.post(
      `${CODER_API_BASE}/organizations/${organizationId}/members/${coderUserId}/workspaces`,
      {
        template_id: templateId,
        name: workspaceName,
        rich_parameter_values: richParameterValues,
      },
      { headers: getAdminHeaders() }
    );

    logger.info(`Created Coder workspace: ${workspaceName} in organization ${organizationId}`);
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
      
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Coder API error: ${error.response.data?.message || error.message || JSON.stringify(error.response.data)}`
      );
    }
    throw error;
  }
};

/**
 * Start a stopped workspace
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Object>} Build object or workspace status
 */
const startWorkspace = async (workspaceId) => {
  try {
    // First check current workspace status
    const workspace = await getWorkspaceStatus(workspaceId);
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
      `${CODER_API_BASE}/workspaces/${workspaceId}/builds`,
      { transition: 'start' },
      { headers: getAdminHeaders() }
    );

    logger.info(`Started Coder workspace: ${workspaceId}`);
    return response.data;
  } catch (error) {
    // Handle 409 Conflict - build already active
    if (error.response?.status === 409) {
      logger.info(`Coder workspace ${workspaceId} build is already active, fetching status...`);
      // Return current workspace status instead of erroring
      return await getWorkspaceStatus(workspaceId);
    }

    logger.error(`Failed to start Coder workspace: ${error.message}`);
    if (error.response) {
      logger.error(`Start workspace error - Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Coder API error: ${error.response.data?.message || error.message}`
      );
    }
    throw error;
  }
};

/**
 * Get workspace status
 * @param {string} workspaceId - Workspace ID
 * @returns {Promise<Object>} Workspace object with status
 */
const getWorkspaceStatus = async (workspaceId) => {
  try {
    const response = await axios.get(`${CODER_API_BASE}/workspaces/${workspaceId}`, {
      headers: getAdminHeaders(),
    });

    return response.data;
  } catch (error) {
    logger.error(`Failed to get Coder workspace status: ${error.message}`);
    if (error.response) {
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Coder API error: ${error.response.data?.message || error.message}`
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
const getWorkspaceAppUrl = async (workspaceId, appSlug = 'code-server', maxRetries = 5, retryDelay = 2000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const workspace = await getWorkspaceStatus(workspaceId);

      // Log workspace structure for debugging
      if (attempt === 1) {
        logger.debug(`Workspace structure: ${JSON.stringify({
          id: workspace.id,
          name: workspace.name,
          latest_build: workspace.latest_build ? {
            id: workspace.latest_build.id,
            status: workspace.latest_build.status,
            resources_count: workspace.latest_build.resources?.length || 0,
          } : null,
          resources: workspace.resources?.length || 0,
          agents: workspace.agents?.length || 0,
        })}`);
      }

      // Try multiple ways to find the agent
      let agent = null;
      let apps = null;

      // Method 1: latest_build.resources[0].agents[0]
      if (workspace.latest_build?.resources?.[0]?.agents?.[0]) {
        agent = workspace.latest_build.resources[0].agents[0];
        apps = agent.apps;
      }
      // Method 2: resources[0].agents[0] (direct on workspace)
      else if (workspace.resources?.[0]?.agents?.[0]) {
        agent = workspace.resources[0].agents[0];
        apps = agent.apps;
      }
      // Method 3: agents[0] (direct on workspace)
      else if (workspace.agents?.[0]) {
        agent = workspace.agents[0];
        apps = agent.apps;
      }
      // Method 4: Search through all resources
      else if (workspace.latest_build?.resources) {
        for (const resource of workspace.latest_build.resources) {
          if (resource.agents && resource.agents.length > 0) {
            agent = resource.agents[0];
            apps = agent.apps;
            break;
          }
        }
      }
      // Method 5: Search through workspace resources
      else if (workspace.resources) {
        for (const resource of workspace.resources) {
          if (resource.agents && resource.agents.length > 0) {
            agent = resource.agents[0];
            apps = agent.apps;
            break;
          }
        }
      }

      if (!agent) {
        if (attempt < maxRetries) {
          logger.info(`Agent not found yet (attempt ${attempt}/${maxRetries}), waiting ${retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // Log full workspace structure for debugging
        logger.error(`Workspace agent not found after ${maxRetries} attempts. Full workspace structure: ${JSON.stringify(workspace, null, 2)}`);
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
      
      if (!username || !workspaceName) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Cannot construct workspace URL: missing owner or workspace name');
      }

      const url = `${config.coder.url}/@${username}/${workspaceName}/apps/${appSlug}`;
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
 * Sanitize workspace name for Coder
 * Coder requirements:
 * - 1-32 characters
 * - Only letters, numbers, and hyphens
 * - Must start and end with letter or number
 * @param {string} prototypeId - Prototype ID
 * @returns {string} Sanitized workspace name
 */
const sanitizeWorkspaceName = (prototypeId) => {
  // Use shorter prefix and last 12 chars of ID to stay within 32 char limit
  // Format: "proto-{last12chars}" = max 18 chars
  const shortId = prototypeId.toString().slice(-12);
  const name = `proto-${shortId}`;
  
  // Ensure it only contains allowed characters (a-z, 0-9, -)
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32); // Enforce max length
  
  return sanitized || `proto-${shortId}`;
};

/**
 * Get template ID by name (helper function)
 * @param {string} templateName - Template name
 * @returns {Promise<string>} Template ID
 */
const getTemplateId = async (templateName = 'docker-template') => {
  try {
    const response = await axios.get(`${CODER_API_BASE}/templates`, {
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
      logger.error(`Template ${templateName} not found. Available templates: ${templates.map(t => t.name).join(', ')}`);
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
 * Generate random password for Coder users (they won't use it)
 */
const generateRandomPassword = () => {
  return `pwd_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

module.exports = {
  ensureUserExists,
  generateSessionToken,
  getOrCreateWorkspace,
  startWorkspace,
  getWorkspaceStatus,
  getWorkspaceAppUrl,
  getTemplateId,
  sanitizeWorkspaceName,
};
