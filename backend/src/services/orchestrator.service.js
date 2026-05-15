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
const workspaceBindingService = require('./workspaceBinding.service');
const { Prototype, User } = require('../models');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const coderConfig = require('../utils/coderConfig');
const { getPrototypeFolderRelativePath } = require('../utils/prototypePath');
const workspaceRunWsHub = require('./workspaceRunWsHub.service');
const { resolveWorkspaceKindFromPrototype, getTemplateNameForWorkspaceKind } = require('../utils/workspaceKind');
/* eslint-disable security/detect-non-literal-fs-filename */

const normalizeIdForName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
const inFlightPrepareByUserAndKind = new Map();

const ensureHostFolderPermissions = (folderPath) => {
  try {
    fs.chmodSync(folderPath, 0o777);
  } catch (err) {
    logger.warn(`chmod 777 failed for ${folderPath}: ${err.message}`);
  }
};

/**
 * Recursively align bind-mounted prototype trees with the Coder workspace user (uid/gid)
 * and force permissive modes so code-server can read/write seeded files (backend may run as root).
 * @param {string} rootPath - Host path under PROTOTYPES_PATH (single prototype folder)
 */
const ensureHostPrototypeTreePermissions = (rootPath) => {
  const walk = (entryPath) => {
    try {
      try {
        fs.chmodSync(entryPath, 0o777);
      } catch (err) {
        logger.warn(`chmod 777 failed for ${entryPath}: ${err.message}`);
      }
      const st = fs.statSync(entryPath);
      if (!st.isDirectory()) return;
      fs.readdirSync(entryPath).forEach((name) => {
        walk(path.join(entryPath, name));
      });
    } catch (err) {
      logger.warn(`prototype tree permission walk failed for ${entryPath}: ${err.message}`);
    }
  };
  try {
    if (fs.existsSync(rootPath)) walk(rootPath);
  } catch (err) {
    logger.warn(`ensureHostPrototypeTreePermissions failed for ${rootPath}: ${err.message}`);
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
  return items.reduce((acc, item) => {
    if (!item || typeof item !== 'object') return acc;

    const name = typeof item.name === 'string' ? item.name : '';
    if (!name) return acc;

    const currentPath = basePath ? `${basePath}/${name}` : name;
    if (item.type === 'folder') {
      const children = Array.isArray(item.items) ? item.items : [];
      return acc.concat(flattenFileTree(children, currentPath));
    }

    if (item.type === 'file') {
      const content = typeof item.content === 'string' ? item.content : '';
      return acc.concat([{ path: currentPath, content }]);
    }

    return acc;
  }, []);
};

const getMainFileNameByLanguage = (language) => {
  const lang = String(language || '')
    .trim()
    .toLowerCase();
  if (lang === 'python' || lang === 'py') return 'main.py';
  if (lang === 'rust' || lang === 'rs') return 'main.rs';
  return 'main.txt';
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
    const mainFileByLanguage = getMainFileNameByLanguage(prototype?.language);
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
      const readmePath = path.join(folderPath, 'README.md');
      fs.writeFileSync(readmePath, content.readme);
      ensureHostFolderPermissions(readmePath);
    }

    if (content.files && content.files.length > 0) {
      content.files.forEach((file) => {
        const filePath = path.join(folderPath, file.path);
        fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o777 });
        ensureHostFolderPermissions(path.dirname(filePath));
        fs.writeFileSync(filePath, file.content);
        ensureHostFolderPermissions(filePath);
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
const prepareWorkspaceForPrototypeUnsafe = async (userId, prototypeId) => {
  try {
    // 1. Fetch data concurrently to save time
    const [prototype, user, coderCfg] = await Promise.all([
      Prototype.findById(prototypeId).populate('model_id'),
      User.findById(userId),
      coderConfig.getCoderConfig({ forceRefresh: true }),
    ]);

    // Validation Guard Clauses
    if (!prototype) throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
    if (!prototype.model_id) throw new ApiError(httpStatus.NOT_FOUND, 'Model not found');
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    if (!coderCfg.enabled) throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');

    // 2. Normalize Coder User
    if (!user.coder_username) {
      const normalizedId = normalizeIdForName(userId);
      user.coder_username = `user-${normalizedId || Date.now().toString(36)}`;
      await user.save();
    }

    const coderUser = await coderService.ensureUserExists(userId, user.coder_username, user.email);

    // Get initial token (unrestricted)
    const userScopedToken = await coderService.getOrCreateUserScopedToken(user, {
      coderUserId: coderUser.id,
    });

    // 3. Setup Filesystem
    const prototypeFolderRelativePath = getPrototypeFolderRelativePath(prototype);
    const userHostPath = path.join(coderCfg.prototypesPath, userId.toString());
    const prototypeFolderHost = path.join(userHostPath, prototypeFolderRelativePath);

    try {
      fs.mkdirSync(userHostPath, { recursive: true, mode: 0o777 });
      fs.mkdirSync(prototypeFolderHost, { recursive: true, mode: 0o777 });
      ensureHostFolderPermissions(userHostPath);
      ensureHostFolderPermissions(prototypeFolderHost);
      seedPrototypeFiles(prototypeFolderHost, prototype);
      ensureHostPrototypeTreePermissions(prototypeFolderHost);
    } catch (fsErr) {
      logger.warn(`Filesystem prep warning for ${prototypeFolderHost}: ${fsErr.message}`);
    }

    // 4. Handle Workspace (Reuse or Create)
    const workspaceKind = resolveWorkspaceKindFromPrototype(prototype);
    const workspaceName = coderService.sanitizeWorkspaceName(userId, workspaceKind);
    const templateName = getTemplateNameForWorkspaceKind(workspaceKind);
    let workspace = null;

    const workspaceBinding = await workspaceBindingService.getBindingByUser(userId, workspaceKind);
    const mappedWorkspaceId = workspaceBinding?.workspace_id || null;
    if (mappedWorkspaceId) {
      workspace = await coderService.getWorkspaceStatus(mappedWorkspaceId, userScopedToken).catch(() => null);
    }

    if (!workspace) {
      const templateId = await coderService.getTemplateId(templateName);
      workspace = await coderService.getOrCreateWorkspace(
        coderUser.id,
        workspaceName,
        templateId,
        userHostPath,
        userHostPath,
        userScopedToken,
      );
    }

    await workspaceBindingService.upsertBinding({
      userId,
      coderUserId: coderUser.id,
      workspaceId: workspace.id,
      workspaceName,
      prototypesHostPath: userHostPath,
      templateName,
      workspaceKind,
    });

    const workspaceId = workspace.id;

    // Reuse the same user token for the whole tab-open flow to avoid minting multiple times.
    const workspaceScopedToken = userScopedToken;
    const workspaceTtlSeconds = Number(coderCfg.workspaceTtlSeconds);
    const workspaceTtlMs =
      Number.isFinite(workspaceTtlSeconds) && workspaceTtlSeconds >= 0 ? Math.floor(workspaceTtlSeconds * 1000) : 0;
    try {
      await coderService.updateWorkspaceTtl(workspaceId, workspaceTtlMs, workspaceScopedToken);
    } catch (ttlErr) {
      logger.warn(`Workspace TTL update failed for ${workspaceId}: ${ttlErr.message}`);
    }

    // 6. Ensure Workspace is running
    let status = workspace.latest_build?.status;
    if (status !== 'running') {
      await coderService.startWorkspace(workspaceId, workspaceScopedToken);
      workspace = await coderService.getWorkspaceStatus(workspaceId, workspaceScopedToken);
      status = workspace?.latest_build?.status;
    }

    // 6b. Coder can keep latest_build "running" after the container/agent is gone; stop+start once to recover
    workspace = await coderService.restoreUnhealthyRunningWorkspace(workspaceId, workspaceScopedToken);
    status = workspace.latest_build?.status;

    logger.info(`Workspace ready | User: ${userId} | Proto: ${prototypeId} | Folder: ${prototypeFolderRelativePath}`);

    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceBuildId: workspace?.latest_build?.id || null,
      status: status || 'unknown',
      sessionToken: workspaceScopedToken,
      folderPath: `/home/coder/prototypes/${prototypeFolderRelativePath}`,
    };
  } catch (error) {
    logger.error(`Workspace Prep Failed: ${error.message}`);
    if (error instanceof ApiError) throw error;
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to prepare workspace: ${error.message}`);
  }
};

const prepareWorkspaceForPrototype = async (userId, prototypeId) => {
  const prototypeForLock = await Prototype.findById(prototypeId).select('language');
  if (!prototypeForLock) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }
  const workspaceKind = resolveWorkspaceKindFromPrototype(prototypeForLock);
  const prepareKey = `${String(userId)}:${String(workspaceKind)}`;

  const inFlight = inFlightPrepareByUserAndKind.get(prepareKey);
  if (inFlight) {
    logger.info(`Joining in-flight workspace prepare for key=${prepareKey}`);
    return inFlight;
  }

  const task = prepareWorkspaceForPrototypeUnsafe(userId, prototypeId);
  inFlightPrepareByUserAndKind.set(prepareKey, task);
  try {
    return await task;
  } finally {
    if (inFlightPrepareByUserAndKind.get(prepareKey) === task) {
      inFlightPrepareByUserAndKind.delete(prepareKey);
    }
  }
};

/** Server-side only: maps client runKind to shell command (never accept raw command from client). */
const RUN_KIND_COMMANDS = {
  'python-main': 'python3 -u main.py',
  'cpp-main':
    "g++ -g -O0 -std=c++17 -pthread $(find . -type f \\( -name \"*.pb.h\" -o -name \"*.grpc.pb.h\" \\) | sed 's|/[^/]*$||' | sed 's|^\\./||' | awk -F'/kuksa/' '{print $1}' | sort -u | sed 's|^|-I./|') $(find . \\( -name \"*.cpp\" -o -name \"*.cc\" \\)) -o main $(pkg-config --cflags --libs protobuf grpc++ 2>/dev/null) && ./main",
  'rust-main': 'cargo run',
};

const resolveRunCommand = (runKind) => {
  switch (runKind) {
    case 'python-main':
      return RUN_KIND_COMMANDS['python-main'];
    case 'c-main':
      return RUN_KIND_COMMANDS['c-main'];
    case 'cpp-main':
      return RUN_KIND_COMMANDS['cpp-main'];
    case 'rust-main':
      return RUN_KIND_COMMANDS['rust-main'];
    default:
      return null;
  }
};

/**
 * Derive run kind from prototype.language (authoritative metadata).
 * @param {import('mongoose').Document} prototype
 * @returns {'python-main'|'c-main'|'cpp-main'|'rust-main'}
 */
const resolveRunKindFromPrototype = (prototype) => {
  const lang = String(prototype?.language ?? '')
    .trim()
    .toLowerCase();
  if (lang === 'cpp' || lang === 'c++') return 'cpp-main';
  if (lang === 'c') return 'c-main';
  if (lang === 'rust' || lang === 'rs') return 'rust-main';
  return 'python-main';
};

const buildRunCommandForPrototype = (prototype) => {
  const runKind = resolveRunKindFromPrototype(prototype);
  const command = resolveRunCommand(runKind);
  return { runKind, command };
};

/**
 * Send run command to workspace runner over WebSocket hub.
 * @param {string} userId
 * @param {import('mongoose').Document} prototype - Prototype document (already authorized)
 * @param {string} runKind - key in RUN_KIND_COMMANDS
 */
const triggerRunForPrototype = async (userId, prototype, runKind) => {
  const safeCommand = resolveRunCommand(runKind);
  if (!safeCommand) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid run kind');
  }

  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const workspaceKind = resolveWorkspaceKindFromPrototype(prototype);
  const user = await User.findById(userId);
  const workspaceId = await workspaceBindingService.getWorkspaceIdForUser(user, workspaceKind);
  if (!workspaceId) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Workspace not found. Prepare workspace first.');
  }

  const sent = workspaceRunWsHub.sendToRunners(workspaceId, {
    type: 'run.start',
    workspaceId: String(workspaceId),
    prototypeId: String(prototype.id),
    runKind,
    command: safeCommand,
    at: new Date().toISOString(),
  });

  if (!sent) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'AutoWRX Runner extension is not connected for this workspace');
  }

  logger.info(`Sent run.start to runner(s) for workspace=${workspaceId}, prototype=${prototype.id}`);
};

module.exports = {
  prepareWorkspaceForPrototype,
  triggerRunForPrototype,
  resolveRunKindFromPrototype,
  buildRunCommandForPrototype,
};
