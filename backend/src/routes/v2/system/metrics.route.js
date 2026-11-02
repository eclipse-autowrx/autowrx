// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const auth = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');
const { PERMISSIONS } = require('../../../config/roles');
const { getMetrics } = require('../../../controllers/metrics.controller');

const router = express.Router();

/**
 * GET /v2/metrics
 * Admin only: request counters/latency by route template, MongoDB pool stats and
 * runtime-server status. JSON by default; ?format=prometheus behind
 * METRICS_PROMETHEUS_ENABLED. Counters are per process and reset on restart.
 */
router.get('/', auth(), checkPermission(PERMISSIONS.ADMIN), getMetrics);

module.exports = router;
