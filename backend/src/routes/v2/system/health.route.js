// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const { runHealthCheck } = require('../../../services/health.service');

const router = express.Router();

/**
 * GET /v2/health
 * Run comprehensive system health checks.
 * Returns status of MongoDB, JWT, auth, upload, runtime server, and SSO.
 */
router.get('/', async (req, res) => {
  try {
    const report = await runHealthCheck();
    const httpStatus = report.status === 'ok' ? 200 : report.status === 'degraded' ? 200 : 503;
    res.status(httpStatus).json(report);
  } catch (err) {
    res.status(500).json({
      status: 'error',
      checkedAt: new Date().toISOString(),
      message: 'Health check crashed: ' + err.message,
    });
  }
});

module.exports = router;
