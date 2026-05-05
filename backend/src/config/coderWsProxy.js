// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const { server: WebSocketServer, client: WebSocketClient } = require('websocket');

const ApiError = require('../utils/ApiError');
const logger = require('./logger');
const config = require('./config');
const { jwtVerify } = require('./passport');
const { tokenTypes } = require('./tokens');
const coderConfig = require('../utils/coderConfig');
const { User, Prototype } = require('../models');
const permissionService = require('../services/permission.service');
const coderService = require('../services/coder.service');
const workspaceBindingService = require('../services/workspaceBinding.service');
const { PERMISSIONS } = require('./roles');
const { resolveWorkspaceKindFromPrototype } = require('../utils/workspaceKind');
const workspaceRunWsHub = require('../services/workspaceRunWsHub.service');
const workspaceRuntimeStateService = require('../services/workspaceRuntimeState.service');

const getCoderApiBase = () => {
  const coderCfg = coderConfig.getCoderConfigSync();
  if (!coderCfg.enabled) {
    throw new ApiError(httpStatus.FORBIDDEN, 'VSCode integration is disabled');
  }
  const base = String(coderCfg.coderUrl || '').replace(/\/$/, '');
  if (!base) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'CODER_URL is not configured');
  }
  return `${base}/api/v2`;
};

const parseUrl = (rawUrl) => {
  // rawUrl looks like "/v2/system/coder/workspace/...?..."; need a base for URL().
  const u = new URL(rawUrl, 'http://localhost');
  const params = Object.fromEntries(u.searchParams.entries());
  return { pathname: u.pathname, searchParams: params, rawSearch: u.search || '' };
};

const resolveWorkspaceIdForPrototype = async (user, prototypeId) => {
  if (!prototypeId) return null;
  const prototype = await Prototype.findById(prototypeId);
  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }
  const hasPermission = await permissionService.hasPermission(user.id, PERMISSIONS.READ_MODEL, prototype.model_id);
  if (!hasPermission) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this prototype');
  }
  const workspaceKind = resolveWorkspaceKindFromPrototype(prototype);
  return workspaceBindingService.getWorkspaceIdForUser(user, workspaceKind);
};

const authenticateWsUser = async (searchParams) => {
  const token = searchParams.access_token;
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  const decoded = jwt.verify(token, config.jwt.secret);
  const user = await new Promise((resolve, reject) => {
    jwtVerify({ type: tokenTypes.ACCESS, sub: decoded.sub }, (err, result) => {
      if (err) return reject(err);
      if (!result) return resolve(null);
      return resolve(result);
    });
  });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  return user;
};

const normalizeCoderPath = (pathname) => {
  // Support both mounted routes:
  // - /v2/system/coder/...
  // - /v2/coder/...
  if (pathname.startsWith('/v2/system/coder/')) return pathname.slice('/v2/system/coder'.length);
  if (pathname.startsWith('/v2/coder/')) return pathname.slice('/v2/coder'.length);
  return null;
};

const matchWatchWs = (coderPath) => {
  // /workspace/:prototypeId/watch-ws
  const m = coderPath.match(/^\/workspace\/([^/]+)\/watch-ws\/?$/);
  if (!m) return null;
  return { prototypeId: m[1] };
};

const matchLogsWs = (coderPath) => {
  // /workspaceagents/:workspaceAgentId/logs
  const m = coderPath.match(/^\/workspaceagents\/([^/]+)\/logs\/?$/);
  if (!m) return null;
  return { workspaceAgentId: m[1] };
};

const matchWorkspaceBuildLogsWs = (coderPath) => {
  // /workspacebuilds/:workspaceBuildId/logs
  const m = coderPath.match(/^\/workspacebuilds\/([^/]+)\/logs\/?$/);
  if (!m) return null;
  return { workspaceBuildId: m[1] };
};

const matchRunWs = (coderPath) => {
  // /workspace/:prototypeId/run-ws
  const m = coderPath.match(/^\/workspace\/([^/]+)\/run-ws\/?$/);
  if (!m) return null;
  return { prototypeId: m[1] };
};

const matchRunnerWs = (coderPath) => {
  // /runner/ws
  const m = coderPath.match(/^\/runner\/ws\/?$/);
  if (!m) return null;
  return {};
};

const parseCookieHeader = (cookieHeader = '') => {
  return String(cookieHeader)
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const idx = pair.indexOf('=');
      if (idx <= 0) return acc;
      const key = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (!key) return acc;
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
};

const proxyBidirectional = ({ downstream, upstream }) => {
  const closeBoth = (reason) => {
    try {
      if (downstream?.connected) downstream.drop(1000, reason || 'closing');
    } catch {
      // ignore
    }
    try {
      if (upstream?.connected) upstream.drop(1000, reason || 'closing');
    } catch {
      // ignore
    }
  };

  downstream.on('message', (msg) => {
    if (!upstream?.connected) return;
    if (msg.type === 'utf8') upstream.sendUTF(msg.utf8Data);
    else if (msg.type === 'binary') upstream.sendBytes(msg.binaryData);
  });

  upstream.on('message', (msg) => {
    if (!downstream?.connected) return;
    if (msg.type === 'utf8') downstream.sendUTF(msg.utf8Data);
    else if (msg.type === 'binary') downstream.sendBytes(msg.binaryData);
  });

  downstream.on('close', () => closeBoth('downstream closed'));
  upstream.on('close', () => closeBoth('upstream closed'));

  downstream.on('error', (err) => {
    logger.warn(`Coder WS downstream error: ${err?.message || err}`);
    closeBoth('downstream error');
  });
  upstream.on('error', (err) => {
    logger.warn(`Coder WS upstream error: ${err?.message || err}`);
    closeBoth('upstream error');
  });
};

const connectUpstream = async ({ url, headers }) => {
  const wsClient = new WebSocketClient();
  return new Promise((resolve, reject) => {
    wsClient.on('connectFailed', (err) => reject(err));
    wsClient.on('connect', (conn) => resolve(conn));
    wsClient.connect(url, null, null, headers);
  });
};

const resolveWorkspaceSessionToken = async ({ searchParams, request, user, workspaceId }) => {
  const requestedToken = typeof searchParams?.coder_session_token === 'string'
    ? searchParams.coder_session_token.trim()
    : '';
  if (requestedToken) {
    return requestedToken;
  }
  const cookieHeader = request?.httpRequest?.headers?.cookie || '';
  const cookies = parseCookieHeader(cookieHeader);
  const cookieToken = typeof cookies.coder_session_token === 'string' ? cookies.coder_session_token.trim() : '';
  if (cookieToken) {
    return cookieToken;
  }
  return coderService.getOrCreateUserScopedToken(user, { workspaceId });
};

const init = (httpServer) => {
  const wsServer = new WebSocketServer({
    httpServer,
    autoAcceptConnections: false,
  });

  wsServer.on('request', async (request) => {
    try {
      const rawUrl = request.httpRequest?.url || '';
      const { pathname, searchParams, rawSearch } = parseUrl(rawUrl);
      const coderPath = normalizeCoderPath(pathname);
      if (!coderPath) {
        request.reject(404, 'Not found');
        return;
      }

      const watchMatch = matchWatchWs(coderPath);
      const logsMatch = matchLogsWs(coderPath);
      const workspaceBuildLogsMatch = matchWorkspaceBuildLogsWs(coderPath);
      const runWsMatch = matchRunWs(coderPath);
      const runnerWsMatch = matchRunnerWs(coderPath);

      if (!watchMatch && !logsMatch && !workspaceBuildLogsMatch && !runWsMatch && !runnerWsMatch) {
        request.reject(404, 'Not found');
        return;
      }

      if (runnerWsMatch) {
        const runnerKeyFromQuery = typeof searchParams.runner_key === 'string' ? searchParams.runner_key.trim() : '';
        const runnerKeyFromEnv = String(process.env.AUTOWRX_RUNNER_KEY || '').trim();
        if (runnerKeyFromEnv && runnerKeyFromQuery !== runnerKeyFromEnv) {
          throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid runner key');
        }
        const workspaceId = typeof searchParams.workspace_id === 'string' ? searchParams.workspace_id.trim() : '';
        if (!workspaceId) {
          throw new ApiError(httpStatus.BAD_REQUEST, 'workspace_id is required');
        }
        const downstream = request.accept(null, request.origin);
        workspaceRunWsHub.registerRunner(workspaceId, downstream);
        downstream.on('message', (msg) => {
          try {
            const raw = msg.type === 'utf8' ? msg.utf8Data : null;
            if (!raw) return;
            const payload = JSON.parse(raw);
            workspaceRunWsHub.broadcastToWeb(workspaceId, payload);
            void workspaceRuntimeStateService.ingestRunnerPayload(workspaceId, payload);
          } catch (error) {
            logger.warn(`[workspace-run-ws] runner message parse failed: ${error?.message || error}`);
          }
        });
        return;
      }

      const autowrxUser = await authenticateWsUser(searchParams);
      const user = await User.findById(autowrxUser.id);
      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
      }
      if (watchMatch) {
        const { prototypeId } = watchMatch;
        const workspaceId = await resolveWorkspaceIdForPrototype(user, prototypeId);
        if (!workspaceId) {
          throw new ApiError(httpStatus.NOT_FOUND, 'Workspace not found. Prepare workspace first.');
        }

        const workspaceScopedToken = await resolveWorkspaceSessionToken({
          searchParams,
          request,
          user,
          workspaceId,
        });
        const upstreamUrl = `${getCoderApiBase()}/workspaces/${workspaceId}/watch-ws`;
        const upstream = await connectUpstream({
          url: upstreamUrl,
          headers: {
            'Coder-Session-Token': workspaceScopedToken,
          },
        });

        const downstream = request.accept(null, request.origin);
        proxyBidirectional({ downstream, upstream });
        return;
      }

      if (runWsMatch) {
        const { prototypeId } = runWsMatch;
        const workspaceId = await resolveWorkspaceIdForPrototype(user, prototypeId);
        if (!workspaceId) {
          throw new ApiError(httpStatus.NOT_FOUND, 'Workspace not found. Prepare workspace first.');
        }
        const downstream = request.accept(null, request.origin);
        workspaceRunWsHub.registerWeb(workspaceId, downstream);
        downstream.on('message', (msg) => {
          try {
            const raw = msg.type === 'utf8' ? msg.utf8Data : null;
            if (!raw) return;
            const payload = JSON.parse(raw);
            if (!payload || typeof payload !== 'object') return;
            const allowedClientTypes = new Set(['run.stdin', 'run.stop']);
            if (!allowedClientTypes.has(payload.type)) return;
            workspaceRunWsHub.sendToRunners(workspaceId, {
              ...payload,
              workspaceId: String(workspaceId),
              prototypeId: String(prototypeId),
              at: new Date().toISOString(),
            });
          } catch (error) {
            logger.warn(`[workspace-run-ws] web message parse failed: ${error?.message || error}`);
          }
        });
        return;
      }

      if (workspaceBuildLogsMatch) {
        const { workspaceBuildId } = workspaceBuildLogsMatch;
        const workspaceId =
          (await resolveWorkspaceIdForPrototype(user, searchParams.prototype_id)) ||
          (await workspaceBindingService.getWorkspaceIdForUser(user));
        if (!workspaceId) throw new ApiError(httpStatus.NOT_FOUND, 'Workspace not found. Prepare workspace first.');

        const workspaceScopedToken = await resolveWorkspaceSessionToken({
          searchParams,
          request,
          user,
          workspaceId,
        });

        const workspace = await coderService.getWorkspaceStatus(workspaceId, workspaceScopedToken);
        const expectedWorkspaceBuildId = workspace?.latest_build?.id;
        if (!expectedWorkspaceBuildId || String(workspaceBuildId) !== String(expectedWorkspaceBuildId)) {
          throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this workspace build logs');
        }

        const upstreamSearch = new URLSearchParams(rawSearch);
        if (!upstreamSearch.has('follow')) upstreamSearch.set('follow', 'true');
        if (!upstreamSearch.has('after')) upstreamSearch.set('after', '-1');

        const upstreamUrl = `${getCoderApiBase()}/workspacebuilds/${workspaceBuildId}/logs?${upstreamSearch.toString()}`;
        const upstream = await connectUpstream({
          url: upstreamUrl,
          headers: {
            'Coder-Session-Token': workspaceScopedToken,
          },
        });

        const downstream = request.accept(null, request.origin);
        proxyBidirectional({ downstream, upstream });
        return;
      }

      if (logsMatch) {
        const { workspaceAgentId } = logsMatch;
        const workspaceId =
          (await resolveWorkspaceIdForPrototype(user, searchParams.prototype_id)) ||
          (await workspaceBindingService.getWorkspaceIdForUser(user));
        if (!workspaceId) {
          throw new ApiError(httpStatus.NOT_FOUND, 'Workspace not found. Prepare workspace first.');
        }

        const workspaceScopedToken = await resolveWorkspaceSessionToken({
          searchParams,
          request,
          user,
          workspaceId,
        });
        const expectedWorkspaceAgentId = await coderService.getWorkspaceAgentId(
          workspaceId,
          workspaceScopedToken,
        );
        if (String(workspaceAgentId) !== String(expectedWorkspaceAgentId)) {
          throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this workspace agent logs');
        }

        const upstreamSearch = new URLSearchParams(rawSearch);
        if (!upstreamSearch.has('follow')) upstreamSearch.set('follow', 'true');

        const upstreamUrl = `${getCoderApiBase()}/workspaceagents/${workspaceAgentId}/logs?${upstreamSearch.toString()}`;
        const upstream = await connectUpstream({
          url: upstreamUrl,
          headers: {
            'Coder-Session-Token': workspaceScopedToken,
          },
        });

        const downstream = request.accept(null, request.origin);
        proxyBidirectional({ downstream, upstream });
        return;
      }
    } catch (err) {
      const status = err?.statusCode || err?.status || 500;
      const msg = err?.message || 'Internal server error';
      logger.warn(`Coder WS rejected: ${status} ${msg}`);
      request.reject(status, msg);
    }
  });

  logger.info('Coder WebSocket proxy initialized');
};

module.exports = {
  init,
};
