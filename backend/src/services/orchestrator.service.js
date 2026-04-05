// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const fs = require('fs');
const path = require('path');
const httpStatus = require('http-status');
const coderService = require('./coder.service');
// const giteaService = require('./gitea.service');  // DISABLED - Gitea disabled
// const permissionSyncService = require('./permissionSync.service');  // DISABLED - Gitea disabled
const { Prototype, Model, User } = require('../models');
// const { UserRole } = require('../models');  // DISABLED - Gitea disabled
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const coderConfig = require('../utils/coderConfig');
// const { decrypt } = require('../utils/encryption');  // DISABLED - Gitea disabled (was for github_token)

// Host/container UID mismatch is common in local deployments. We keep
// permissive modes so the workspace user can write without manual chmod.
const PROTOTYPES_DIR_MODE = 0o777;
const PROTOTYPES_FILE_MODE = 0o666;
const PROTOTYPES_LINUX_UID = 1000;
const PROTOTYPES_LINUX_GID = 1000;

const normalizeIdForName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const chmodSafe = (targetPath, mode) => {
  try {
    fs.chmodSync(targetPath, mode);
  } catch (err) {
    logger.warn(`chmod failed for ${targetPath}: ${err.message}`);
  }
};

const chownSafe = (targetPath, uid, gid) => {
  try {
    fs.chownSync(targetPath, uid, gid);
  } catch (err) {
    logger.warn(`chown failed for ${targetPath} -> ${uid}:${gid}: ${err.message}`);
  }
};

const setOwnershipAndPermissionsRecursive = (rootPath, uid, gid) => {
  try {
    const stat = fs.lstatSync(rootPath);
    if (stat.isDirectory()) {
      chownSafe(rootPath, uid, gid);
      chmodSafe(rootPath, PROTOTYPES_DIR_MODE);
      const entries = fs.readdirSync(rootPath);
      entries.forEach((entry) => setOwnershipAndPermissionsRecursive(path.join(rootPath, entry), uid, gid));
      return;
    }
    chownSafe(rootPath, uid, gid);
    chmodSafe(rootPath, PROTOTYPES_FILE_MODE);
  } catch (err) {
    logger.warn(`Failed to set ownership/permissions recursively for ${rootPath}: ${err.message}`);
  }
};

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
 * @param {number} uid - Linux UID used by workspace container user
 * @param {number} gid - Linux GID used by workspace container user
 */
const seedPrototypeFiles = (folderPath, prototype, uid, gid) => {
  try {
    const existingFiles = fs.readdirSync(folderPath);
    if (existingFiles.length > 0) {
      logger.info(`Folder ${folderPath} already has ${existingFiles.length} file(s), skipping seed`);
      return;
    }

    const content = buildInitialRepoContentFromPrototype(prototype);

    if (content.readme) {
      const readmePath = path.join(folderPath, 'README.md');
      fs.writeFileSync(readmePath, content.readme);
      chownSafe(readmePath, uid, gid);
      chmodSafe(readmePath, PROTOTYPES_FILE_MODE);
    }

    if (content.files && content.files.length > 0) {
      content.files.forEach((file) => {
        const filePath = path.join(folderPath, file.path);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, file.content);
        setOwnershipAndPermissionsRecursive(path.dirname(filePath), uid, gid);
        chownSafe(filePath, uid, gid);
        chmodSafe(filePath, PROTOTYPES_FILE_MODE);
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

    // Coder integration settings (stored in DB, not in .env)
    const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
    if (!coderCfg.enabled) {
      throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
    }
    const prototypesPath = coderCfg.prototypesPath;

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
    const normalizedUserId = normalizeIdForName(userId);
    const coderUsername = user.coder_username || `user-${normalizedUserId || Date.now().toString(36)}`;
    if (!user.coder_username) {
      user.coder_username = coderUsername;
      await user.save();
    }

    const coderUser = await coderService.ensureUserExists(userId, coderUsername, user.email);
    // Mint (or reuse) a user-scoped token. Admin key is only used inside this helper.
    // Use an unrestricted token first (needed before workspaceId exists).
    const userScopedToken = await coderService.getOrCreateUserScopedToken(user);

    // 6. Prepare prototype folder on host (per-user dir, prototype name as subfolder)
    const userHostPath = path.join(prototypesPath, userId.toString());
    const prototypeFolderName = sanitizePrototypeFolderName(prototype.name);
    const prototypeFolderHost = path.join(userHostPath, prototypeFolderName);

    try {
      fs.mkdirSync(prototypeFolderHost, { recursive: true });
      setOwnershipAndPermissionsRecursive(userHostPath, PROTOTYPES_LINUX_UID, PROTOTYPES_LINUX_GID);
      logger.info(`Ensured prototype folder exists: ${prototypeFolderHost}`);
    } catch (mkdirErr) {
      logger.warn(`Could not create prototype folder ${prototypeFolderHost}: ${mkdirErr.message}`);
    }

    // 7. Seed initial code files (only if folder is empty)
    seedPrototypeFiles(prototypeFolderHost, prototype, PROTOTYPES_LINUX_UID, PROTOTYPES_LINUX_GID);
    setOwnershipAndPermissionsRecursive(prototypeFolderHost, PROTOTYPES_LINUX_UID, PROTOTYPES_LINUX_GID);

    // 8. Get or create ONE workspace per user (reuse across prototypes)
    const workspaceName = coderService.sanitizeWorkspaceName(userId);
    const templateId = await coderService.getTemplateId('docker-template');

    let workspace = user.coder_workspace_id
      ? await coderService.getWorkspaceStatus(user.coder_workspace_id, userScopedToken).catch(() => null)
      : null;

    if (!workspace) {
      workspace = await coderService.getOrCreateWorkspace(
        coderUser.id,
        workspaceName,
        templateId,
        userHostPath,
        null,
        null,
        userScopedToken,
      );

      user.coder_workspace_id = workspace.id;
      user.coder_workspace_name = workspaceName;
      await user.save();
    }

    // Now that we have a workspace, mint (or reuse) an allow-listed token restricted to this workspace.
    const workspaceScopedToken = await coderService.getOrCreateUserScopedToken(user, { workspaceId: workspace.id });

    // 9. Start workspace if stopped
    const currentStatus = workspace.latest_build?.status;
    if (currentStatus !== 'running') {
      const updatedWorkspace = await coderService.startWorkspace(workspace.id, workspaceScopedToken);
      workspace = updatedWorkspace;

      if (workspace.latest_build?.status === 'starting') {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // 10. Get workspace app URL
    let appUrl = null;
    try {
      appUrl = await coderService.getWorkspaceAppUrl(workspace.id, 'code-server', 5, 2000, workspaceScopedToken);
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
    // Return the workspace-scoped token (allow-listed) for embedding/agent log access.
    const sessionToken = workspaceScopedToken;

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

    const workspaceScopedToken = await coderService.getOrCreateUserScopedToken(user, {
      workspaceId: user.coder_workspace_id,
    });
    const workspace = await coderService.getWorkspaceStatus(user.coder_workspace_id, workspaceScopedToken);

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

    const workspaceScopedToken = await coderService.getOrCreateUserScopedToken(user, {
      workspaceId: user.coder_workspace_id,
    });
    const timings = await coderService.getWorkspaceTimings(user.coder_workspace_id, workspaceScopedToken);
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
    const workspaceScopedToken = await coderService.getOrCreateUserScopedToken(user, {
      workspaceId: user.coder_workspace_id,
    });
    const logs = await coderService.getWorkspaceLogsByWorkspaceId(user.coder_workspace_id, options, workspaceScopedToken);
    return logs;
  } catch (error) {
    logger.error(`Failed to get workspace logs: ${error.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get workspace logs: ${error.message}`);
  }
};

/** Server-side only: maps client runKind to shell command (never accept raw command from client). */
const RUN_KIND_COMMANDS = {
  'python-main': 'python3 main.py',
  'c-main': 'gcc main.c -o main && ./main',
};

/**
 * Write `.autowrx_run` on the host prototypes volume so the VS Code extension in the
 * Coder workspace (same mount) can pick it up via FileSystemWatcher.
 * @param {string} userId
 * @param {import('mongoose').Document} prototype - Prototype document (already authorized)
 * @param {string} runKind - key in RUN_KIND_COMMANDS
 */
const triggerRunForPrototype = async (userId, prototype, runKind) => {
  const safeCommand = RUN_KIND_COMMANDS[runKind];
  if (!safeCommand) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid run kind');
  }

  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const prototypesPath = coderCfg.prototypesPath;
  if (!prototypesPath) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Prototypes path is not configured');
  }

  const prototypeFolderName = sanitizePrototypeFolderName(prototype.name);
  const userHostPath = path.join(prototypesPath, userId.toString());
  const prototypeFolderHost = path.join(userHostPath, prototypeFolderName);
  const triggerFilePath = path.join(prototypeFolderHost, '.autowrx_run');

  try {
    fs.mkdirSync(prototypeFolderHost, { recursive: true });
    fs.writeFileSync(triggerFilePath, safeCommand, 'utf8');
    chownSafe(triggerFilePath, PROTOTYPES_LINUX_UID, PROTOTYPES_LINUX_GID);
    chmodSafe(triggerFilePath, PROTOTYPES_FILE_MODE);
    logger.info(`Wrote Coder trigger file for prototype ${prototype.id}: ${triggerFilePath}`);
  } catch (err) {
    logger.error(`Failed to write trigger file ${triggerFilePath}: ${err.message}`);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to write run trigger: ${err.message}`);
  }
};

module.exports = {
  prepareWorkspaceForPrototype,
  getWorkspaceStatus,
  getWorkspaceTimings,
  getWorkspaceLogs,
  triggerRunForPrototype,
};
