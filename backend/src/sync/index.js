// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * External data sync — single module.
 *
 * - Registers a global Mongoose plugin on Model / ExtendedApi / Api schemas
 * - Binds per-request context via AsyncLocalStorage
 * - Attaches X-Sync-Warning response header on sync failure (frontend shows toast)
 *
 * Request-path (awaited) sync:
 * - Sync is awaited in Mongoose post-hooks and in controller calls to triggerSync
 *   so X-Sync-Warning can be set on the same mutating HTTP response before it is sent.
 * - Save/create/delete latency may include one outbound handler call (timeout SYNC_TIMEOUT_MS).
 *
 * Single attempt — no retry/queue:
 * - Each change triggers at most one outbound call. Failures are not retried.
 * - The local DB write still succeeds; the frontend shows a toast when the warning header is set.
 * - Known limitation: a failed sync means the external system can miss that change until a
 *   later successful write triggers another sync.
 *
 * Outbound HTTP:
 * - Uses EXTERNAL_SYNC_DEVICE_TOKEN as Authorization when set.
 * - Respects process HTTP_PROXY / HTTPS_PROXY when set (no proxy bypass).
 *
 * Client integration: replace sync-handlers/default.handler.js with your own handler.
 * In production the handler module is cached after first load — restart the process
 * (or rebuild the image) after replacing the file. Development reloads it each sync.
 *
 * X-Sync-Warning values are percent-encoded JSON (latin1-safe) and length-capped so
 * non-ASCII model names / error messages cannot break the HTTP response.
 */

const { AsyncLocalStorage } = require('async_hooks');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const config = require('../config/config');
const logger = require('../config/logger');

const SYNC_WARNING_HEADER = 'X-Sync-Warning';
const SYNC_TIMEOUT_MS = 30000;
const HANDLER_PATH = path.join(__dirname, '../../sync-handlers/default.handler.js');
const SUPPORTED_MODELS = new Set(['Model', 'ExtendedApi', 'Api']);
const EXTERNAL_SYNC_DEVICE_TOKEN = config.services?.sync?.external?.deviceToken;
const EXTERNAL_SYNC_MODEL_URL = config.services?.sync?.external?.modelUrl;
/** Max encoded length for X-Sync-Warning (Node headers must be latin1-safe). */
const SYNC_WARNING_HEADER_MAX_LEN = 2048;

/**
 * Encode warning payload for an HTTP header (latin1-safe, length-capped).
 * Frontend only needs header presence for the toast; content may be percent-encoded JSON.
 * @param {unknown[]} warnings
 * @returns {string | null}
 */
const encodeSyncWarningHeader = (warnings) => {
  if (!Array.isArray(warnings) || warnings.length === 0) return null;
  let encoded = encodeURIComponent(JSON.stringify(warnings));
  if (encoded.length > SYNC_WARNING_HEADER_MAX_LEN) {
    const truncated = warnings.slice(0, 1).map((w) => ({
      action: w?.action,
      resourceType: w?.resourceType,
      resourceId: w?.resourceId,
      resourceLabel: 'sync',
      status: w?.status ?? null,
      message: 'External sync failed',
    }));
    encoded = encodeURIComponent(JSON.stringify(truncated));
    if (encoded.length > SYNC_WARNING_HEADER_MAX_LEN) {
      encoded = encodeURIComponent(JSON.stringify([{ message: 'External sync failed' }]));
    }
  }
  return encoded;
};

/**
 * @param {Object} event
 * @returns {string}
 */
const formatResourceLabel = (event) => {
  const { action, resourceType, document, resourceId } = event;

  switch (resourceType) {
    case 'Model': {
      const name = document?.name;
      return name ? `Model "${name}"` : `Model ${resourceId}`;
    }
    case 'ExtendedApi': {
      if (action === 'BULK_REPLACE') {
        const modelName = document?.model?.name;
        const count = document?.extendedApis?.length ?? 0;
        if (modelName) return `Extended APIs for Model "${modelName}" (${count} APIs)`;
        return `Extended APIs bulk replace (${count} APIs)`;
      }
      const apiName = document?.apiName;
      return apiName ? `Extended API "${apiName}"` : `Extended API ${resourceId}`;
    }
    case 'Api':
      return document?.cvi ? 'Vehicle API (CVI)' : `Vehicle API ${resourceId}`;
    default:
      return `${resourceType} ${resourceId}`;
  }
};

/**
 * @param {import('axios').AxiosError | Error} error
 * @returns {string}
 */
const extractSyncErrorDetail = (error) => {
  if (error.response?.data?.message) return String(error.response.data.message);
  if (error.response?.data?.error) return String(error.response.data.error);
  if (error.code === 'ECONNREFUSED') return 'External sync endpoint is unreachable';
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    return `External sync request timed out after ${SYNC_TIMEOUT_MS / 1000}s`;
  }
  return error.message || 'External sync failed';
};

/**
 * @param {Object} event
 * @param {import('axios').AxiosError | Error} error
 * @returns {{ action: string, resourceType: string, resourceId?: string, resourceLabel: string, status: number | null, message: string }}
 */
const buildSyncWarning = (event, error) => ({
  action: event.action,
  resourceType: event.resourceType,
  resourceId: event.resourceId,
  resourceLabel: formatResourceLabel(event),
  status: error.response?.status ?? null,
  message: extractSyncErrorDetail(error),
});

/** Base URL handlers typically use (example handler default if env unset). */
const getSyncTargetBaseUrl = () => EXTERNAL_SYNC_MODEL_URL || 'http://localhost:5050';

/**
 * @param {import('axios').AxiosError | Error} error
 * @returns {string | null}
 */
const extractSyncRequestUrl = (error) => {
  const cfg = error?.config;
  if (!cfg) return null;
  if (cfg.url && /^https?:\/\//i.test(cfg.url)) return cfg.url;
  const base = cfg.baseURL ? String(cfg.baseURL).replace(/\/$/, '') : '';
  const urlPath = cfg.url ? String(cfg.url).replace(/^\//, '') : '';
  if (base && urlPath) return `${base}/${urlPath}`;
  return base || urlPath || null;
};

/**
 * Actionable hints for operators (never includes secrets).
 * @param {boolean} hasDeviceToken
 * @returns {string[]}
 */
const buildSyncSetupHints = (hasDeviceToken) => {
  const hints = [];
  if (!hasDeviceToken) {
    hints.push(
      'EXTERNAL_SYNC_DEVICE_TOKEN is not set — outbound sync sends no Authorization header; set it in backend .env if the external API requires auth',
    );
  }
  const baseUrl = getSyncTargetBaseUrl();
  if (!EXTERNAL_SYNC_MODEL_URL) {
    hints.push(`EXTERNAL_SYNC_MODEL_URL is not set — handlers that follow the example default to ${baseUrl}`);
  } else {
    hints.push(`EXTERNAL_SYNC_MODEL_URL=${baseUrl}`);
  }
  return hints;
};

/**
 * @param {import('axios').AxiosError | Error} error
 * @param {boolean} hasDeviceToken
 * @returns {string[]}
 */
const buildSyncFailureReasons = (error, hasDeviceToken) => {
  const reasons = [];
  const target = extractSyncRequestUrl(error);

  if (error.code === 'ECONNREFUSED') {
    reasons.push(
      target
        ? `Nothing is listening at ${target} (connection refused)`
        : `Nothing is listening at the configured sync endpoint (connection refused; check ${getSyncTargetBaseUrl()})`,
    );
    reasons.push('Start the external sync server or correct EXTERNAL_SYNC_MODEL_URL in backend .env');
  } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    reasons.push(`Sync request timed out after ${SYNC_TIMEOUT_MS / 1000}s${target ? ` (${target})` : ''}`);
  }

  const status = error.response?.status;
  if (status === 401 || status === 403) {
    if (!hasDeviceToken) {
      reasons.push('HTTP 401/403 — EXTERNAL_SYNC_DEVICE_TOKEN may be missing or invalid for the external API');
    } else {
      reasons.push('HTTP 401/403 — EXTERNAL_SYNC_DEVICE_TOKEN may be invalid for the external API');
    }
  }

  if (!hasDeviceToken && !reasons.some((r) => r.includes('EXTERNAL_SYNC_DEVICE_TOKEN'))) {
    reasons.push('EXTERNAL_SYNC_DEVICE_TOKEN is not set — external API may require it');
  }

  return reasons;
};

/** @type {AsyncLocalStorage<{ req: import('express').Request, warnings: string[], skipSync: boolean }>} */
const storage = new AsyncLocalStorage();

/** @type {Object | null} */
let cachedHandler = null;
let pluginRegistered = false;

const getContext = () => {
  const store = storage.getStore();
  if (!store) return { warnings: [], skipSync: false };
  return {
    userId: store.req?.user?.id,
    warnings: store.warnings,
    skipSync: store.skipSync,
  };
};

const loadHandler = () => {
  if (config.env === 'development') {
    if (fs.existsSync(HANDLER_PATH)) {
      delete require.cache[require.resolve(HANDLER_PATH)];
    }
    cachedHandler = null;
  }
  if (cachedHandler) return cachedHandler;
  if (!fs.existsSync(HANDLER_PATH)) {
    logger.warn('Sync handler not found at %s; using no-op', HANDLER_PATH);
    cachedHandler = { sync: async () => {} };
    return cachedHandler;
  }
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    cachedHandler = require(HANDLER_PATH);
    logger.info('Loaded sync handler from %s', HANDLER_PATH);
    return cachedHandler;
  } catch (err) {
    logger.warn('Failed to load sync handler from %s: %s', HANDLER_PATH, err.message);
    // Do not cache the failure — next request can retry after the file is fixed.
    throw err;
  }
};

const shouldAttachSyncWarning = () => {
  const store = storage.getStore();
  if (!store?.req?.method) return false;
  const method = store.req.method.toUpperCase();
  return !['GET', 'HEAD', 'OPTIONS'].includes(method);
};

/**
 * Compact identity fields for sync tracing (never logs secrets).
 * @param {Object} event
 * @param {Object} [context]
 * @returns {string}
 */
const formatSyncTrace = (event, context = {}) => {
  const parts = [
    event.action,
    formatResourceLabel(event),
    event.resourceId ? `resourceId=${event.resourceId}` : null,
    event.modelId ? `modelId=${event.modelId}` : null,
    event.userId || context.userId ? `userId=${event.userId || context.userId}` : null,
  ].filter(Boolean);
  return parts.join(' | ');
};

/**
 * @param {Object} event
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
const triggerSync = async (event) => {
  const context = event.context || getContext();
  const trace = formatSyncTrace(event, context);

  if (context.skipSync) {
    logger.info('Data sync skipped (skipSync): %s', trace);
    return { success: true };
  }

  const hasDeviceToken = Boolean(EXTERNAL_SYNC_DEVICE_TOKEN);
  const setupHints = buildSyncSetupHints(hasDeviceToken);
  const startedAt = Date.now();

  try {
    // loadHandler can throw on a broken/custom handler file — keep it inside try so
    // local writes never fail because of sync customization.
    const loaded = loadHandler();
    const handler = loaded?.sync;
    if (typeof handler !== 'function') {
      logger.info('Data sync skipped (handler.sync missing): %s | handler=%s', trace, loaded?.name || 'unknown');
      return { success: true };
    }

    const headers = hasDeviceToken ? { Authorization: `Bearer ${EXTERNAL_SYNC_DEVICE_TOKEN}` } : {};
    const http = axios.create({
      timeout: SYNC_TIMEOUT_MS,
      // Honor HTTP_PROXY / HTTPS_PROXY when set (corporate egress).
      headers,
    });
    logger.info(
      'Data sync start: %s | handler=%s | authToken=%s | timeoutMs=%s | setup=%s',
      trace,
      loaded?.name || 'default',
      hasDeviceToken ? 'set' : 'unset',
      SYNC_TIMEOUT_MS,
      setupHints.join('; '),
    );
    await handler({ ...event, context }, http);
    logger.info('Data sync OK: %s | durationMs=%s', trace, Date.now() - startedAt);
    return { success: true };
  } catch (error) {
    const warning = buildSyncWarning(event, error);
    const store = storage.getStore();
    const durationMs = Date.now() - startedAt;
    const requestUrl = extractSyncRequestUrl(error);
    const failureReasons = buildSyncFailureReasons(error, hasDeviceToken);
    logger.warn(
      'Data sync failed: %s | %s%s | durationMs=%s | axiosCode=%s | requestUrl=%s | reasons=%s',
      trace,
      warning.message,
      warning.status ? ` | HTTP ${warning.status}` : '',
      durationMs,
      error.code || 'none',
      requestUrl || 'unknown',
      failureReasons.join('; '),
    );
    if (store && shouldAttachSyncWarning()) {
      store.warnings.push(warning);
      logger.info('Data sync warning attached to response: %s | warningCount=%s', trace, store.warnings.length);
    } else if (!store) {
      logger.warn('Data sync warning dropped — no active request context: %s', trace);
    } else {
      logger.info(
        'Data sync warning not attached (non-mutating request): %s | method=%s',
        trace,
        store.req?.method || 'unknown',
      );
    }
    return { success: false, message: warning.message };
  }
};

const resolveModelId = (doc) => (doc.constructor.modelName === 'Model' ? String(doc._id) : String(doc.model));

const triggerSyncForDocument = async (doc, action) => {
  const resourceType = doc.constructor.modelName;
  if (!SUPPORTED_MODELS.has(resourceType)) {
    logger.info('Data sync hook ignored unsupported model: %s %s', action, resourceType);
    return;
  }
  const context = getContext();
  if (context.skipSync) {
    logger.info('Data sync hook skipped (skipSync): %s %s %s', action, resourceType, doc._id);
    return;
  }
  logger.info('Data sync hook: %s %s %s', action, resourceType, doc._id);
  await triggerSync({
    action,
    resourceType,
    resourceId: String(doc._id),
    modelId: resolveModelId(doc),
    document: doc.toObject(),
    userId: context.userId,
    context,
  });
};

const isSyncSchema = (schema) => {
  if (schema.paths.main_api && schema.paths.vehicle_category) return true;
  if (schema.paths.apiName && schema.paths.model) return true;
  if (schema.paths.cvi && schema.paths.model && !schema.paths.apiName) return true;
  return false;
};

const applySyncHooks = (schema) => {
  const schemaName = schema.options?.collection || Object.keys(schema.paths).slice(0, 3).join(',');
  logger.info('Data sync hooks registered for schema (%s)', schemaName);

  schema.pre('save', function captureWasNew(next) {
    this.$locals._syncWasNew = this.isNew;
    next();
  });

  schema.post('save', async function onSaveSync(doc) {
    const action = doc.$locals?._syncWasNew ? 'CREATE' : 'UPDATE';
    try {
      await triggerSyncForDocument(doc, action);
    } catch (err) {
      logger.warn('Data sync save hook error: %s %s %s — %s', action, doc.constructor?.modelName, doc._id, err.message);
    }
  });

  schema.post('deleteOne', { document: true, query: false }, async function onDeleteSync(doc) {
    try {
      await triggerSyncForDocument(doc, 'DELETE');
    } catch (err) {
      logger.warn('Data sync delete hook error: DELETE %s %s — %s', doc.constructor?.modelName, doc._id, err.message);
    }
  });
};

/** Call once before any Mongoose models are loaded. */
const init = () => {
  if (pluginRegistered) return;
  mongoose.plugin((schema) => {
    if (isSyncSchema(schema)) applySyncHooks(schema);
  });
  pluginRegistered = true;
};

/**
 * Run a function with per-document sync hooks disabled (bulk sub-operations).
 * Call triggerSync manually once after the bulk work completes.
 * @template T
 * @param {() => T | Promise<T>} fn
 * @returns {Promise<T>}
 */
const runWithSkipSync = async (fn) => {
  const store = storage.getStore();
  if (!store) {
    logger.info('Data sync runWithSkipSync: no request context; running without skip flag');
    return fn();
  }
  const previous = store.skipSync;
  store.skipSync = true;
  logger.info('Data sync runWithSkipSync: hooks disabled for nested writes');
  try {
    return await fn();
  } finally {
    store.skipSync = previous;
    logger.info('Data sync runWithSkipSync: hooks restored (skipSync=%s)', previous);
  }
};

/** Express middleware — mount on /v2 routes. */
const middleware = (req, res, next) => {
  const store = { req, warnings: [], skipSync: false };
  const attach = () => {
    if (!store.warnings.length) return;
    try {
      const encoded = encodeSyncWarningHeader(store.warnings);
      if (encoded) res.set(SYNC_WARNING_HEADER, encoded);
    } catch (err) {
      // Never let header serialization break a successful write response.
      logger.warn('Data sync warning header skipped: %s', err.message);
    }
  };
  const originalSend = res.send.bind(res);
  const originalJson = res.json.bind(res);
  const originalEnd = res.end.bind(res);
  res.send = (body) => {
    attach();
    return originalSend(body);
  };
  res.json = (body) => {
    attach();
    return originalJson(body);
  };
  res.end = (...args) => {
    attach();
    return originalEnd(...args);
  };
  storage.run(store, () => next());
};

module.exports = { init, middleware, triggerSync, runWithSkipSync, SYNC_WARNING_HEADER, encodeSyncWarningHeader };
