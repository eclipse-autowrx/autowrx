// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const httpStatus = require('http-status');
const config = require('../../../src/config/config');
const { createLimiter, ipEmailKey } = require('../../../src/middlewares/rateLimiter');
const { errorConverter, errorHandler } = require('../../../src/middlewares/error');

const buildApp = (limiter) => {
  const app = express();
  app.use(express.json());
  app.post('/target', limiter, (req, res) => res.status(req.body.ok ? httpStatus.OK : httpStatus.UNAUTHORIZED).send({}));
  app.use(errorConverter);
  app.use(errorHandler);
  return app;
};

// supertest can't load under this Jest config (ESM-only transitive dep), so
// talk to a real ephemeral server with fetch instead.
const servers = [];
const listen = (app) =>
  new Promise((resolve) => {
    const server = app.listen(0, () => {
      servers.push(server);
      const baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve((body) =>
        fetch(`${baseUrl}/target`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }),
      );
    });
  });

describe('rateLimiter', () => {
  const originalEnabled = config.rateLimit.enabled;

  beforeEach(() => {
    config.rateLimit.enabled = true;
  });

  afterAll(async () => {
    config.rateLimit.enabled = originalEnabled;
    await Promise.all(
      servers.map(
        (server) =>
          new Promise((resolve) => {
            server.close(resolve);
          }),
      ),
    );
  });

  test('returns 429 through the error handler once the limit is exceeded', async () => {
    const post = await listen(buildApp(createLimiter({ windowMs: 60000, max: 2 })));

    expect((await post({})).status).toBe(httpStatus.UNAUTHORIZED);
    expect((await post({})).status).toBe(httpStatus.UNAUTHORIZED);
    const res = await post({});

    expect(res.status).toBe(httpStatus.TOO_MANY_REQUESTS);
    expect(await res.json()).toMatchObject({
      code: httpStatus.TOO_MANY_REQUESTS,
      message: 'Too many requests, please try again later.',
    });
    expect(res.headers.get('ratelimit')).toBeTruthy();
  });

  test('does not count successful requests when skipSuccessfulRequests is set', async () => {
    const post = await listen(buildApp(createLimiter({ windowMs: 60000, max: 1, skipSuccessfulRequests: true })));

    expect((await post({ ok: true })).status).toBe(httpStatus.OK);
    expect((await post({ ok: true })).status).toBe(httpStatus.OK);
    expect((await post({})).status).toBe(httpStatus.UNAUTHORIZED);
    expect((await post({})).status).toBe(httpStatus.TOO_MANY_REQUESTS);
  });

  test('keys ip+email limits per (normalised) email', async () => {
    const post = await listen(buildApp(createLimiter({ windowMs: 60000, max: 1, keyGenerator: ipEmailKey })));

    expect((await post({ email: 'a@example.com' })).status).toBe(httpStatus.UNAUTHORIZED);
    expect((await post({ email: ' A@Example.com ' })).status).toBe(httpStatus.TOO_MANY_REQUESTS);
    expect((await post({ email: 'b@example.com' })).status).toBe(httpStatus.UNAUTHORIZED);
  });

  test('is a no-op when rate limiting is disabled', async () => {
    config.rateLimit.enabled = false;
    const post = await listen(buildApp(createLimiter({ windowMs: 60000, max: 1 })));

    expect((await post({})).status).toBe(httpStatus.UNAUTHORIZED);
    expect((await post({})).status).toBe(httpStatus.UNAUTHORIZED);
  });
});
