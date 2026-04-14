// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { orchestratorService, permissionService, coderService, workspaceBindingService } = require('../services');
const { PERMISSIONS } = require('../config/roles');
const ApiError = require('../utils/ApiError');
const { Prototype, User } = require('../models');
const coderConfig = require('../utils/coderConfig');
const { sanitizePrototypeFolderName, getPrototypeModelId } = require('../utils/prototypePath');

const CODER_SESSION_COOKIE = 'coder_session_token';
const CODER_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const isSecureRequest = (req) => {
  if (req.secure) return true;
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  return forwardedProto.includes('https');
};

const setCoderSessionCookie = (req, res, sessionToken) => {
  if (!sessionToken) return;
  res.cookie(CODER_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureRequest(req),
    path: '/',
    maxAge: CODER_SESSION_MAX_AGE_MS,
  });
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

  const prototype = await Prototype.findById(prototypeId);
  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  const hasPermission = await permissionService.hasPermission(userId, PERMISSIONS.READ_MODEL, prototype.model_id);
  if (!hasPermission) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this prototype');
  }

  const user = await User.findById(userId);
  const workspaceId = await workspaceBindingService.getWorkspaceIdForUser(user);
  if (!workspaceId) {
    throw new ApiError(httpStatus.CONFLICT, 'Workspace is not prepared yet. Call prepare endpoint first.');
  }

  const requestedSessionToken = typeof req.query?.sessionToken === 'string' ? req.query.sessionToken.trim() : '';
  const iframeSessionToken =
    requestedSessionToken || (await coderService.getOrCreateUserScopedToken(user, { workspaceId }));
  const workspace = await coderService.getWorkspaceStatus(workspaceId, iframeSessionToken);
  const prototypeFolderPath = `${getPrototypeModelId(prototype)}/${sanitizePrototypeFolderName(prototype.name)}`;

  const appUrl = await coderService.getWorkspaceAppUrl(
    workspaceId,
    'code-server',
    5,
    2000,
    iframeSessionToken,
  );

  await coderService.waitUntilCoderAppProxyReady(appUrl, iframeSessionToken);
  setCoderSessionCookie(req, res, iframeSessionToken);

  res.json({
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    workspaceBuildId: workspace?.latest_build?.id || null,
    status: workspace?.latest_build?.status || workspace?.status || 'unknown',
    folderPath: `/home/coder/prototypes/${prototypeFolderPath}`,
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
  setCoderSessionCookie(req, res, workspaceInfo.sessionToken);

  res.json({
    workspaceId: workspaceInfo.workspaceId,
    workspaceName: workspaceInfo.workspaceName,
    workspaceBuildId: workspaceInfo.workspaceBuildId,
    status: workspaceInfo.status,
    folderPath: workspaceInfo.folderPath,
  });
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
  triggerRun,
  getRunOutput,
};
