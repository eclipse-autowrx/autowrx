// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #636: /v2/health/live and /v2/health/ready back the Docker healthcheck
// and the deploy gates; they must stay cheap (no admin login, no external calls).
// Issue #634: the full GET /v2/health report is admin-only (auth + ADMIN permission).

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

jest.mock('../../../src/services/health.service', () => {
  const actual = jest.requireActual('../../../src/services/health.service');
  return { ...actual, runHealthCheck: jest.fn() };
});

const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const { permissionService } = require('../../../src/services');
const { errorHandler } = require('../../../src/middlewares/error');
const { PERMISSIONS } = require('../../../src/config/roles');
const healthRoute = require('../../../src/routes/v2/system/health.route');
const { runHealthCheck } = require('../../../src/services/health.service');

const { probeRouter } = healthRoute;

const app = express();
app.use('/v2/health', probeRouter);
app.use('/v2/health', healthRoute);
app.use(errorHandler);

// supertest can't load under this Jest config (ESM-only transitive dep), so
// talk to a real ephemeral server instead.
function get(path, appUnderTest = app, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(appUnderTest);
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
      // 4s ceiling: probes must answer fast (the Mongo-buffering bug took ~10s),
      // but stay clear of the readiness check's own 2s ping budget.
      req.setTimeout(4000, () => {
        req.destroy(new Error('probe timed out'));
      });
      req.on('error', (err) => server.close(() => reject(err)));
    });
  });
}

function mockMongoConnection({ readyState, ping }) {
  mongoose.connection.readyState = readyState;
  mongoose.connection.db = { admin: () => ({ ping }) };
}

afterEach(() => {
  runHealthCheck.mockReset();
  permissionService.hasPermission.mockReset();
  mongoose.connection.readyState = 0;
  delete mongoose.connection.db;
});

describe('GET /v2/health/live', () => {
  test('always returns 200 with status ok and no-store', async () => {
    const res = await get('/v2/health/live');
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ status: 'ok' });
    expect(res.headers['cache-control']).toBe('no-store');
  });
});

describe('GET /v2/health/ready', () => {
  test('returns 200 when MongoDB is connected and answers the ping', async () => {
    mockMongoConnection({ readyState: 1, ping: jest.fn().mockResolvedValue({ ok: 1 }) });
    const res = await get('/v2/health/ready');
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.services.mongodb.status).toBe('ok');
  });

  test('returns 503 when MongoDB is disconnected', async () => {
    mockMongoConnection({ readyState: 0, ping: jest.fn() });
    const res = await get('/v2/health/ready');
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body).status).toBe('error');
  });

  test('returns 503 when the ping rejects', async () => {
    mockMongoConnection({ readyState: 1, ping: jest.fn().mockRejectedValue(new Error('ping failed')) });
    const res = await get('/v2/health/ready');
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body).services.mongodb.message).toBe('ping failed');
  });

  test('returns 503 when the ping hangs past the 2s budget', async () => {
    mockMongoConnection({ readyState: 1, ping: jest.fn().mockImplementation(() => new Promise(() => {})) });
    const res = await get('/v2/health/ready');
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body).services.mongodb.message).toMatch(/timed out after 2000ms/);
  }, 10000);

  test('does not call runHealthCheck (no admin login, no external probes)', async () => {
    mockMongoConnection({ readyState: 1, ping: jest.fn().mockResolvedValue({ ok: 1 }) });
    await get('/v2/health/ready');
    await get('/v2/health/live');
    expect(runHealthCheck).not.toHaveBeenCalled();
  });

  test('answers fast even when a hanging middleware is mounted after probeRouter', async () => {
    const hang = jest.fn(() => {
      // never calls next() — simulates loadAuthConfigs buffering on a dead Mongo
    });
    const appWithHang = express();
    appWithHang.use('/v2/health', probeRouter);
    appWithHang.use(hang);

    const res = await get('/v2/health/ready', appWithHang);

    expect(res.statusCode).toBe(503);
    expect(hang).not.toHaveBeenCalled();
  });
});

describe('GET /v2/health (full report is admin-only)', () => {
  test('anonymous request is rejected with 401 and never runs the checks', async () => {
    const res = await get('/v2/health');
    expect(res.statusCode).toBe(401);
    expect(runHealthCheck).not.toHaveBeenCalled();
  });

  test('authenticated non-admin is rejected with 403 and never runs the checks', async () => {
    permissionService.hasPermission.mockResolvedValue(false);
    const res = await get('/v2/health', app, { 'x-test-user': 'user-1' });
    expect(res.statusCode).toBe(403);
    expect(permissionService.hasPermission).toHaveBeenCalledWith('user-1', PERMISSIONS.ADMIN, undefined, undefined);
    expect(runHealthCheck).not.toHaveBeenCalled();
  });

  test('admin gets the full report with no-store', async () => {
    permissionService.hasPermission.mockResolvedValue(true);
    runHealthCheck.mockResolvedValue({ status: 'ok', checkedAt: '2026-01-01T00:00:00.000Z', services: {} });
    const res = await get('/v2/health', app, { 'x-test-user': 'admin-1' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(JSON.parse(res.body).status).toBe('ok');
    expect(runHealthCheck).toHaveBeenCalledTimes(1);
  });

  test('/live and /ready stay public while the full report is guarded', async () => {
    mockMongoConnection({ readyState: 1, ping: jest.fn().mockResolvedValue({ ok: 1 }) });
    expect((await get('/v2/health/live')).statusCode).toBe(200);
    expect((await get('/v2/health/ready')).statusCode).toBe(200);
    expect(permissionService.hasPermission).not.toHaveBeenCalled();
  });
});
