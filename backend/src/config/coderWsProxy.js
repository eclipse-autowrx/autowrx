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
const { PERMISSIONS } = require('./roles');

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

      if (!watchMatch && !logsMatch && !workspaceBuildLogsMatch) {
        request.reject(404, 'Not found');
        return;
      }

      const autowrxUser = await authenticateWsUser(searchParams);
      const user = await User.findById(autowrxUser.id);
      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
      }

      if (watchMatch) {
        const { prototypeId } = watchMatch;
        const prototype = await Prototype.findById(prototypeId);
        if (!prototype) {
          throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
        }
        const hasPermission = await permissionService.hasPermission(user.id, PERMISSIONS.READ_MODEL, prototype.model_id);
        if (!hasPermission) {
          throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to access this prototype');
        }
        if (!user.coder_workspace_id) {
          throw new ApiError(httpStatus.NOT_FOUND, 'Workspace not found. Prepare workspace first.');
        }

        const workspaceScopedToken = await coderService.getOrCreateUserScopedToken(user, {
          workspaceId: user.coder_workspace_id,
        });
        const upstreamUrl = `${getCoderApiBase()}/workspaces/${user.coder_workspace_id}/watch-ws`;
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

      if (workspaceBuildLogsMatch) {
        const { workspaceBuildId } = workspaceBuildLogsMatch;
        if (!user.coder_workspace_id) {
          throw new ApiError(httpStatus.NOT_FOUND, 'Workspace not found. Prepare workspace first.');
        }

        const workspaceScopedToken = await coderService.getOrCreateUserScopedToken(user, {
          workspaceId: user.coder_workspace_id,
        });

        const workspace = await coderService.getWorkspaceStatus(user.coder_workspace_id, workspaceScopedToken);
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
        if (!user.coder_workspace_id) {
          throw new ApiError(httpStatus.NOT_FOUND, 'Workspace not found. Prepare workspace first.');
        }

        const workspaceScopedToken = await coderService.getOrCreateUserScopedToken(user, {
          workspaceId: user.coder_workspace_id,
        });
        const expectedWorkspaceAgentId = await coderService.getWorkspaceAgentId(
          user.coder_workspace_id,
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
