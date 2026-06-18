// SPDX-License-Identifier: MIT
//
// AAOS Bridge Service
// -------------------
//
// Full request/response flow:
//
//   Plugin
//     → POST /v2/aaos/request
//     → configured Rust service  [forwarded by this service]
//     → POST /v2/aaos/response                        [called by Rust service]
//     → WebSocket broadcast  (ws://localhost:3201/aaos-ws)
//     → Plugin update
//
// REST fallback (for plugins that cannot use WebSocket):
//   Plugin → GET /v2/aaos/latest → returns last stored response

const axios = require('axios');
const http = require('http');
const httpStatus = require('http-status');
const WebSocket = require('ws');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

// Disable keep-alive so each request to the Rust service uses a fresh TCP connection.
// Rust services (e.g. Actix-web) often close connections after responding, which causes
// axios to receive ERR_BAD_RESPONSE / "stream has been aborted" when it reuses a
// keep-alive connection that the server has already closed.
const _rustAgent = new http.Agent({ keepAlive: false });

// ─── Configuration ─────────────────────────────────────────────────────────────
const UINT16_MAX = 0xffff;
const HEX_FIELD_PATTERN = /^(?:0x)?[0-9a-f]+$/i;
const MAX_NETWORK_PAYLOAD_BYTES = 1024 * 1024;
const { rustServiceUrl, operation, subscribeMethodId, ttlMs, requestTimeoutMs } = config.aaos;

// ─── In-memory store ───────────────────────────────────────────────────────────
// Replaced on every new request/response. Resets on server restart.
let _latestResponse = null;

// ─── WebSocket client registry ─────────────────────────────────────────────────
// Populated once initWebSocket() is called from index.js after the HTTP server starts.
const _clients = new Set();
let _wss = null;

const failValidation = (message) => {
  logger.warn('[AAOS] Aborting AAOS processing: %s', message);
  throw new ApiError(httpStatus.BAD_REQUEST, message);
};

const assertPlainObject = (value, fieldName) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    failValidation(`Invalid AAOS payload: ${fieldName} must be a JSON object`);
  }
};

const stringifyNetworkPayload = (payload, fieldName) => {
  let serialized;
  try {
    serialized = JSON.stringify(payload);
  } catch (err) {
    failValidation(`Invalid AAOS payload: ${fieldName} must be JSON serializable`);
  }

  if (typeof serialized !== 'string') {
    failValidation(`Invalid AAOS payload: ${fieldName} must be JSON serializable`);
  }

  if (Buffer.byteLength(serialized, 'utf8') > MAX_NETWORK_PAYLOAD_BYTES) {
    failValidation(`Invalid AAOS payload: ${fieldName} exceeds maximum size`);
  }

  return serialized;
};

const parseRequiredHexUint16 = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim() === '') {
    failValidation(`Invalid SOME/IP payload: ${fieldName} is required and must be a hex string`);
  }

  const trimmed = value.trim();
  if (!HEX_FIELD_PATTERN.test(trimmed)) {
    failValidation(`Invalid SOME/IP payload: ${fieldName} must be a valid hex string`);
  }

  const parsed = Number.parseInt(trimmed, 16);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > UINT16_MAX) {
    failValidation(`Invalid SOME/IP payload: ${fieldName} must be a 16-bit unsigned integer`);
  }

  return parsed;
};

const validateRustPayload = (rustPayload) => {
  assertPlainObject(rustPayload, 'rustPayload');

  Object.entries(rustPayload).forEach(([fieldName, value]) => {
    if (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0)) {
      failValidation(`Invalid Rust payload: ${fieldName} must be a non-negative safe integer`);
    }
  });

  if (rustPayload.operation !== operation) {
    failValidation(`Invalid Rust payload: operation must be ${operation}`);
  }
};

const validateRustResponse = (response) => {
  if (!response || typeof response !== 'object') {
    failValidation('Invalid Rust response: response must be an object');
  }

  if (!Number.isInteger(response.status) || response.status < 200 || response.status > 299) {
    failValidation('Invalid Rust response: status must be a 2xx integer');
  }

  assertPlainObject(response.data, 'Rust response data');
  stringifyNetworkPayload(response.data, 'Rust response data');
};

const getPayloadSummary = (payload) => {
  const keys = Object.keys(payload);
  return {
    keys,
    sizeBytes: Buffer.byteLength(JSON.stringify(payload), 'utf8'),
  };
};

/**
 * Attach a WebSocket.Server to the existing Express HTTP server.
 * Called once from backend/src/index.js after app.listen() returns.
 *
 * Clients connect via:  ws://localhost:3201/aaos-ws
 *
 * @param {import('http').Server} httpServer - The Node.js HTTP server created by app.listen()
 */
const initWebSocket = (httpServer) => {
  _wss = new WebSocket.Server({ server: httpServer, path: '/aaos-ws' });

  _wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    _clients.add(ws);
    logger.info('[AAOS-WS] Client connected from %s — total: %d', clientIp, _clients.size);

    ws.on('close', () => {
      _clients.delete(ws);
      logger.info('[AAOS-WS] Client disconnected from %s — total: %d', clientIp, _clients.size);
    });

    ws.on('error', (err) => {
      logger.error('[AAOS-WS] Client error from %s: %s', clientIp, err.message);
      _clients.delete(ws);
    });
  });

  logger.info('[AAOS-WS] WebSocket server initialised at path /aaos-ws');
};

/**
 * Forward a plugin request payload to the configured Rust service.
 *
 * Plugin sends SOME/IP identifiers as hex strings:
 *   { signalName, mode, someip: { serviceId, instanceId, methodId, operationId, eventGroupId } }
 *
 * Mapping to Rust schema (decimal integers):
 *   service_id  ← someip.serviceId
 *   instance_id ← someip.instanceId
 *   event_id    ← someip.operationId   (SOME/IP operation → event to subscribe to)
 *   method_id   ← configured subscribe method ID
 *
 * Working curl reference:
 *   {"service_id":16640,"instance_id":4096,"event_id":33808,"method_id":16,...}
 */
const forwardToRust = async (payload) => {
  assertPlainObject(payload, 'request body');
  stringifyNetworkPayload(payload, 'request body');

  assertPlainObject(payload.someip, 'someip');

  const { serviceId, instanceId, operationId } = payload.someip;
  const parsedOperationId = parseRequiredHexUint16(operationId, 'someip.operationId');
  const payloadSummary = getPayloadSummary(payload);

  const rustPayload = {
    service_id:  parseRequiredHexUint16(serviceId, 'someip.serviceId'),
    instance_id: parseRequiredHexUint16(instanceId, 'someip.instanceId'),
    event_id:    parsedOperationId,
    method_id:   subscribeMethodId,
    operation,
    ttl_ms: ttlMs,
  };

  validateRustPayload(rustPayload);

  logger.info(
    '[AAOS] Forwarding request to Rust service. keys=%s sizeBytes=%d serviceId=%s instanceId=%s operationId=%s',
    payloadSummary.keys.join(','),
    payloadSummary.sizeBytes,
    serviceId,
    instanceId,
    operationId
  );
  logger.debug('[AAOS] Rust payload: %s', JSON.stringify(rustPayload));

  try {
    const response = await axios.post(rustServiceUrl, rustPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: requestTimeoutMs,
      httpAgent: _rustAgent,
    });
    validateRustResponse(response);
    logger.info('[AAOS] Rust service responded with status %d', response.status);
    logger.debug('[AAOS] Rust response data: %s', JSON.stringify(response.data));
    return response.data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    logger.error(
      '[AAOS] Rust request failed. code=%s message=%s status=%s',
      err.code,
      err.message,
      err.response?.status
    );
    logger.debug('[AAOS] Rust error response data: %s', JSON.stringify(err.response?.data));
    throw err;
  }
};

/**
 * Store a new AAOS response payload and broadcast it to all connected WebSocket clients.
 * Called by the controller handling POST /v2/aaos/response (i.e. invoked by the Rust service).
 *
 * @param {object} payload - Any JSON payload from the Rust service.
 */
const storeResponseAndBroadcast = (payload) => {
  assertPlainObject(payload, 'response body');
  stringifyNetworkPayload(payload, 'response body');

  _latestResponse = { payload, timestamp: new Date().toISOString() };
  const payloadSummary = getPayloadSummary(payload);
  logger.info('[AAOS] Response stored. keys=%s sizeBytes=%d', payloadSummary.keys.join(','), payloadSummary.sizeBytes);

  // Broadcast to all connected WebSocket clients.
  const message = JSON.stringify({ event: 'aaos:response', data: _latestResponse });
  let sent = 0;
  _clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
        sent++;
      } catch (err) {
        logger.error('[AAOS-WS] Failed to send response to client: %s', err.message);
        _clients.delete(ws);
      }
    }
  });
  logger.info('[AAOS-WS] Broadcasted response to %d / %d clients', sent, _clients.size);
};

/**
 * Return the latest stored AAOS response, or null if none received yet.
 * @returns {{ payload: object, timestamp: string } | null}
 */
const getLatestResponse = () => _latestResponse;

module.exports = {
  initWebSocket,
  forwardToRust,
  storeResponseAndBroadcast,
  getLatestResponse,
};
