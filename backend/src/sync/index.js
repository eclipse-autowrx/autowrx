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
 * - Binds per-request context (JWT passthrough) via AsyncLocalStorage
 * - Attaches X-Sync-Warning response header on sync failure (frontend shows toast)
 * - Single outbound attempt per change — failed syncs are not retried
 *
 * Client integration: replace sync-handlers/default.handler.js with your own handler.
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

/** @type {AsyncLocalStorage<{ req: import('express').Request, warnings: string[], skipSync: boolean }>} */
const storage = new AsyncLocalStorage();

/** @type {Object | null} */
let cachedHandler = null;
let pluginRegistered = false;

const getContext = () => {
  const store = storage.getStore();
  if (!store) return { warnings: [], skipSync: false };
  return {
    authorization: store.req?.headers?.authorization,
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
  // eslint-disable-next-line import/no-dynamic-require, global-require
  cachedHandler = require(HANDLER_PATH);
  logger.info('Loaded sync handler from %s', HANDLER_PATH);
  return cachedHandler;
};

const shouldAttachSyncWarning = () => {
  const store = storage.getStore();
  if (!store?.req?.method) return false;
  const method = store.req.method.toUpperCase();
  return !['GET', 'HEAD', 'OPTIONS'].includes(method);
};

/**
 * @param {Object} event
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
const triggerSync = async (event) => {
  const context = event.context || getContext();
  if (context.skipSync) return { success: true };

  const handler = loadHandler().sync;
  if (typeof handler !== 'function') return { success: true };

  try {
    const http = axios.create({
      timeout: SYNC_TIMEOUT_MS,
      // Bypass corporate HTTP_PROXY/HTTPS_PROXY for local external sync endpoints.
      proxy: false,
      headers: context.authorization ? { Authorization: context.authorization } : {},
    });
    logger.info('Data sync: %s %s → handler', event.action, event.resourceType);
    await handler({ ...event, context }, http);
    logger.info('Data sync: %s %s OK', event.action, event.resourceType);
    return { success: true };
  } catch (error) {
    const warning = buildSyncWarning(event, error);
    const store = storage.getStore();
    logger.warn(
      'External sync failed: %s %s — %s%s',
      warning.action,
      warning.resourceLabel,
      warning.message,
      warning.status ? ` [HTTP ${warning.status}]` : '',
    );
    if (store && shouldAttachSyncWarning()) {
      store.warnings.push(warning);
    } else if (!store) {
      logger.warn('Sync warning dropped — no active request context');
    }
    return { success: false, message: warning.message };
  }
};

const resolveModelId = (doc) =>
  doc.constructor.modelName === 'Model' ? String(doc._id) : String(doc.model);

const triggerSyncForDocument = async (doc, action) => {
  const resourceType = doc.constructor.modelName;
  if (!SUPPORTED_MODELS.has(resourceType)) return;
  const context = getContext();
  if (context.skipSync) return;
  logger.debug('Data sync hook: %s %s %s', action, resourceType, doc._id);
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
  const schemaName =
    schema.options?.collection ||
    Object.keys(schema.paths)
      .slice(0, 3)
      .join(',');
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
      logger.warn('Data sync save hook error: %s', err.message);
    }
  });

  schema.post('deleteOne', { document: true, query: false }, async function onDeleteSync(doc) {
    try {
      await triggerSyncForDocument(doc, 'DELETE');
    } catch (err) {
      logger.warn('Data sync delete hook error: %s', err.message);
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
    return fn();
  }
  const previous = store.skipSync;
  store.skipSync = true;
  try {
    return await fn();
  } finally {
    store.skipSync = previous;
  }
};

/** Express middleware — mount on /v2 routes. */
const middleware = (req, res, next) => {
  const store = { req, warnings: [], skipSync: false };
  const attach = () => {
    if (store.warnings.length) res.set(SYNC_WARNING_HEADER, JSON.stringify(store.warnings));
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

module.exports = { init, middleware, triggerSync, runWithSkipSync, SYNC_WARNING_HEADER };
