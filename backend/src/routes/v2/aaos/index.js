// SPDX-License-Identifier: MIT
//
// AAOS Bridge Routes
// ------------------
// Route definitions for the Android Automotive OS (AAOS) bridge.
//
// All endpoints are intentionally unauthenticated so that:
//   - Frontend plugins (no server-side session) can POST requests.
//   - AAOS runtime agents running on device can POST responses without OAuth flow.
//
// If your deployment requires authentication, add the auth() middleware:
//   const auth = require('../../../middlewares/auth');
//   router.post('/request', auth(), aaosController.postRequest);
//
// Registered under:
//   POST /v2/aaos/request   — store an AAOS request from a frontend plugin
//   POST /v2/aaos/response  — receive an AAOS response; broadcast to socket.io clients
//   GET  /v2/aaos/latest    — return the most recent AAOS response

const express = require('express');
const { aaosController } = require('../../../controllers');

const router = express.Router();

router.post('/request', aaosController.postRequest);
router.post('/response', aaosController.postResponse);
router.get('/latest', aaosController.getLatest);

module.exports = router;