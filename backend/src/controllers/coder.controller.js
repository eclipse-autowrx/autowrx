// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { orchestratorService, permissionService, coderService } = require('../services');
const { PERMISSIONS } = require('../config/roles');
const ApiError = require('../utils/ApiError');
const { Prototype, User } = require('../models');
const coderConfig = require('../utils/coderConfig');

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
 * Get workspace URL and session token for a prototype
 */
const getWorkspace = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const { prototypeId } = req.params;
  const userId = req.user.id;

  // Check if user has permission to view the prototype
  const prototype = await Prototype.findById(prototypeId);
  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  const hasPermission = await permissionService.hasPermission(userId, PERMISSIONS.READ_MODEL, prototype.model_id);
  if (!hasPermission) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this prototype');
  }

  // Read existing prepared workspace only (avoid prepare side-effects/races here).
  const user = await User.findById(userId);
  if (!user?.coder_workspace_id) {
    throw new ApiError(httpStatus.CONFLICT, 'Workspace is not prepared yet. Call prepare endpoint first.');
  }

  const workspaceScopedToken = await coderService.getOrCreateUserScopedToken(user, {
    workspaceId: user.coder_workspace_id,
  });
  const workspace = await coderService.getWorkspaceStatus(user.coder_workspace_id, workspaceScopedToken);
  const prototypeFolderName = sanitizePrototypeFolderName(prototype.name);

  // Browser-reachable code-server URL (Coder proxy path); used by VS Code iframe after build completes.
  const appUrl = await coderService.getWorkspaceAppUrl(
    user.coder_workspace_id,
    'code-server',
    5,
    2000,
    workspaceScopedToken,
  );

  await coderService.waitUntilCoderAppProxyReady(appUrl, workspaceScopedToken);

  res.json({
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    workspaceBuildId: workspace?.latest_build?.id || null,
    status: workspace?.latest_build?.status || workspace?.status || 'unknown',
    sessionToken: workspaceScopedToken,
    folderPath: `/home/coder/prototypes/${prototypeFolderName}`,
    appUrl,
  });
});

/**
 * Prepare workspace (create if needed)
 */
const prepareWorkspace = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const { prototypeId } = req.params;
  const userId = req.user.id;

  // Check if user has permission to view the prototype
  const prototype = await Prototype.findById(prototypeId);
  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  const hasPermission = await permissionService.hasPermission(userId, PERMISSIONS.READ_MODEL, prototype.model_id);
  if (!hasPermission) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this prototype');
  }

  // Prepare workspace
  const workspaceInfo = await orchestratorService.prepareWorkspaceForPrototype(userId, prototypeId);

  res.json({
    workspaceId: workspaceInfo.workspaceId,
    workspaceName: workspaceInfo.workspaceName,
    workspaceBuildId: workspaceInfo.workspaceBuildId,
    status: workspaceInfo.status,
    sessionToken: workspaceInfo.sessionToken,
    folderPath: workspaceInfo.folderPath,
  });
});

/**
 * Get workspace status
 */
const getWorkspaceStatus = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const { prototypeId } = req.params;
  const userId = req.user.id;

  // Check if user has permission to view the prototype
  const prototype = await Prototype.findById(prototypeId);
  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  const hasPermission = await permissionService.hasPermission(userId, PERMISSIONS.READ_MODEL, prototype.model_id);
  if (!hasPermission) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this prototype');
  }

  const status = await orchestratorService.getWorkspaceStatus(userId, prototypeId);

  res.json(status);
});

/**
 * Get workspace timings
 */
const getWorkspaceTimings = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const { prototypeId } = req.params;
  const userId = req.user.id;

  // Check if user has permission to view the prototype
  const prototype = await Prototype.findById(prototypeId);
  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  const hasPermission = await permissionService.hasPermission(userId, PERMISSIONS.READ_MODEL, prototype.model_id);
  if (!hasPermission) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this prototype');
  }

  const timings = await orchestratorService.getWorkspaceTimings(userId, prototypeId);

  res.json(timings);
});

/**
 * Get logs for a Coder workspace agent
 */
const getWorkspaceAgentLogs = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const { workspaceAgentId } = req.params;
  const userId = req.user.id;
  const { before, after, follow, no_compression, format } = req.query;

  const user = await User.findById(userId);
  if (!user?.coder_workspace_id || !user?.coder_username) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Workspace not found. Prepare workspace first.');
  }

  const workspaceScopedToken = await coderService.getOrCreateUserScopedToken(user, { workspaceId: user.coder_workspace_id });
  const expectedWorkspaceAgentId = await coderService.getWorkspaceAgentId(user.coder_workspace_id, workspaceScopedToken);
  if (String(workspaceAgentId) !== String(expectedWorkspaceAgentId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this workspace agent logs');
  }

  const logs = await coderService.getWorkspaceAgentLogs(
    workspaceAgentId,
    {
      before,
      after,
      follow,
      no_compression,
      format,
    },
    workspaceScopedToken,
  );

  res.json(logs);
});

/**
 * Get logs for a workspace (by prototype)
 */
const getWorkspaceLogs = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const { prototypeId } = req.params;
  const userId = req.user.id;
  const { before, after, follow, no_compression, format } = req.query;

  // Check if user has permission to view the prototype
  const prototype = await Prototype.findById(prototypeId);
  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  const hasPermission = await permissionService.hasPermission(userId, PERMISSIONS.READ_MODEL, prototype.model_id);
  if (!hasPermission) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this prototype');
  }

  const logs = await orchestratorService.getWorkspaceLogs(userId, prototypeId, {
    before,
    after,
    follow,
    no_compression,
    format,
  });

  res.json(logs);
});

/**
 * Write `.autowrx_run` on the host prototypes volume for the VS Code extension (file watcher).
 */
const triggerRun = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const { prototypeId } = req.params;
  const userId = req.user.id;

  const prototype = await Prototype.findById(prototypeId);
  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  const hasPermission = await permissionService.hasPermission(userId, PERMISSIONS.READ_MODEL, prototype.model_id);
  if (!hasPermission) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this prototype');
  }

  const runKind = orchestratorService.resolveRunKindFromPrototype(prototype);
  await orchestratorService.triggerRunForPrototype(userId, prototype, runKind);

  res.status(httpStatus.OK).json({ message: 'Run request written to workspace' });
});

/**
 * Read `.autowrx_out` from the prototypes volume (updated by `tee` in allowlisted run commands).
 */
const getRunOutput = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const { prototypeId } = req.params;
  const userId = req.user.id;

  const prototype = await Prototype.findById(prototypeId);
  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  const hasPermission = await permissionService.hasPermission(userId, PERMISSIONS.READ_MODEL, prototype.model_id);
  if (!hasPermission) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this prototype');
  }

  const payload = await orchestratorService.getRunOutputForPrototype(userId, prototype);
  res.json(payload);
});

module.exports = {
  getWorkspace,
  prepareWorkspace,
  getWorkspaceStatus,
  getWorkspaceTimings,
  getWorkspaceAgentLogs,
  getWorkspaceLogs,
  triggerRun,
  getRunOutput,
};
