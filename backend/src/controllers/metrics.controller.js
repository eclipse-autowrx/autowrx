// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const config = require('../config/config');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { getSnapshot, toPrometheus } = require('../services/metrics.service');

/**
 * GET /v2/metrics — JSON by default; ?format=prometheus only when
 * METRICS_PROMETHEUS_ENABLED=true.
 */
const getMetrics = catchAsync(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (req.query.format === 'prometheus') {
    if (!config.metrics.prometheusEnabled) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Prometheus format is disabled');
    }
    const snapshot = await getSnapshot();
    res.type('text/plain; version=0.0.4; charset=utf-8').send(toPrometheus(snapshot));
    return;
  }
  res.json(await getSnapshot());
});

module.exports = { getMetrics };
