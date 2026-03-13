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
const { Prototype } = require('../models');

/**
 * Get workspace URL and session token for a prototype
 */
const getWorkspace = catchAsync(async (req, res) => {
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
  });
});

/**
 * Prepare workspace (create if needed)
 */
const prepareWorkspace = catchAsync(async (req, res) => {
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
  });
});

/**
 * Get workspace status
 */
const getWorkspaceStatus = catchAsync(async (req, res) => {
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
  const { workspaceAgentId } = req.params;
  const { before, after, follow, no_compression, format } = req.query;

  const logs = await coderService.getWorkspaceAgentLogs(workspaceAgentId, {
    before,
    after,
    follow,
    no_compression,
    format,
  });

  res.json(logs);
});

/**
 * Get logs for a workspace (by prototype)
 */
const getWorkspaceLogs = catchAsync(async (req, res) => {
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

module.exports = {
  getWorkspace,
  prepareWorkspace,
  getWorkspaceStatus,
  getWorkspaceTimings,
  getWorkspaceAgentLogs,
  getWorkspaceLogs,
};
