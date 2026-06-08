// SPDX-License-Identifier: MIT
//
// AAOS Bridge Controller
// ----------------------
// Handles HTTP requests for the AAOS bridge endpoints.
// Delegates all business logic to aaos.service.

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { aaosService } = require('../services');

/**
 * POST /v2/aaos/request
 *
 * Accept any JSON payload from a frontend plugin, log it, and store it in memory.
 * The AAOS runtime (or another service) can later fetch it via GET /v2/aaos/latest.
 *
 * Example request body:
 *   { "action": "getVehicleSpeed", "params": {} }
 */
const postRequest = catchAsync(async (req, res) => {
  const payload = req.body;
  aaosService.storeRequest(payload);
  res.status(httpStatus.OK).json({ success: true, message: 'AAOS request stored' });
});

/**
 * POST /v2/aaos/response
 *
 * Accept any JSON payload from the AAOS runtime, log it, store it in memory,
 * and broadcast it to all connected socket.io clients via the "aaos:response" event.
 *
 * Example request body:
 *   { "vehicleSpeed": 72.5, "unit": "km/h" }
 */
const postResponse = catchAsync(async (req, res) => {
  const payload = req.body;
  aaosService.storeResponseAndBroadcast(payload);
  res.status(httpStatus.OK).json({ success: true, message: 'AAOS response stored and broadcasted' });
});

/**
 * GET /v2/aaos/latest
 *
 * Return the latest stored AAOS response.
 * Returns null for the "data" field when no response has been received yet.
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