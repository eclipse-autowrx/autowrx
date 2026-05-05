// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { createClient } = require('redis');
const logger = require('../config/logger');
const coderConfig = require('../utils/coderConfig');

const KEY_TTL_SECONDS = Number(process.env.RUNTIME_STATE_TTL_SECONDS || 24 * 60 * 60);
const MAX_APP_LOG_BYTES = Number(process.env.RUNTIME_APP_LOG_MAX_BYTES || 256 * 1024);

let redisClient = null;
let redisReady = false;
let redisUrl = '';
let redisConnectPromise = null;

const memoryState = new Map();

const keyPrefix = (workspaceId) => `autowrx:rt:${String(workspaceId)}`;
const keySignals = (workspaceId) => `${keyPrefix(workspaceId)}:signals`;
const keyTraceVars = (workspaceId) => `${keyPrefix(workspaceId)}:trace`;
const keyAppLog = (workspaceId) => `${keyPrefix(workspaceId)}:applog`;
const keyMeta = (workspaceId) => `${keyPrefix(workspaceId)}:meta`;

const nowIso = () => new Date().toISOString();

const parseJsonField = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const parseNdjsonObjects = (content) => {
  if (!content || typeof content !== 'string') return {};
  const patch = {};
  const lines = content.split(/\r?\n/);
  lines.forEach((line) => {
    const t = String(line || '').trim();
    if (!t.startsWith('{')) return;
    try {
      const obj = JSON.parse(t);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        Object.assign(patch, obj);
      }
    } catch {
      // ignore malformed NDJSON line
    }
  });
  return patch;
};

const ensureAppLogSize = (text) => {
  const value = String(text || '');
  if (Buffer.byteLength(value, 'utf8') <= MAX_APP_LOG_BYTES) return value;
  const buf = Buffer.from(value, 'utf8');
  return buf.subarray(buf.length - MAX_APP_LOG_BYTES).toString('utf8');
};

const ensureMemoryEntry = (workspaceId) => {
  const key = String(workspaceId);
  let entry = memoryState.get(key);
  if (!entry) {
    entry = {
      signals: {},
      traceVars: {},
      appLog: '',
      status: 'connecting',
      updatedAt: nowIso(),
      expireAtMs: Date.now() + KEY_TTL_SECONDS * 1000,
    };
    memoryState.set(key, entry);
  }
  entry.expireAtMs = Date.now() + KEY_TTL_SECONDS * 1000;
  return entry;
};

const cleanupExpiredMemory = () => {
  const now = Date.now();
  memoryState.forEach((entry, key) => {
    if ((entry?.expireAtMs || 0) < now) memoryState.delete(key);
  });
};

const closeRedisClient = async () => {
  if (!redisClient) return;
  try {
    await redisClient.quit();
  } catch {
    try {
      redisClient.disconnect();
    } catch {
      // ignore
    }
  }
  redisClient = null;
  redisReady = false;
  redisUrl = '';
  redisConnectPromise = null;
};

const ensureRedisClientConnected = async () => {
  let configuredRedisUrl = '';
  try {
    const cfg = await coderConfig.getCoderConfig();
    configuredRedisUrl = String(cfg?.redisUrl || '').trim();
  } catch {
    configuredRedisUrl = '';
  }

  if (!configuredRedisUrl) {
    if (redisClient) await closeRedisClient();
    return;
  }

  if (redisClient && redisUrl === configuredRedisUrl) {
    if (redisReady) return;
    if (redisConnectPromise) {
      await redisConnectPromise.catch(() => {});
    }
    return;
  }

  if (redisClient && redisUrl !== configuredRedisUrl) {
    await closeRedisClient();
  }

  redisClient = createClient({ url: configuredRedisUrl });
  redisUrl = configuredRedisUrl;

  redisClient.on('error', (error) => {
    redisReady = false;
    logger.warn(`[workspace-runtime-state] redis error: ${error?.message || error}`);
  });
  redisClient.on('ready', () => {
    redisReady = true;
    logger.info(`[workspace-runtime-state] redis connected (${redisUrl})`);
  });
  redisClient.on('end', () => {
    redisReady = false;
    logger.warn('[workspace-runtime-state] redis disconnected');
  });

  redisConnectPromise = redisClient.connect().catch((error) => {
    redisReady = false;
    logger.warn(`[workspace-runtime-state] redis connect failed: ${error?.message || error}`);
  });
  await redisConnectPromise;
};

const appendToAppLog = async (workspaceId, text) => {
  if (!text) return;
  await ensureRedisClientConnected();
  if (redisReady && redisClient) {
    const current = await redisClient.get(keyAppLog(workspaceId));
    const next = ensureAppLogSize(`${current || ''}${text}`);
    await redisClient.set(keyAppLog(workspaceId), next, { EX: KEY_TTL_SECONDS });
    return;
  }
  const entry = ensureMemoryEntry(workspaceId);
  entry.appLog = ensureAppLogSize(`${entry.appLog || ''}${text}`);
};

const setStatus = async (workspaceId, status) => {
  const updatedAt = nowIso();
  await ensureRedisClientConnected();
  if (redisReady && redisClient) {
    await redisClient.hSet(keyMeta(workspaceId), {
      status: String(status || ''),
      updatedAt,
    });
    await redisClient.expire(keyMeta(workspaceId), KEY_TTL_SECONDS);
    return;
  }
  const entry = ensureMemoryEntry(workspaceId);
  entry.status = String(status || '');
  entry.updatedAt = updatedAt;
};

const mergeSignals = async (workspaceId, patch) => {
  const entries = Object.entries(patch || {});
  if (entries.length === 0) return;
  await ensureRedisClientConnected();
  if (redisReady && redisClient) {
    const valueMap = {};
    entries.forEach(([k, v]) => {
      valueMap[String(k)] = JSON.stringify(v);
    });
    await redisClient.hSet(keySignals(workspaceId), valueMap);
    await redisClient.expire(keySignals(workspaceId), KEY_TTL_SECONDS);
    return;
  }
  const entry = ensureMemoryEntry(workspaceId);
  entry.signals = { ...(entry.signals || {}), ...patch };
};

const ingestRunnerPayload = async (workspaceId, payload) => {
  if (!workspaceId || !payload || typeof payload !== 'object') return;
  cleanupExpiredMemory();
  const type = String(payload.type || '');
  if (!type) return;

  if (type === 'run.output') {
    const text = String(payload.data || '');
    if (text) {
      const patch = parseNdjsonObjects(text);
      await mergeSignals(workspaceId, patch);
      await appendToAppLog(workspaceId, text);
    }
    await setStatus(workspaceId, 'running');
    return;
  }
  if (type === 'run.waiting_input') {
    await setStatus(workspaceId, 'waiting_input');
    return;
  }
  if (type === 'run.started') {
    await setStatus(workspaceId, 'running');
    return;
  }
  if (type === 'run.error') {
    const message = String(payload.message || payload.error || payload.data || 'Runner error');
    await appendToAppLog(workspaceId, `\n[run.error] ${message}\n`);
    await setStatus(workspaceId, 'error');
    return;
  }
  if (type === 'run.exit') {
    const summary = `\n[run.exit] code=${payload.code} signal=${payload.signal || 'none'}\n`;
    await appendToAppLog(workspaceId, summary);
    await setStatus(workspaceId, 'exited');
  }
};

const getRuntimeStateSnapshot = async (workspaceId) => {
  if (!workspaceId) {
    return {
      apisValue: {},
      traceVars: {},
      appLog: '',
      status: 'connecting',
      updatedAt: nowIso(),
    };
  }

  await ensureRedisClientConnected();
  if (redisReady && redisClient) {
    const [signalsRaw, traceRaw, appLog, metaRaw] = await Promise.all([
      redisClient.hGetAll(keySignals(workspaceId)),
      redisClient.hGetAll(keyTraceVars(workspaceId)),
      redisClient.get(keyAppLog(workspaceId)),
      redisClient.hGetAll(keyMeta(workspaceId)),
    ]);
    const apisValue = {};
    Object.entries(signalsRaw || {}).forEach(([k, v]) => {
      apisValue[k] = parseJsonField(v);
    });
    const traceVars = {};
    Object.entries(traceRaw || {}).forEach(([k, v]) => {
      traceVars[k] = parseJsonField(v);
    });
    return {
      apisValue,
      traceVars,
      appLog: String(appLog || ''),
      status: String(metaRaw?.status || 'connecting'),
      updatedAt: String(metaRaw?.updatedAt || nowIso()),
    };
  }

  cleanupExpiredMemory();
  const entry = ensureMemoryEntry(workspaceId);
  return {
    apisValue: entry.signals || {},
    traceVars: entry.traceVars || {},
    appLog: String(entry.appLog || ''),
    status: String(entry.status || 'connecting'),
    updatedAt: String(entry.updatedAt || nowIso()),
  };
};

module.exports = {
  ingestRunnerPayload,
  getRuntimeStateSnapshot,
};
