// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const { runHealthCheck, checkReadiness } = require('../../../services/health.service');
const auth = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');
const { PERMISSIONS } = require('../../../config/roles');

const router = express.Router();

// Probes live on a separate router so app.js can mount them ahead of
// auth-config/dataSync middleware; the main router keeps the full report.
const probeRouter = express.Router();

/**
 * GET /v2/health/live
 * Liveness probe: only proves the process is serving HTTP. Always 200.
 */
probeRouter.get('/live', (req, res) => {
  res.set('Cache-Control', 'no-store').status(200).json({ status: 'ok' });
});

/**
 * GET /v2/health/ready
 * Readiness probe: 200 when MongoDB is connected and answers a ping, 503 otherwise.
 * Deliberately cheap (no admin login, no external calls) so it can back the
 * container healthcheck and the deploy gates.
 */
probeRouter.get('/ready', async (req, res) => {
  try {
    const report = await checkReadiness();
    const httpStatus = report.status === 'ok' ? 200 : 503;
    res.set('Cache-Control', 'no-store').status(httpStatus).json(report);
  } catch (err) {
    res
      .set('Cache-Control', 'no-store')
      .status(503)
      .json({
        status: 'error',
        checkedAt: new Date().toISOString(),
        message: `Readiness check crashed: ${err.message}`,
      });
  }
});

/**
 * GET /v2/health
 * Run comprehensive system health checks. Admin only (auth + ADMIN permission):
 * the report logs in as admin and exposes internal topology, so it must not be public.
 * Returns status of MongoDB, JWT, auth, upload, runtime server, and SSO.
 * Unauthenticated liveness/readiness checks use /live and /ready instead.
 */
router.get('/', auth(), checkPermission(PERMISSIONS.ADMIN), async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const report = await runHealthCheck();
    const httpStatus = report.status === 'ok' ? 200 : report.status === 'degraded' ? 200 : 503;
    res.status(httpStatus).json(report);
  } catch (err) {
    res.status(500).json({
      status: 'error',
      checkedAt: new Date().toISOString(),
      message: `Health check crashed: ${err.message}`,
    });
  }
});

module.exports = router;
module.exports.probeRouter = probeRouter;
