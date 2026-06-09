// SPDX-License-Identifier: MIT
//
// AAOS Bridge Controller
// ----------------------
// Handles HTTP requests for the AAOS bridge endpoints.
// Delegates all business logic to aaos.service.
//
// Full AAOS flow:
//   Plugin
//     → POST /v2/aaos/request
//     → Rust service (http://127.0.0.1:8080/config)
//     → POST /v2/aaos/response
//     → WebSocket broadcast  (ws://localhost:3201/aaos-ws)
//     → Plugin update

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { aaosService } = require('../services');

/**
 * POST /v2/aaos/request
 *
 * Accept any JSON payload from a frontend plugin, log it, forward it to the
 * Rust bridge service at http://127.0.0.1:8080/config, and return the Rust
 * service response to the caller.
 *
 * Example request body:
 *   { "action": "getVehicleSpeed", "params": {} }
 *
 * Example success response (passes through the Rust service reply):
 *   { "success": true, "data": { ... } }
 *
 * Error handling:
 *   - If the Rust service is unreachable (ECONNREFUSED / timeout) a 502 is returned.
 *   - Any non-2xx Rust response is forwarded with the same status code.
 */
const postRequest = catchAsync(async (req, res) => {
  const payload = req.body;

  let rustData;
  try {
    rustData = await aaosService.forwardToRust(payload);
  } catch (err) {
    // Surface Rust service errors as meaningful HTTP responses.
    if (err.response) {
      // Rust service replied with a non-2xx status — forward it.
      throw new ApiError(err.response.status, err.response.data?.message || 'Rust service error');
    }
    // Network-level failure (service unreachable, timeout, etc.)
    throw new ApiError(httpStatus.BAD_GATEWAY, 'AAOS Rust service is unavailable');
  }

  res.status(httpStatus.OK).json({ success: true, data: rustData });
});

/**
 * POST /v2/aaos/response
 *
 * Called by the Rust service to push the AAOS result back into the backend.
 * Stores the payload in memory and broadcasts it to all connected WebSocket
 * clients on ws://localhost:3201/aaos-ws.
 *
 * Example request body:
 *   { "vehicleSpeed": 72.5, "unit": "km/h" }
 *
 * Example response:
 *   { "success": true }
 */
const postResponse = catchAsync(async (req, res) => {
  const payload = req.body;
  aaosService.storeResponseAndBroadcast(payload);
  res.status(httpStatus.OK).json({ success: true });
});

/**
 * GET /v2/aaos/latest
 *
 * Return the most recent AAOS response stored in memory.
 * Returns { data: null } when no response has been received yet.
 *
 * Example response:
 *   { "success": true, "data": { "payload": {...}, "timestamp": "2026-06-05T10:00:00.000Z" } }
 */
const getLatest = catchAsync(async (req, res) => {
  const latest = aaosService.getLatestResponse();
  res.status(httpStatus.OK).json({ success: true, data: latest });
});

module.exports = {
  postRequest,
  postResponse,
  getLatest,
};
