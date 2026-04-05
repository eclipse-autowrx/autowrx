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

  // Prepare workspace (creates if needed)
  const workspaceInfo = await orchestratorService.prepareWorkspaceForPrototype(userId, prototypeId);

  res.json({
    workspaceId: workspaceInfo.workspaceId,
    workspaceName: workspaceInfo.workspaceName,
    status: workspaceInfo.status,
    appUrl: workspaceInfo.appUrl,
    sessionToken: workspaceInfo.sessionToken,
    repoUrl: workspaceInfo.repoUrl,
    folderPath: workspaceInfo.folderPath,
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
    status: workspaceInfo.status,
    appUrl: workspaceInfo.appUrl,
    sessionToken: workspaceInfo.sessionToken,
    repoUrl: workspaceInfo.repoUrl,
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
  const { runKind } = req.body;

  const prototype = await Prototype.findById(prototypeId);
  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  const hasPermission = await permissionService.hasPermission(userId, PERMISSIONS.READ_MODEL, prototype.model_id);
  if (!hasPermission) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this prototype');
  }

  await orchestratorService.triggerRunForPrototype(userId, prototype, runKind);

  res.status(httpStatus.OK).json({ message: 'Run request written to workspace' });
});

module.exports = {
  getWorkspace,
  prepareWorkspace,
  getWorkspaceStatus,
  getWorkspaceTimings,
  getWorkspaceAgentLogs,
  getWorkspaceLogs,
  triggerRun,
};
