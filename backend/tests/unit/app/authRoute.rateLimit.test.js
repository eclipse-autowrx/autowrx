// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #631: brute-forceable auth endpoints must be rate limited.

jest.mock('../../../src/middlewares/auth', () => () => (req, res, next) => next());
jest.mock(
  '../../../src/controllers/auth.controller',
  () =>
    new Proxy(
      {},
      {
        // Every handler fails like a wrong credential unless the test asks for success
        get: () => (req, res) => res.status(req.headers['x-test-ok'] ? 200 : 401).send({}),
      },
    ),
);

const express = require('express');
const cookies = require('cookie-parser');
const httpStatus = require('http-status');
const config = require('../../../src/config/config');
const { RATE_LIMITS } = require('../../../src/middlewares/rateLimiter');
const { errorConverter, errorHandler } = require('../../../src/middlewares/error');
const authRoute = require('../../../src/routes/v2/user-management/auth.route');

const app = express();
app.use(express.json());
app.use(cookies());
app.use((req, res, next) => {
  req.authConfig = { SELF_REGISTRATION: true };
  next();
});
app.use('/auth', authRoute);
app.use(errorConverter);
app.use(errorHandler);

// supertest can't load under this Jest config (ESM-only transitive dep), so
// talk to a real ephemeral server with fetch instead.
let server;
let baseUrl;
const originalEnabled = config.rateLimit.enabled;
beforeAll(
  () =>
    new Promise((resolve) => {
      config.rateLimit.enabled = true;
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    }),
);
afterAll(
  () =>
    new Promise((resolve) => {
      config.rateLimit.enabled = originalEnabled;
      server.close(resolve);
    }),
);

const post = (path, body = {}, headers = {}) =>
  fetch(`${baseUrl}/auth${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

const statuses = async (count, path, body, headers) => {
  const result = [];
  for (let i = 0; i < count; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    result.push((await post(path, body, headers)).status);
  }
  return result;
};

describe('auth route rate limits', () => {
  test('POST /login blocks after too many failed attempts for one email, not for others', async () => {
    const body = { email: 'victim@example.com', password: 'wrong' };
    const codes = await statuses(RATE_LIMITS.login.max + 1, '/login', body);

    expect(codes.slice(0, -1).every((code) => code === httpStatus.UNAUTHORIZED)).toBe(true);
    expect(codes[codes.length - 1]).toBe(httpStatus.TOO_MANY_REQUESTS);
    expect((await post('/login', { email: 'other@example.com', password: 'wrong' })).status).toBe(httpStatus.UNAUTHORIZED);
  });

  test('POST /forgot-password limits reset emails per address', async () => {
    const body = { email: 'reset@example.com' };
    const codes = await statuses(RATE_LIMITS.forgotPassword.max + 1, '/forgot-password', body, { 'x-test-ok': '1' });

    expect(codes[codes.length - 1]).toBe(httpStatus.TOO_MANY_REQUESTS);
  });

  test('POST /reset-password limits code guesses per address', async () => {
    const body = { email: 'guess@example.com', code: '000000', password: 'password1' };
    const codes = await statuses(RATE_LIMITS.resetPassword.max + 1, '/reset-password', body);

    expect(codes[codes.length - 1]).toBe(httpStatus.TOO_MANY_REQUESTS);
  });

  test('POST /refresh-tokens rate limits cookie-bearing refreshes, not cookieless probes', async () => {
    // Cookieless probes carry no token to brute-force; they must not eat the
    // failed-refresh budget of clients that do hold a refresh cookie.
    const probes = await statuses(RATE_LIMITS.refresh.max + 1, '/refresh-tokens', {});
    expect(probes.every((code) => code === httpStatus.UNAUTHORIZED)).toBe(true);

    const headers = { cookie: `${config.jwt.cookie.name}=refresh-token-value` };
    const codes = await statuses(RATE_LIMITS.refresh.max + 1, '/refresh-tokens', {}, headers);
    expect(codes[codes.length - 1]).toBe(httpStatus.TOO_MANY_REQUESTS);
  });

  test.each([
    ['/register', { name: 'n', email: 'new@example.com', password: 'password1' }, RATE_LIMITS.register.max],
    ['/verify-email', {}, RATE_LIMITS.verifyEmail.max],
  ])('POST %s is rate limited', async (path, body, max) => {
    const codes = await statuses(max + 1, path, body);

    expect(codes[codes.length - 1]).toBe(httpStatus.TOO_MANY_REQUESTS);
  });
});
