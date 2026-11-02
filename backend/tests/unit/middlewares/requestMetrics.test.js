// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #639: request metrics are labelled by route template, never raw URLs.

jest.mock('../../../src/services/metrics.service', () => ({ recordRequest: jest.fn() }));

const http = require('http');
const express = require('express');
const { recordRequest } = require('../../../src/services/metrics.service');
const requestMetrics = require('../../../src/middlewares/requestMetrics');
const ApiError = require('../../../src/utils/ApiError');
const { errorHandler } = require('../../../src/middlewares/error');

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

const things = express.Router();
things.get('/', (req, res) => res.json([]));
things.get('/:id', (req, res) => res.json({ id: req.params.id }));
things.get('/:id/secret', (req, res, next) => next(new ApiError(401, 'Please authenticate')));
const v2 = express.Router();
v2.use('/things', things);

const app = express();
app.use('/v2', requestMetrics);
app.use('/v2', v2);
// Mirrors the SPA fallback in app.js: matches /v2 paths but passes them on.
app.get('*', (req, res, next) => next());
app.use((req, res, next) => next(new ApiError(404, 'Not found')));
app.use(errorHandler);

// recordRequest runs on 'finish', which can land just after the client sees the end.
const lastSample = async () => {
  await new Promise((r) => {
    setImmediate(r);
  });
  return recordRequest.mock.calls[recordRequest.mock.calls.length - 1][0];
};

beforeEach(() => recordRequest.mockClear());

test('labels a nested route with its full template, not the raw id', async () => {
  await get(app, '/v2/things/abc123');
  const sample = await lastSample();
  expect(sample).toMatchObject({ method: 'GET', route: '/v2/things/:id', status: 200 });
  expect(sample.durationMs).toBeGreaterThanOrEqual(0);
});

test('uses the mount path for a router root route', async () => {
  await get(app, '/v2/things');
  expect(await lastSample()).toMatchObject({ route: '/v2/things', status: 200 });
});

test('keeps the template when the route fails and the error bubbles up', async () => {
  await get(app, '/v2/things/abc123/secret');
  expect(await lastSample()).toMatchObject({ route: '/v2/things/:id/secret', status: 401 });
});

test('labels requests that only hit the catch-all as unmatched', async () => {
  await get(app, '/v2/nope/42');
  expect(await lastSample()).toMatchObject({ route: 'unmatched', status: 404 });
});

test('does not count requests outside /v2', async () => {
  await get(app, '/static/x.js');
  await new Promise((r) => {
    setImmediate(r);
  });
  expect(recordRequest).not.toHaveBeenCalled();
});
