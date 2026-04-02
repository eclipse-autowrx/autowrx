// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const GITEA_API_BASE = `${config.gitea.url}/api/v1`;

/**
 * Get Gitea API headers with admin token or basic auth
 */
const getAuthHeaders = () => {
  if (config.gitea.adminToken) {
    return {
      Authorization: `token ${config.gitea.adminToken}`,
      'Content-Type': 'application/json',
    };
  }
  // Fallback to basic auth if token not available
  const credentials = Buffer.from(`${config.gitea.adminUsername}:${config.gitea.adminPassword}`).toString('base64');
  return {
    Authorization: `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Ensure organization exists in Gitea (maps to Model)
 * @param {string} modelId - Model ID
 * @param {string} modelName - Model name (sanitized for org name)
 * @returns {Promise<Object>} Gitea organization object
 */
const ensureOrganizationExists = async (modelId, modelName) => {
  try {
    // Sanitize org name (Gitea org names have restrictions)
    const orgName = sanitizeOrgName(modelId, modelName);

    // Check if org exists
    try {
      const response = await axios.get(`${GITEA_API_BASE}/orgs/${orgName}`, {
        headers: getAuthHeaders(),
      });
      logger.info(`Gitea organization already exists: ${orgName}`);
      return response.data;
    } catch (error) {
      if (error.response?.status !== 404) {
        throw error;
      }
    }

    // Create new organization
    const createResponse = await axios.post(
      `${GITEA_API_BASE}/orgs`,
      {
        username: orgName,
        full_name: modelName,
        description: `Organization for model: ${modelName}`,
        visibility: 'private',
      },
      { headers: getAuthHeaders() },
    );

    logger.info(`Created Gitea organization: ${orgName}`);
    return createResponse.data;
  } catch (error) {
    logger.error(`Failed to ensure Gitea organization exists: ${error.message}`);
    if (error.response) {
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Gitea API error: ${error.response.data?.message || error.message}`,
      );
    }
    throw error;
  }
};

/**
 * Ensure repository exists in Gitea (maps to Prototype)
 * @param {string} orgName - Organization name
 * @param {string} repoName - Repository name (sanitized)
 * @param {string} prototypeId - Prototype ID
 * @returns {Promise<Object>} Gitea repository object
 */
const ensureRepositoryExists = async (orgName, repoName, prototypeId) => {
  try {
    const sanitizedRepoName = sanitizeRepoName(repoName);

    // Check if repo exists
    try {
      const response = await axios.get(`${GITEA_API_BASE}/repos/${orgName}/${sanitizedRepoName}`, {
        headers: getAuthHeaders(),
      });
      logger.info(`Gitea repository already exists: ${orgName}/${sanitizedRepoName}`);
      return { ...response.data, _wasCreated: false };
    } catch (error) {
      if (error.response?.status !== 404) {
        throw error;
      }
    }

    // Create new repository
    const createResponse = await axios.post(
      `${GITEA_API_BASE}/orgs/${orgName}/repos`,
      {
        name: sanitizedRepoName,
        description: `Repository for prototype: ${repoName}`,
        private: true,
        auto_init: true,
        default_branch: 'main',
      },
      { headers: getAuthHeaders() },
    );

    logger.info(`Created Gitea repository: ${orgName}/${sanitizedRepoName}`);
    return { ...createResponse.data, _wasCreated: true };
  } catch (error) {
    logger.error(`Failed to ensure Gitea repository exists: ${error.message}`);
    if (error.response) {
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Gitea API error: ${error.response.data?.message || error.message}`,
      );
    }
    throw error;
  }
};

/**
 * Get repository clone URL
 * @param {string} orgName - Organization name
 * @param {string} repoName - Repository name
 * @returns {string} Clone URL
 */
/**
 * Get repository URL for external access (browser, API)
 * @param {string} orgName - Organization name
 * @param {string} repoName - Repository name
 * @returns {string} Repository URL
 */
const getRepositoryUrl = (orgName, repoName) => {
  const sanitizedRepoName = sanitizeRepoName(repoName);
  return `${config.gitea.url}/${orgName}/${sanitizedRepoName}.git`;
};

/**
 * Get repository URL for Docker container access (uses service name)
 * @param {string} orgName - Organization name
 * @param {string} repoName - Repository name
 * @param {string} username - Optional username for authentication
 * @param {string} token - Optional token/password for authentication
 * @returns {string} Repository URL with Docker network hostname
 */
const getRepositoryUrlForContainer = (orgName, repoName, username = null, token = null) => {
  const sanitizedRepoName = sanitizeRepoName(repoName);
  // Replace localhost:3000 with gitea:3000 for Docker network access
  let url = config.gitea.url.replace('localhost:3000', 'gitea:3000');
  url = url.replace('127.0.0.1:3000', 'gitea:3000');

  // Add authentication if provided
  if (username && token) {
    const host = url.replace(/^https?:\/\//, '').split('/')[0];
    url = url.replace(host, `${username}:${token}@${host}`);
  }

  return `${url}/${orgName}/${sanitizedRepoName}.git`;
};

/**
 * Sync user permissions to Gitea teams
 * @param {string} orgName - Organization name
 * @param {string} giteaUsername - Gitea username
 * @param {string} role - Role name (model_contributor or model_member)
 * @returns {Promise<void>}
 */
const syncUserPermissions = async (orgName, giteaUsername, role) => {
  try {
    // Get organization teams
    const teamsResponse = await axios.get(`${GITEA_API_BASE}/orgs/${orgName}/teams`, {
      headers: getAuthHeaders(),
    });

    const teams = teamsResponse.data || [];

    // Determine team name based on role
    let teamName;
    if (role === 'model_contributor' || role === 'model_member') {
      teamName = 'Contributors'; // Write access
    } else {
      teamName = 'Readers'; // Read-only access
    }

    // Find or create team
    let team = teams.find((t) => t.name === teamName);
    if (!team) {
      // Create team
      const createTeamResponse = await axios.post(
        `${GITEA_API_BASE}/orgs/${orgName}/teams`,
        {
          name: teamName,
          description: `${teamName} team for ${orgName}`,
          permission: teamName === 'Contributors' ? 'write' : 'read',
          includes_all_repositories: true,
        },
        { headers: getAuthHeaders() },
      );
      team = createTeamResponse.data;
      logger.info(`Created Gitea team: ${orgName}/${teamName}`);
    }

    // Add user to team
    try {
      await axios.put(`${GITEA_API_BASE}/teams/${team.id}/members/${giteaUsername}`, {}, { headers: getAuthHeaders() });
      logger.info(`Added user ${giteaUsername} to team ${teamName} in org ${orgName}`);
    } catch (error) {
      if (error.response?.status === 204) {
        // User already in team (204 No Content is success for PUT)
        logger.info(`User ${giteaUsername} already in team ${teamName}`);
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error(`Failed to sync user permissions: ${error.message}`);
    if (error.response) {
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Gitea API error: ${error.response.data?.message || error.message}`,
      );
    }
    throw error;
  }
};

/**
 * Initialize repository with initial files
 * @param {string} orgName - Organization name
 * @param {string} repoName - Repository name
 * @param {Object} initialContent - Initial content (README, .gitignore, etc.)
 * @returns {Promise<void>}
 */
/**
 * Get default Python project content (Python Multiple Files structure)
 */
const getDefaultPythonProjectContent = () => {
  const DEFAULT_PYTHON_APP = `import time
import asyncio
import signal

from sdv.vdb.reply import DataPointReply
from sdv.vehicle_app import VehicleApp
from vehicle import Vehicle, vehicle

class TestApp(VehicleApp):

    def __init__(self, vehicle_client: Vehicle):
        super().__init__()
        self.Vehicle = vehicle_client

    async def on_start(self):
        # on app started, this function will be trigger, your logic SHOULD start from HERE
        while True:
            # sleep for 2 second
            await asyncio.sleep(2)
            # write an actuator signal with value
            await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(True)
            await asyncio.sleep(1)
            # read an actuator back
            value = (await self.Vehicle.Body.Lights.Beam.Low.IsOn.get()).value
            print("Light value ", value)
            
            await asyncio.sleep(2)
            # write an actuator signal with value
            await self.Vehicle.Body.Lights.Beam.Low.IsOn.set(False)
            await asyncio.sleep(1)
            # read an actuator back
            value = (await self.Vehicle.Body.Lights.Beam.Low.IsOn.get()).value
            print("Light value ", value)

async def main():
    vehicle_app = TestApp(vehicle)
    await vehicle_app.run()


LOOP = asyncio.get_event_loop()
LOOP.add_signal_handler(signal.SIGTERM, LOOP.stop)
LOOP.run_until_complete(main())
LOOP.close()`;

  return {
    'README.md':
      '# Python Project\n\nA simple Python project with multiple files.\n\n## Features\n- Multiple Python modules\n- Configuration file\n- Requirements file\n- Basic project structure',
    'requirements.txt': 'requests==2.31.0',
    'main.py': DEFAULT_PYTHON_APP,
    '.gitignore': `# Python\n__pycache__/\n*.py[cod]\n*$py.class\n*.so\n.Python\nvenv/\nenv/\n\n# C++\n*.o\n*.a\n*.so\n*.exe\nbuild/\ndist/\n`,
  };
};

const initializeRepository = async (orgName, repoName, initialContent = {}) => {
  try {
    const sanitizedRepoName = sanitizeRepoName(repoName);

    logger.info(
      `initializeRepository called for ${orgName}/${sanitizedRepoName} with initialContent keys: ${Object.keys(initialContent).join(', ') || 'none'}`,
    );

    // If no custom content provided, use default Python project structure
    const hasCustomContent = initialContent.readme || initialContent.gitignore || initialContent.files;

    if (!hasCustomContent) {
      const defaultFiles = getDefaultPythonProjectContent();

      logger.info(
        `Initializing repository ${orgName}/${sanitizedRepoName} with default Python project structure (${Object.keys(defaultFiles).length} files)`,
      );

      // Create all default files
      // For README.md, force update if it exists (from auto_init)
      // For other files, create them normally
      const fileResults = [];
      for (const [filePath, content] of Object.entries(defaultFiles)) {
        try {
          const forceUpdate = filePath === 'README.md'; // Force update README to use our content
          logger.info(`Creating file: ${filePath} (forceUpdate: ${forceUpdate})`);
          await createFileInRepo(orgName, sanitizedRepoName, filePath, content, 'main', forceUpdate);
          fileResults.push({ file: filePath, status: 'success' });
          logger.info(`✓ Successfully created/updated file: ${filePath}`);
        } catch (fileError) {
          fileResults.push({ file: filePath, status: 'error', error: fileError.message });
          logger.error(`✗ Failed to create file ${filePath}: ${fileError.message}`);
          if (fileError.response) {
            logger.error(`  Status: ${fileError.response.status}, Data: ${JSON.stringify(fileError.response.data)}`);
          }
          // Continue with other files even if one fails
        }
      }

      const successCount = fileResults.filter((r) => r.status === 'success').length;
      const errorCount = fileResults.filter((r) => r.status === 'error').length;
      logger.info(`Repository initialization completed: ${successCount} files created, ${errorCount} errors`);

      if (errorCount > 0) {
        logger.warn(`Some files failed to create. Results: ${JSON.stringify(fileResults)}`);
      }

      return;
    }

    // Create README if provided
    if (initialContent.readme) {
      await createFileInRepo(orgName, sanitizedRepoName, 'README.md', initialContent.readme, 'main');
    }

    // Create .gitignore if provided
    if (initialContent.gitignore) {
      await createFileInRepo(orgName, sanitizedRepoName, '.gitignore', initialContent.gitignore, 'main');
    }

    // Create additional files if provided
    if (initialContent.files && Array.isArray(initialContent.files)) {
      for (const file of initialContent.files) {
        await createFileInRepo(orgName, sanitizedRepoName, file.path, file.content, file.branch || 'main');
      }
    }
  } catch (error) {
    logger.error(`Failed to initialize repository: ${error.message}`);
    logger.error(`Error stack: ${error.stack}`);
    // Don't throw - initialization is optional
  }
};

/**
 * Create file in repository
 */
const createFileInRepo = async (orgName, repoName, filePath, content, branch = 'main', forceUpdate = false) => {
  try {
    let existingFileSha = null;

    // Check if file exists
    try {
      const existingFileResponse = await axios.get(`${GITEA_API_BASE}/repos/${orgName}/${repoName}/contents/${filePath}`, {
        headers: getAuthHeaders(),
        params: { ref: branch },
      });

      if (existingFileResponse.data && existingFileResponse.data.sha) {
        existingFileSha = existingFileResponse.data.sha;

        // If file exists and we don't want to force update, skip
        if (!forceUpdate) {
          logger.info(`File ${filePath} already exists in ${orgName}/${repoName}, skipping`);
          return;
        }
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        throw error;
      }
      // File doesn't exist, we'll create it
    }

    // Create or update file
    const contentBase64 = Buffer.from(content).toString('base64');
    const requestBody = {
      message: existingFileSha ? `Update ${filePath}` : `Add ${filePath}`,
      content: contentBase64,
      branch: branch,
    };

    // If updating existing file, include the SHA (required by Gitea API)
    if (existingFileSha) {
      requestBody.sha = existingFileSha;
    }

    logger.debug(
      `Creating/updating file ${filePath} in ${orgName}/${repoName} (branch: ${branch}, has SHA: ${!!existingFileSha})`,
    );

    const response = await axios.post(`${GITEA_API_BASE}/repos/${orgName}/${repoName}/contents/${filePath}`, requestBody, {
      headers: getAuthHeaders(),
    });

    logger.info(
      `${existingFileSha ? 'Updated' : 'Created'} file ${filePath} in ${orgName}/${repoName} - Commit: ${response.data?.commit?.sha || 'unknown'}`,
    );
  } catch (error) {
    logger.error(`Failed to create/update file in repository: ${error.message}`);
    if (error.response) {
      logger.error(`Error response: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

/**
 * Ensure Gitea user exists
 * @param {string} username - Username
 * @param {string} email - Email
 * @param {string} password - Password (optional, will generate if not provided)
 * @returns {Promise<Object>} Gitea user object
 */
const ensureUserExists = async (username, email, password = null) => {
  try {
    // Check if user exists
    try {
      const response = await axios.get(`${GITEA_API_BASE}/users/${username}`, {
        headers: getAuthHeaders(),
      });
      logger.info(`Gitea user already exists: ${username}`);
      return response.data;
    } catch (error) {
      if (error.response?.status !== 404) {
        throw error;
      }
    }

    // Create new user
    const userPassword = password || generateRandomPassword();
    const createResponse = await axios.post(
      `${GITEA_API_BASE}/admin/users`,
      {
        username,
        email,
        password: userPassword,
        must_change_password: false,
        send_notify: false,
      },
      { headers: getAuthHeaders() },
    );

    logger.info(`Created Gitea user: ${username}`);
    return createResponse.data;
  } catch (error) {
    logger.error(`Failed to ensure Gitea user exists: ${error.message}`);
    if (error.response) {
      throw new ApiError(
        error.response.status || httpStatus.INTERNAL_SERVER_ERROR,
        `Gitea API error: ${error.response.data?.message || error.message}`,
      );
    }
    throw error;
  }
};

/**
 * Sanitize organization name for Gitea
 */
const sanitizeOrgName = (modelId, modelName) => {
  // Use model ID as base, sanitize model name as fallback
  const base = `model-${modelId.toString().slice(-12)}`;
  const sanitized = modelName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return sanitized || base;
};

/**
 * Sanitize repository name for Gitea
 */
const sanitizeRepoName = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
};

/**
 * Generate random password
 */
const generateRandomPassword = () => {
  return `pwd_${crypto.randomBytes(24).toString('base64url')}`;
};

module.exports = {
  ensureOrganizationExists,
  ensureRepositoryExists,
  getRepositoryUrl,
  getRepositoryUrlForContainer,
  syncUserPermissions,
  initializeRepository,
  ensureUserExists,
  sanitizeOrgName,
  sanitizeRepoName,
};
