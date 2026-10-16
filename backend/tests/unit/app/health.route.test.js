// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #636: /v2/health/live and /v2/health/ready back the Docker healthcheck
// and the deploy gates; they must stay cheap (no admin login, no external calls).

jest.mock('../../../src/services/health.service', () => {
  const actual = jest.requireActual('../../../src/services/health.service');
  return { ...actual, runHealthCheck: jest.fn() };
});

const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const healthRoute = require('../../../src/routes/v2/system/health.route');
const { runHealthCheck } = require('../../../src/services/health.service');

const { probeRouter } = healthRoute;

const app = express();
app.use('/v2/health', probeRouter);

// supertest can't load under this Jest config (ESM-only transitive dep), so
// talk to a real ephemeral server instead.
function get(path, appUnderTest = app) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(appUnderTest);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const req = http.get({ hostname: '127.0.0.1', port, path }, (res) => {
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
  runHealthCheck.mockClear();
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
