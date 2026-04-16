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
const { resolveWorkspaceKindFromPrototype } = require('../utils/workspaceKind');

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
 * Token for Coder API calls and for the `coder_session_token` cookie (same-origin `/coder` proxy).
 * Order: explicit query (tests/legacy) → cookie from prepare → mint scoped token.
 */
const resolveCoderSessionToken = async (req, user, workspaceId) => {
  const fromQuery = typeof req.query?.sessionToken === 'string' ? req.query.sessionToken.trim() : '';
  if (fromQuery) return fromQuery;

  const fromCookie = typeof req.cookies?.[CODER_SESSION_COOKIE] === 'string'
    ? req.cookies[CODER_SESSION_COOKIE].trim()
    : '';
  if (fromCookie) return fromCookie;

  return coderService.getOrCreateUserScopedToken(user, { workspaceId });
};

const toSameOriginCoderPath = (rawUrl) => {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    return `/coder${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    if (String(rawUrl).startsWith('/')) {
      return `/coder${rawUrl}`;
    }
    return null;
  }
};

const mapWorkspacesForResponse = async (workspaces, sessionToken) => {
  return Promise.all(workspaces.map(async (workspace) => {
    let appUrl = null;
    try {
      appUrl = await coderService.getWorkspaceAppUrl(
        workspace.id,
        'code-server',
        1,
        0,
        sessionToken,
      );
    } catch {
      appUrl =
        workspace?.latest_app_status?.uri ||
        workspace?.latest_app_status?.url ||
        null;
    }

    return {
      id: workspace.id,
      name: workspace.name,
      ownerName: workspace.owner_name || null,
      status: workspace?.latest_build?.status || workspace?.status || 'unknown',
      openPath: toSameOriginCoderPath(appUrl),
    };
  }));
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
  const workspaceKind = resolveWorkspaceKindFromPrototype(prototype);
  const workspaceId = await workspaceBindingService.getWorkspaceIdForUser(user, workspaceKind);
  if (!workspaceId) {
    throw new ApiError(httpStatus.CONFLICT, 'Workspace is not prepared yet. Call prepare endpoint first.');
  }

  const sessionToken = await resolveCoderSessionToken(req, user, workspaceId);
  const workspace = await coderService.getWorkspaceStatus(workspaceId, sessionToken);
  const prototypeFolderPath = `${getPrototypeModelId(prototype)}/${sanitizePrototypeFolderName(prototype.name)}`;

  const appUrl = await coderService.getWorkspaceAppUrl(
    workspaceId,
    'code-server',
    5,
    2000,
    sessionToken,
  );

  await coderService.waitUntilCoderAppProxyReady(appUrl, sessionToken);
  setCoderSessionCookie(req, res, sessionToken);

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

/**
 * List workspaces for current user.
 */
const listMyWorkspaces = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const sessionToken = await resolveCoderSessionToken(req, user, null);
  setCoderSessionCookie(req, res, sessionToken);

  const workspaces = await coderService.listMyWorkspaces(sessionToken);
  const mappedWorkspaces = await mapWorkspacesForResponse(workspaces, sessionToken);
  res.json({ workspaces: mappedWorkspaces });
});

/**
 * List all workspaces for admins.
 */
const listAdminWorkspaces = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const workspaces = await coderService.listAllWorkspacesAdmin();
  const mappedWorkspaces = await mapWorkspacesForResponse(workspaces, coderCfg.adminApiKey);
  res.json({ workspaces: mappedWorkspaces });
});

/**
 * Stop workspace by ID.
 */
const stopMyWorkspace = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const { workspaceId } = req.params;
  const sessionToken = await resolveCoderSessionToken(req, user, workspaceId);
  setCoderSessionCookie(req, res, sessionToken);

  const payload = await coderService.stopWorkspace(workspaceId, sessionToken);
  res.json(payload);
});

/**
 * Start workspace by ID.
 */
const startMyWorkspace = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const { workspaceId } = req.params;
  const sessionToken = await resolveCoderSessionToken(req, user, workspaceId);
  setCoderSessionCookie(req, res, sessionToken);

  const payload = await coderService.startWorkspace(workspaceId, sessionToken);
  res.json(payload);
});

/**
 * Delete workspace by ID.
 */
const deleteMyWorkspace = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const { workspaceId } = req.params;
  const sessionToken = await resolveCoderSessionToken(req, user, workspaceId);
  setCoderSessionCookie(req, res, sessionToken);

  const payload = await coderService.deleteWorkspace(workspaceId, sessionToken);
  res.json(payload);
});

const startAdminWorkspace = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }
  const { workspaceId } = req.params;
  const payload = await coderService.startWorkspaceAsAdmin(workspaceId);
  res.json(payload);
});

const stopAdminWorkspace = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }
  const { workspaceId } = req.params;
  const payload = await coderService.stopWorkspaceAsAdmin(workspaceId);
  res.json(payload);
});

const deleteAdminWorkspace = catchAsync(async (req, res) => {
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }
  const { workspaceId } = req.params;
  const payload = await coderService.deleteWorkspaceAsAdmin(workspaceId);
  res.json(payload);
});

module.exports = {
  getWorkspace,
  prepareWorkspace,
  triggerRun,
  getRunOutput,
  listMyWorkspaces,
  listAdminWorkspaces,
  startMyWorkspace,
  stopMyWorkspace,
  deleteMyWorkspace,
  startAdminWorkspace,
  stopAdminWorkspace,
  deleteAdminWorkspace,
};
