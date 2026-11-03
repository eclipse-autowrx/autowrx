// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #639: GET /v2/metrics is admin-only; JSON by default, Prometheus text
// only when METRICS_PROMETHEUS_ENABLED is on.

jest.mock('../../../src/middlewares/auth', () => () => (req, res, next) => {
  // eslint-disable-next-line global-require
  const ApiError = require('../../../src/utils/ApiError');
  const userId = req.headers['x-test-user'];
  if (!userId) return next(new ApiError(401, 'Please authenticate'));
  req.user = { id: userId };
  return next();
});
jest.mock('../../../src/services', () => ({
  permissionService: { hasPermission: jest.fn() },
}));
jest.mock('../../../src/services/health.service', () => ({
  checkRuntimeServer: jest.fn(async () => ({ status: 'ok', message: 'Reachable in 1ms' })),
}));

const http = require('http');
const express = require('express');
const config = require('../../../src/config/config');
const { permissionService } = require('../../../src/services');
const { errorHandler } = require('../../../src/middlewares/error');
const metricsRoute = require('../../../src/routes/v2/system/metrics.route');
const metrics = require('../../../src/services/metrics.service');

// supertest cannot load under this Jest config (ESM-only transitive dep), so
// talk to a real ephemeral server instead.
function get(app, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const req = http.get({ hostname: '127.0.0.1', port, path, headers }, (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => server.close(() => resolve({ statusCode: res.statusCode, headers: res.headers, body: raw })));
      });
      req.on('error', (err) => server.close(() => reject(err)));
    });
  });
}

const app = express();
app.use('/v2/metrics', metricsRoute);
app.use(errorHandler);

const ADMIN = { 'x-test-user': 'admin-1' };

beforeEach(() => {
  metrics.resetForTests();
  permissionService.hasPermission.mockReset();
  config.metrics.prometheusEnabled = false;
});

test('401 without authentication', async () => {
  const res = await get(app, '/v2/metrics');
  expect(res.statusCode).toBe(401);
});

test('403 for a non-admin', async () => {
  permissionService.hasPermission.mockResolvedValue(false);
  const res = await get(app, '/v2/metrics', { 'x-test-user': 'user-1' });
  expect(res.statusCode).toBe(403);
});

test('200 JSON snapshot for an admin, not cached', async () => {
  permissionService.hasPermission.mockResolvedValue(true);
  metrics.recordRequest({ method: 'GET', route: '/v2/model', status: 200, durationMs: 12 });
  const res = await get(app, '/v2/metrics', ADMIN);
  expect(res.statusCode).toBe(200);
  expect(res.headers['cache-control']).toBe('no-store');
  expect(res.headers['content-type']).toMatch(/application\/json/);
  const body = JSON.parse(res.body);
  expect(Object.keys(body)).toEqual(['collectedAt', 'uptimeSeconds', 'http', 'mongodb', 'runtimeServer']);
  expect(body.http.totalRequests).toBe(1);
  expect(body.runtimeServer.status).toBe('ok');
});

test('?format=prometheus is 404 while the flag is off', async () => {
  permissionService.hasPermission.mockResolvedValue(true);
  const res = await get(app, '/v2/metrics?format=prometheus', ADMIN);
  expect(res.statusCode).toBe(404);
});

test('?format=prometheus returns text exposition format when the flag is on', async () => {
  permissionService.hasPermission.mockResolvedValue(true);
  config.metrics.prometheusEnabled = true;
  const res = await get(app, '/v2/metrics?format=prometheus', ADMIN);
  expect(res.statusCode).toBe(200);
  expect(res.headers['cache-control']).toBe('no-store');
  // Express may reorder parameters; Prometheus only needs the media type and version.
  expect(res.headers['content-type']).toMatch(/^text\/plain;/);
  expect(res.headers['content-type']).toContain('version=0.0.4');
  expect(res.body).toContain('# TYPE autowrx_http_requests_total counter');
  expect(res.body).toContain('autowrx_runtime_server_up 1');
});

test('prometheus flag does not bypass the admin check', async () => {
  permissionService.hasPermission.mockResolvedValue(false);
  config.metrics.prometheusEnabled = true;
  const res = await get(app, '/v2/metrics?format=prometheus', { 'x-test-user': 'user-1' });
  expect(res.statusCode).toBe(403);
});
