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
      // If the tree is wrapped in a single root folder (common in templates),
      // unwrap it so files are written directly to the prototype folder root.
      const shouldUnwrapRootFolder =
        Array.isArray(parsed) &&
        parsed.length === 1 &&
        parsed[0] &&
        typeof parsed[0] === 'object' &&
        parsed[0].type === 'folder' &&
        Array.isArray(parsed[0].items);

      const flattened = shouldUnwrapRootFolder ? flattenFileTree(parsed[0].items) : flattenFileTree(parsed);
      const files = flattened.filter((f) => f.path && typeof f.content === 'string');
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
 * Sanitize prototype name for use as folder name
 * @param {string} name - Prototype name
 * @returns {string} Sanitized folder name
 */
const sanitizePrototypeFolderName = (name) => {
  if (!name || typeof name !== 'string') return 'unnamed-prototype';
  const sanitized = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
  return sanitized || 'unnamed-prototype';
};

/**
 * Seed initial code files into a prototype folder (only if folder is empty)
 * @param {string} folderPath - Host folder path
 * @param {Object} prototype - Prototype document
 */
const seedPrototypeFiles = (folderPath, prototype) => {
  try {
    const existingFiles = fs.readdirSync(folderPath);
    if (existingFiles.length > 0) {
      logger.info(`Folder ${folderPath} already has ${existingFiles.length} file(s), skipping seed`);
      return;
    }

    const content = buildInitialRepoContentFromPrototype(prototype);

    if (content.readme) {
      fs.writeFileSync(path.join(folderPath, 'README.md'), content.readme);
    }

    if (content.files && content.files.length > 0) {
      content.files.forEach((file) => {
        const filePath = path.join(folderPath, file.path);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, file.content);
      });
      logger.info(`Seeded ${content.files.length} file(s) into ${folderPath}`);
    }
  } catch (err) {
    logger.warn(`Failed to seed prototype files: ${err.message}`);
  }
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

    // 6. Prepare prototype folder on host (per-user dir, prototype name as subfolder)
    const prototypesPath = config.prototypes?.path || '/tmp/autowrx/prototypes';
    const userHostPath = path.join(prototypesPath, userId.toString());
    const prototypeFolderName = sanitizePrototypeFolderName(prototype.name);
    const prototypeFolderHost = path.join(userHostPath, prototypeFolderName);

    try {
      fs.mkdirSync(prototypeFolderHost, { recursive: true });
      logger.info(`Ensured prototype folder exists: ${prototypeFolderHost}`);
    } catch (mkdirErr) {
      logger.warn(`Could not create prototype folder ${prototypeFolderHost}: ${mkdirErr.message}`);
    }

    // 7. Seed initial code files (only if folder is empty)
    seedPrototypeFiles(prototypeFolderHost, prototype);

    // 8. Get or create ONE workspace per user (reuse across prototypes)
    const workspaceName = coderService.sanitizeWorkspaceName(userId);
    const templateId = await coderService.getTemplateId('docker-template');

    let workspace = user.coder_workspace_id
      ? await coderService.getWorkspaceStatus(user.coder_workspace_id).catch(() => null)
      : null;

    if (!workspace) {
      workspace = await coderService.getOrCreateWorkspace(
        coderUser.id,
        workspaceName,
        templateId,
        userHostPath,
      );

      user.coder_workspace_id = workspace.id;
      user.coder_workspace_name = workspaceName;
      await user.save();
    }

    // 9. Start workspace if stopped
    const currentStatus = workspace.latest_build?.status;
    if (currentStatus !== 'running') {
      const updatedWorkspace = await coderService.startWorkspace(workspace.id);
      workspace = updatedWorkspace;

      if (workspace.latest_build?.status === 'starting') {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // 10. Get workspace app URL
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

    // 11. Generate session token for user
    const sessionToken = await coderService.generateSessionToken(coderUsername);

    // Container path: user host path is mounted at /home/coder/prototypes
    const folderPath = `/home/coder/prototypes/${prototypeFolderName}`;

    logger.info(`Workspace prepared for prototype ${prototypeId}: ${workspace.id}, folder: ${folderPath}`);

    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      status: workspace.latest_build?.status || 'unknown',
      appUrl,
      sessionToken,
      repoUrl: null,
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
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    if (!user.coder_workspace_id) {
      return {
        exists: false,
        status: 'not_created',
      };
    }

    const workspace = await coderService.getWorkspaceStatus(user.coder_workspace_id);

    return {
      exists: true,
      workspaceId: workspace.id,
      status: workspace.latest_build?.status || 'unknown',
      transition: workspace.latest_build?.transition || null,
    };
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return { exists: false, status: 'not_created' };
    }
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
    const user = await User.findById(userId);
    if (!user?.coder_workspace_id) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Workspace not found. Create and start the workspace first.');
    }

    const timings = await coderService.getWorkspaceTimings(user.coder_workspace_id);
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
    const user = await User.findById(userId);
    if (!user?.coder_workspace_id) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Workspace not found. Create and start the workspace first.');
    }

    const logs = await coderService.getWorkspaceLogsByWorkspaceId(user.coder_workspace_id, options);
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
