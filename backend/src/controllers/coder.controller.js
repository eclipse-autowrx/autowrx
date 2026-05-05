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
const logger = require('../config/logger');
const { sanitizePrototypeFolderName, getPrototypeModelId } = require('../utils/prototypePath');
const { resolveWorkspaceKindFromPrototype } = require('../utils/workspaceKind');
const workspaceRuntimeStateService = require('../services/workspaceRuntimeState.service');

const CODER_SESSION_COOKIE = 'coder_session_token';
const CODER_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const WORKSPACE_PREPARE_TIMEOUT_MS = 2 * 60 * 1000;
const WORKSPACE_OPEN_TIMEOUT_MS = 90 * 1000;

const getRequestId = (req) =>
  String(req.id || req.headers['x-request-id'] || req.headers['x-correlation-id'] || `coder-${Date.now()}`);

const logCoderOperation = (op, payload) => {
  logger.info(`[coder-op] ${op} | ${JSON.stringify(payload)}`);
};

const withTimeout = async (promise, timeoutMs, timeoutMessage) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new ApiError(httpStatus.GATEWAY_TIMEOUT, timeoutMessage));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

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

const extractWorkspaceOwnerUsername = (workspace) =>
  String(workspace?.owner_name || workspace?.owner?.username || workspace?.owner || '').trim();

const extractWorkspaceAgentName = (workspace) => {
  const latestBuildResources = Array.isArray(workspace?.latest_build?.resources) ? workspace.latest_build.resources : [];
  for (const resource of latestBuildResources) {
    const firstAgentName = resource?.agents?.[0]?.name;
    if (firstAgentName) {
      return String(firstAgentName).trim();
    }
  }
  const resources = Array.isArray(workspace?.resources) ? workspace.resources : [];
  for (const resource of resources) {
    const firstAgentName = resource?.agents?.[0]?.name;
    if (firstAgentName) {
      return String(firstAgentName).trim();
    }
  }
  return 'main';
};

const resolveWorkspaceAppUrl = (workspace) => {
  const directUrl = workspace?.latest_app_status?.uri || workspace?.latest_app_status?.url;
  if (directUrl) {
    return directUrl;
  }

  const coderUrl = String(coderConfig.getCoderConfigSync().coderUrl || '').replace(/\/$/, '');
  const ownerName = extractWorkspaceOwnerUsername(workspace);
  const workspaceName = String(workspace?.name || '').trim();
  const agentName = extractWorkspaceAgentName(workspace);
  if (!coderUrl || !ownerName || !workspaceName || !agentName) {
    return null;
  }

  return `${coderUrl}/@${ownerName}/${workspaceName}.${agentName}/apps/code-server/`;
};

const mapWorkspacesForResponse = (workspaces, ownerEmailByCoderUsername = new Map()) => {
  return workspaces.map((workspace) => {
    const appUrl = resolveWorkspaceAppUrl(workspace);
    const ownerUsername = extractWorkspaceOwnerUsername(workspace);
    const ownerEmail = ownerEmailByCoderUsername.get(ownerUsername) || null;

    return {
      id: workspace.id,
      name: workspace.name,
      ownerName: ownerEmail || workspace.owner_name || null,
      ownerEmail,
      status: workspace?.latest_build?.status || workspace?.status || 'unknown',
      openPath: toSameOriginCoderPath(appUrl),
    };
  });
};

/**
 * Get workspace URL and session token for a prototype
 */
const getWorkspace = catchAsync(async (req, res) => {
  const requestId = getRequestId(req);
  const startedAt = Date.now();
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
  const workspace = await withTimeout(
    coderService.getWorkspaceStatus(workspaceId, sessionToken),
    WORKSPACE_OPEN_TIMEOUT_MS,
    'Fetching workspace status timed out. Please retry in a few seconds.',
  );
  const prototypeFolderPath = `${getPrototypeModelId(prototype)}/${sanitizePrototypeFolderName(prototype.name)}`;

  const appUrl = await withTimeout(
    coderService.getWorkspaceAppUrl(
      workspaceId,
      'code-server',
      5,
      2000,
      sessionToken,
    ),
    WORKSPACE_OPEN_TIMEOUT_MS,
    'Resolving workspace app URL timed out. Please retry in a few seconds.',
  );

  await withTimeout(
    coderService.waitUntilCoderAppProxyReady(appUrl, sessionToken),
    WORKSPACE_OPEN_TIMEOUT_MS,
    'Workspace app proxy is taking too long to become ready. Please retry shortly.',
  );
  setCoderSessionCookie(req, res, sessionToken);

  logCoderOperation('getWorkspace.success', {
    requestId,
    userId: String(userId),
    prototypeId: String(prototypeId),
    workspaceId: String(workspaceId),
    durationMs: Date.now() - startedAt,
  });

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
  const requestId = getRequestId(req);
  const startedAt = Date.now();
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
  const workspaceInfo = await withTimeout(
    orchestratorService.prepareWorkspaceForPrototype(userId, prototypeId),
    WORKSPACE_PREPARE_TIMEOUT_MS,
    'Preparing workspace timed out. Please retry shortly.',
  );
  setCoderSessionCookie(req, res, workspaceInfo.sessionToken);

  logCoderOperation('prepareWorkspace.success', {
    requestId,
    userId: String(userId),
    prototypeId: String(prototypeId),
    workspaceId: String(workspaceInfo.workspaceId),
    durationMs: Date.now() - startedAt,
  });

  res.json({
    workspaceId: workspaceInfo.workspaceId,
    workspaceName: workspaceInfo.workspaceName,
    workspaceBuildId: workspaceInfo.workspaceBuildId,
    status: workspaceInfo.status,
    folderPath: workspaceInfo.folderPath,
  });
});

/**
 * Send run request to AutoWRX Runner extension over WebSocket broker.
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

  res.status(httpStatus.OK).json({ message: 'Run request sent to workspace runner' });
});

const getRuntimeState = catchAsync(async (req, res) => {
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
    throw new ApiError(httpStatus.NOT_FOUND, 'Workspace not found. Prepare workspace first.');
  }

  const payload = await workspaceRuntimeStateService.getRuntimeStateSnapshot(workspaceId);
  res.json(payload);
});

/**
 * List workspaces for current user.
 */
const listMyWorkspaces = catchAsync(async (req, res) => {
  const requestId = getRequestId(req);
  const startedAt = Date.now();
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
  const mappedWorkspaces = mapWorkspacesForResponse(workspaces);
  logCoderOperation('listMyWorkspaces.success', {
    requestId,
    userId: String(req.user.id),
    count: mappedWorkspaces.length,
    durationMs: Date.now() - startedAt,
  });
  res.json({ workspaces: mappedWorkspaces });
});

/**
 * List all workspaces for admins.
 */
const listAdminWorkspaces = catchAsync(async (req, res) => {
  const requestId = getRequestId(req);
  const startedAt = Date.now();
  const coderCfg = await coderConfig.getCoderConfig({ forceRefresh: true });
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }

  const workspaces = await coderService.listAllWorkspacesAdmin();
  const ownerUsernames = [...new Set(workspaces.map(extractWorkspaceOwnerUsername).filter(Boolean))];
  const users = ownerUsernames.length > 0
    ? await User.find({ coder_username: { $in: ownerUsernames } })
      .select('coder_username email')
      .lean()
    : [];
  const ownerEmailByCoderUsername = new Map(
    users.map((user) => [String(user.coder_username || '').trim(), user.email || null]),
  );

  const mappedWorkspaces = mapWorkspacesForResponse(workspaces, ownerEmailByCoderUsername);
  logCoderOperation('listAdminWorkspaces.success', {
    requestId,
    adminUserId: String(req.user.id),
    count: mappedWorkspaces.length,
    durationMs: Date.now() - startedAt,
  });
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
  await workspaceBindingService.markBindingStaleForUserWorkspace(user.id, workspaceId);
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
  await workspaceBindingService.markBindingStaleByWorkspaceId(workspaceId);
  res.json(payload);
});

module.exports = {
  getWorkspace,
  prepareWorkspace,
  triggerRun,
  getRuntimeState,
  listMyWorkspaces,
  listAdminWorkspaces,
  startMyWorkspace,
  stopMyWorkspace,
  deleteMyWorkspace,
  startAdminWorkspace,
  stopAdminWorkspace,
  deleteAdminWorkspace,
};
