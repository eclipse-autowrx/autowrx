// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const fs = require('fs');
const path = require('path');
const coderService = require('./coder.service');
// const giteaService = require('./gitea.service');  // DISABLED - Gitea disabled
// const permissionSyncService = require('./permissionSync.service');  // DISABLED - Gitea disabled
const config = require('../config/config');
const { Prototype, Model, User } = require('../models');
const { UserRole } = require('../models');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
// const { decrypt } = require('../utils/encryption');  // DISABLED - Gitea disabled (was for github_token)

const looksLikeFileTree = (value) => {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      item && typeof item === 'object' && (item.type === 'file' || item.type === 'folder') && typeof item.name === 'string',
  );
};

const flattenFileTree = (items, basePath = '') => {
  const files = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const name = typeof item.name === 'string' ? item.name : '';
    if (!name) continue;

    const currentPath = basePath ? `${basePath}/${name}` : name;

    if (item.type === 'folder') {
      const children = Array.isArray(item.items) ? item.items : [];
      files.push(...flattenFileTree(children, currentPath));
      continue;
    }

    if (item.type === 'file') {
      const content = typeof item.content === 'string' ? item.content : '';
      files.push({ path: currentPath, content });
    }
  }
  return files;
};

const buildInitialRepoContentFromPrototype = (prototype) => {
  const code = typeof prototype?.code === 'string' ? prototype.code : '';

  // Multi-file templates store FileSystemItem[] as JSON string.
  try {
    const parsed = JSON.parse(code);
    if (looksLikeFileTree(parsed)) {
      const files = flattenFileTree(parsed).filter((f) => f.path && typeof f.content === 'string');
      if (files.length > 0) {
        return {
          files,
        };
      }
    }
  } catch {
    // Not JSON => treat as single-file code below.
  }

  // Single-file templates: store raw code. Seed a minimal project.
  if (code.trim().length > 0) {
    const mainFileByLanguage = prototype?.language === 'python' ? 'main.py' : 'main.txt';
    return {
      readme: `# ${prototype?.name || 'Prototype'}\n\nGenerated from single-file template.\n`,
      files: [
        {
          path: mainFileByLanguage,
          content: code,
        },
      ],
    };
  }

  return {};
};

/**
 * Prepare workspace for a prototype - complete orchestration flow
 * @param {string} userId - User ID
 * @param {string} prototypeId - Prototype ID
 * @returns {Promise<Object>} Workspace info with URL and session token
 */
const prepareWorkspaceForPrototype = async (userId, prototypeId) => {
  try {
    // 1. Get prototype and model data
    const prototype = await Prototype.findById(prototypeId).populate('model_id');
    if (!prototype) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
    }

    const model = await Model.findById(prototype.model_id);
    if (!model) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Model not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // // 2. Ensure Gitea organization exists (from model)
    // const orgName = model.gitea_org_name || giteaService.sanitizeOrgName(model._id.toString(), model.name);
    // if (!model.gitea_org_name) {
    //   await giteaService.ensureOrganizationExists(model._id.toString(), model.name);
    //   // Update model with org name
    //   model.gitea_org_name = orgName;
    //   await model.save();
    // } else {
    //   // Verify org still exists
    //   await giteaService.ensureOrganizationExists(model._id.toString(), model.name);
    // }

    // // 3. Ensure Gitea repository exists (from prototype)
    // const repoName = prototype.name;
    // const repoUrl = prototype.gitea_repo_url || giteaService.getRepositoryUrl(orgName, repoName);

    // // Check if repository was just created (we need to initialize it)
    // const repoJustCreated = !prototype.gitea_repo_url;

    // if (repoJustCreated) {
    //   logger.info(`Creating new repository ${orgName}/${repoName} for prototype ${prototypeId}`);
    //   await giteaService.ensureRepositoryExists(orgName, repoName, prototypeId);

    //   // Wait a moment for repository to be fully initialized by Gitea
    //   await new Promise((resolve) => setTimeout(resolve, 1500));

    //   // Initialize repository based on prototype template/code.
    //   // - Single-file templates store raw code (string) -> seed main.py
    //   // - Multi-file templates store a JSON string (FileSystemItem[]) -> seed full tree
    //   const initialContent = buildInitialRepoContentFromPrototype(prototype);
    //   logger.info(
    //     `Initializing repository ${orgName}/${repoName} with prototype content (hasCustomContent: ${!!(
    //       initialContent.readme ||
    //       initialContent.gitignore ||
    //       (initialContent.files && initialContent.files.length)
    //     )})`,
    //   );
    //   try {
    //     await giteaService.initializeRepository(orgName, repoName, initialContent);
    //     logger.info(`✓ Repository initialization completed for ${orgName}/${repoName}`);
    //   } catch (initError) {
    //     logger.error(`✗ Repository initialization failed for ${orgName}/${repoName}: ${initError.message}`);
    //     logger.error(`Init error stack: ${initError.stack}`);
    //     // Don't throw - continue even if initialization fails
    //   }

    //   // Update prototype with repo URL
    //   prototype.gitea_repo_url = repoUrl;
    //   await prototype.save();
    // } else {
    //   // Repository already exists, just verify it
    //   logger.info(`Repository ${orgName}/${repoName} already exists, verifying...`);
    //   await giteaService.ensureRepositoryExists(orgName, repoName, prototypeId);
    // }

    // // Get container-accessible URL with authentication for private repos
    // // Use Gitea admin credentials for workspace access
    // const giteaAdminUsername = config.gitea.adminUsername;
    // const giteaAdminToken = config.gitea.adminToken || config.gitea.adminPassword;
    // const containerRepoUrl = giteaService.getRepositoryUrlForContainer(
    //   orgName,
    //   repoName,
    //   giteaAdminUsername,
    //   giteaAdminToken,
    // );

    // // 4. Sync user permissions to Gitea (lazy sync)
    // await permissionSyncService.lazySyncUserPermissions(userId, model._id.toString());

    // const userRoles = await UserRole.find({ user: userId, ref: model._id }).populate('role');
    // const giteaUsername = user.coder_username || `user-${userId.toString().slice(-12)}`;

    // // Ensure Gitea user exists
    // await giteaService.ensureUserExists(giteaUsername, user.email);

    // // Sync permissions based on roles
    // for (const userRole of userRoles) {
    //   const roleName = userRole.role?.ref || userRole.role?.name || 'model_member';
    //   await giteaService.syncUserPermissions(orgName, giteaUsername, roleName);
    // }

    // 5. Ensure Coder user exists
    const coderUsername = user.coder_username || `user-${userId.toString().slice(-12)}`;
    if (!user.coder_username) {
      user.coder_username = coderUsername;
      await user.save();
    }

    const coderUser = await coderService.ensureUserExists(userId, coderUsername, user.email);

    // 6. Ensure prototype folder exists on host (bind-mount)
    const prototypesPath = config.prototypes?.path || '/tmp/autowrx/prototypes';
    const prototypeFolderHost = path.join(prototypesPath, userId.toString(), prototypeId.toString());
    try {
      fs.mkdirSync(prototypeFolderHost, { recursive: true });
      logger.info(`Ensured prototype folder exists: ${prototypeFolderHost}`);
    } catch (mkdirErr) {
      logger.warn(`Could not create prototype folder ${prototypeFolderHost}: ${mkdirErr.message}`);
      // Continue - mount may still work if parent exists
    }

    // 7. Get or create Coder workspace
    // Use sanitized workspace name (Coder requires 1-32 chars, alphanumeric + hyphens only)
    const workspaceName = coderService.sanitizeWorkspaceName(prototypeId);
    const templateId = await coderService.getTemplateId('docker-template');

    // DISABLED - Gitea disabled
    // let githubToken = null;
    // if (user.github_token) {
    //   try {
    //     githubToken = decrypt(user.github_token);
    //   } catch (error) {
    //     githubToken = user.github_token;
    //   }
    // }

    let workspace = prototype.coder_workspace_id
      ? await coderService.getWorkspaceStatus(prototype.coder_workspace_id).catch(() => null)
      : null;

    if (!workspace || workspace.latest_build?.status !== 'running') {
      workspace = await coderService.getOrCreateWorkspace(
        coderUser.id,
        workspaceName,
        templateId,
        prototypesPath,
        null, // githubToken - DISABLED
        null, // gitRepoUrl - DISABLED
      );

      // Update prototype with workspace info
      prototype.coder_workspace_id = workspace.id;
      prototype.coder_workspace_name = workspaceName;
      await prototype.save();
    }

    // 8. Start workspace if stopped (or refresh status if build is in progress)
    const currentStatus = workspace.latest_build?.status;
    if (currentStatus !== 'running') {
      // startWorkspace will handle the case where a build is already active
      const updatedWorkspace = await coderService.startWorkspace(workspace.id);
      workspace = updatedWorkspace;

      // If workspace is starting, wait a bit
      if (workspace.latest_build?.status === 'starting') {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // 9. Get workspace app URL
    // In some cases the workspace may be running but the agent/app is not yet
    // fully initialized. In that case getWorkspaceAppUrl can return a 404
    // ("Workspace agent not found"). We don't want to fail the whole prepare
    // flow just because the app URL is not ready yet – the frontend can keep
    // polling until the URL becomes available.
    let appUrl = null;
    try {
      appUrl = await coderService.getWorkspaceAppUrl(workspace.id, 'code-server');
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === httpStatus.NOT_FOUND) {
        logger.warn(
          `Workspace app URL not ready yet for workspace ${workspace.id}: ${error.message}. ` +
            'Continuing without app URL so the frontend can poll until it is available.',
        );
        appUrl = null;
      } else {
        throw error;
      }
    }

    // 10. Generate session token for user
    const sessionToken = await coderService.generateSessionToken(coderUsername);

    // Container path for this prototype (bind-mount: host prototypesPath -> /home/coder/prototypes)
    const folderPath = `/home/coder/prototypes/${userId}/${prototypeId}`;

    logger.info(`Workspace prepared for prototype ${prototypeId}: ${workspace.id}`);

    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      status: workspace.latest_build?.status || 'unknown',
      appUrl,
      sessionToken,
      repoUrl: null, // DISABLED - Gitea disabled
      folderPath,
    };
  } catch (error) {
    logger.error(`Failed to prepare workspace for prototype: ${error.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to prepare workspace: ${error.message}`);
  }
};

/**
 * Get workspace status for a prototype
 * @param {string} userId - User ID
 * @param {string} prototypeId - Prototype ID
 * @returns {Promise<Object>} Workspace status
 */
const getWorkspaceStatus = async (userId, prototypeId) => {
  try {
    const prototype = await Prototype.findById(prototypeId);
    if (!prototype) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
    }

    if (!prototype.coder_workspace_id) {
      return {
        exists: false,
        status: 'not_created',
      };
    }

    const workspace = await coderService.getWorkspaceStatus(prototype.coder_workspace_id);

    return {
      exists: true,
      workspaceId: workspace.id,
      status: workspace.latest_build?.status || 'unknown',
      transition: workspace.latest_build?.transition || null,
    };
  } catch (error) {
    logger.error(`Failed to get workspace status: ${error.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get workspace status: ${error.message}`);
  }
};

/**
 * Get workspace timings for a prototype
 * @param {string} userId - User ID
 * @param {string} prototypeId - Prototype ID
 * @returns {Promise<Object>} Workspace build timings
 */
const getWorkspaceTimings = async (userId, prototypeId) => {
  try {
    const prototype = await Prototype.findById(prototypeId);
    if (!prototype) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
    }

    if (!prototype.coder_workspace_id) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Workspace not found for this prototype. Create and start the workspace first.',
      );
    }

    const timings = await coderService.getWorkspaceTimings(prototype.coder_workspace_id);
    return timings;
  } catch (error) {
    logger.error(`Failed to get workspace timings: ${error.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get workspace timings: ${error.message}`);
  }
};

/**
 * Get workspace logs for a prototype (by resolving its workspace and agent)
 * @param {string} userId - User ID
 * @param {string} prototypeId - Prototype ID
 * @param {Object} options - Log query options (before, after, follow, no_compression, format)
 * @returns {Promise<any>} Workspace agent logs
 */
const getWorkspaceLogs = async (userId, prototypeId, options = {}) => {
  try {
    const prototype = await Prototype.findById(prototypeId);
    if (!prototype) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
    }

    if (!prototype.coder_workspace_id) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        'Workspace not found for this prototype. Create and start the workspace first.',
      );
    }

    const logs = await coderService.getWorkspaceLogsByWorkspaceId(prototype.coder_workspace_id, options);
    return logs;
  } catch (error) {
    logger.error(`Failed to get workspace logs: ${error.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get workspace logs: ${error.message}`);
  }
};

module.exports = {
  prepareWorkspaceForPrototype,
  getWorkspaceStatus,
  getWorkspaceTimings,
  getWorkspaceLogs,
};
