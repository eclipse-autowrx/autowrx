// SPDX-License-Identifier: MIT
//
// AAOS Bridge Service
// -------------------
//
// Full request/response flow:
//
//   Plugin
//     → POST /v2/aaos/request
//     → Rust service (http://127.0.0.1:8080/config)  [forwarded by this service]
//     → POST /v2/aaos/response                        [called by Rust service]
//     → WebSocket broadcast  (ws://localhost:3201/aaos-ws)
//     → Plugin update
//
// REST fallback (for plugins that cannot use WebSocket):
//   Plugin → GET /v2/aaos/latest → returns last stored response

const axios = require('axios');
const http = require('http');
const WebSocket = require('ws');
const logger = require('../config/logger');

// Disable keep-alive so each request to the Rust service uses a fresh TCP connection.
// Rust services (e.g. Actix-web) often close connections after responding, which causes
// axios to receive ERR_BAD_RESPONSE / "stream has been aborted" when it reuses a
// keep-alive connection that the server has already closed.
const _rustAgent = new http.Agent({ keepAlive: false });

// ─── Configuration ─────────────────────────────────────────────────────────────
const RUST_SERVICE_URL = 'http://127.0.0.1:8080/config';

// ─── In-memory store ───────────────────────────────────────────────────────────
// Replaced on every new request/response. Resets on server restart.
let _latestResponse = null;

// ─── WebSocket client registry ─────────────────────────────────────────────────
// Populated once initWebSocket() is called from index.js after the HTTP server starts.
const _clients = new Set();
let _wss = null;

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
 * Forward a plugin request payload to the Rust service at RUST_SERVICE_URL.
 *
 * Plugin sends SOME/IP identifiers as hex strings:
 *   { signalName, mode, someip: { serviceId, instanceId, methodId, operationId, eventGroupId } }
 *
 * Mapping to Rust schema (decimal integers):
 *   service_id  ← someip.serviceId
 *   instance_id ← someip.instanceId
 *   event_id    ← someip.operationId   (SOME/IP operation → event to subscribe to)
 *   method_id   ← someip.methodId      (explicit method, e.g. 0x0010)
 *
 * Working curl reference:
 *   {"service_id":16640,"instance_id":4096,"event_id":33808,"method_id":16,...}
 */
const forwardToRust = async (payload) => {
  logger.info(
    'PLUGIN PAYLOAD:\n%s',
    JSON.stringify(payload, null, 2)
  );

  const { serviceId, instanceId, operationId } = payload.someip || {};

  const rustPayload = {
    service_id:  parseInt(serviceId, 16),
    instance_id: parseInt(instanceId, 16),
    event_id:    parseInt(operationId, 16), // operationId (e.g. 0x8410 → 33808)
    method_id:   16,                        // fixed SOME/IP enable_event subscribe method (0x0010)
    operation: 'enable_event',
    ttl_ms: 1000,
  };

  logger.info(
    'RUST PAYLOAD:\n%s',
    JSON.stringify(rustPayload, null, 2)
  );

  // Validate — NaN means a field was missing or malformed in the plugin payload
  const nanFields = Object.entries(rustPayload)
    .filter(([k, v]) => typeof v === 'number' && isNaN(v))
    .map(([k]) => k);
  if (nanFields.length > 0) {
    logger.warn('[AAOS] NaN values in Rust payload for fields: %s — check PLUGIN PAYLOAD above', nanFields.join(', '));
  }

  try {
    const response = await axios.post(RUST_SERVICE_URL, rustPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
      httpAgent: _rustAgent,
    });
    logger.info('[AAOS] %s responded with status %d', RUST_SERVICE_URL, response.status);
    logger.info('RESPONSE DATA:\n%s', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (err) {
    console.error('AXIOS CODE:', err.code);
    console.error('AXIOS MESSAGE:', err.message);
    console.error('AXIOS STATUS:', err.response?.status);
    console.error('AXIOS DATA:', err.response?.data);
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
  _latestResponse = { payload, timestamp: new Date().toISOString() };
  logger.info('[AAOS] Response stored: %s', JSON.stringify(payload));

  // Broadcast to all connected WebSocket clients.
  const message = JSON.stringify({ event: 'aaos:response', data: _latestResponse });
  let sent = 0;
  _clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
      sent++;
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
