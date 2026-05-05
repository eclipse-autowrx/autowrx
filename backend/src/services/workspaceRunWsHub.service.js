// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const logger = require('../config/logger');

const channels = new Map();

const nowIso = () => new Date().toISOString();
const buildRunnerStatePayload = (workspaceId, connected) => ({
  type: connected ? 'runner.connected' : 'runner.disconnected',
  workspaceId: String(workspaceId),
  at: nowIso(),
});

const ensureChannel = (workspaceId) => {
  const key = String(workspaceId);
  let channel = channels.get(key);
  if (!channel) {
    channel = {
      runners: new Set(),
      webs: new Set(),
    };
    channels.set(key, channel);
  }
  return channel;
};

const safeSend = (conn, payload) => {
  try {
    if (!conn?.connected) return false;
    conn.sendUTF(JSON.stringify(payload));
    return true;
  } catch (error) {
    return false;
  }
};

const cleanupChannel = (workspaceId) => {
  const key = String(workspaceId);
  const channel = channels.get(key);
  if (!channel) return;
  if (channel.runners.size === 0 && channel.webs.size === 0) {
    channels.delete(key);
  }
};

const attachCloseCleanup = (workspaceId, conn, collectionName) => {
  const channel = ensureChannel(workspaceId);
  const collection = channel[collectionName];
  const remove = () => {
    const hadConn = collection.has(conn);
    try {
      collection.delete(conn);
    } catch {
      // ignore
    }
    if (collectionName === 'runners' && hadConn && channel.runners.size === 0) {
      broadcastToWeb(workspaceId, buildRunnerStatePayload(workspaceId, false));
    }
    cleanupChannel(workspaceId);
  };
  conn.on('close', remove);
  conn.on('error', remove);
};

const registerRunner = (workspaceId, conn) => {
  const channel = ensureChannel(workspaceId);
  channel.runners.add(conn);
  attachCloseCleanup(workspaceId, conn, 'runners');

  safeSend(conn, buildRunnerStatePayload(workspaceId, true));
  broadcastToWeb(workspaceId, buildRunnerStatePayload(workspaceId, true));

  logger.info(`[workspace-run-ws] runner registered workspace=${workspaceId}`);
};

const registerWeb = (workspaceId, conn) => {
  const channel = ensureChannel(workspaceId);
  channel.webs.add(conn);
  attachCloseCleanup(workspaceId, conn, 'webs');
  safeSend(conn, buildRunnerStatePayload(workspaceId, channel.runners.size > 0));
  logger.info(`[workspace-run-ws] web registered workspace=${workspaceId}`);
};

const broadcastToWeb = (workspaceId, payload) => {
  const channel = channels.get(String(workspaceId));
  if (!channel) return 0;
  let sent = 0;
  channel.webs.forEach((conn) => {
    if (safeSend(conn, payload)) sent += 1;
  });
  return sent;
};

const sendToRunners = (workspaceId, payload) => {
  const channel = channels.get(String(workspaceId));
  if (!channel || channel.runners.size === 0) return 0;
  let sent = 0;
  channel.runners.forEach((conn) => {
    if (safeSend(conn, payload)) sent += 1;
  });
  return sent;
};

const hasRunner = (workspaceId) => {
  const channel = channels.get(String(workspaceId));
  return Boolean(channel && channel.runners.size > 0);
};

const getStats = () => {
  const stats = [];
  channels.forEach((channel, workspaceId) => {
    stats.push({
      workspaceId,
      runners: channel.runners.size,
      webs: channel.webs.size,
    });
  });
  return stats;
};

module.exports = {
  registerRunner,
  registerWeb,
  broadcastToWeb,
  sendToRunners,
  hasRunner,
  getStats,
};
