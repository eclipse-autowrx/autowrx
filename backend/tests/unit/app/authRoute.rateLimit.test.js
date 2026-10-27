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

const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');
const httpStatus = require('http-status');
const config = require('../../../src/config/config');
const { RATE_LIMITS } = require('../../../src/middlewares/rateLimiter');
const { errorConverter, errorHandler } = require('../../../src/middlewares/error');
const authRoute = require('../../../src/routes/v2/user-management/auth.route');

const originalEnabled = config.rateLimit.enabled;
beforeAll(() => {
  config.rateLimit.enabled = true;
});
afterAll(() => {
  config.rateLimit.enabled = originalEnabled;
});

// Exercise the actual router and limiters. Cookies are the parsed request input
// supplied by middleware in production; cookie parsing is not under test here.
const post = (path, body = {}, headers = {}, parsedCookies = {}) =>
  new Promise((resolve, reject) => {
    const parsed = new URL(path, 'http://localhost');
    const req = httpMocks.createRequest({
      method: 'POST',
      url: parsed.pathname,
      query: Object.fromEntries(parsed.searchParams),
      body,
      headers: { 'content-type': 'application/json', ...headers },
    });
    req.ip = '127.0.0.1';
    req.app = { get: () => false };
    req.cookies = parsedCookies;
    req.authConfig = { SELF_REGISTRATION: true };
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    res.on('end', () => resolve({ status: res.statusCode }));
    authRoute.handle(req, res, (error) => {
      if (!error) return reject(new Error(`No auth route matched ${path}`));
      return errorConverter(error, req, res, (converted) => errorHandler(converted, req, res, () => {}));
    });
  });

const statuses = async (count, path, body, headers, parsedCookies) => {
  const result = [];
  for (let i = 0; i < count; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    result.push((await post(path, body, headers, parsedCookies)).status);
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
    const unrelatedCookies = await statuses(RATE_LIMITS.refresh.max + 1, '/refresh-tokens', {}, {}, { unrelated: 'value' });
    expect(unrelatedCookies.every((code) => code === httpStatus.UNAUTHORIZED)).toBe(true);

    const codes = await statuses(RATE_LIMITS.refresh.max + 1, '/refresh-tokens', {}, headers, {
      [config.jwt.cookie.name]: 'refresh-token-value',
    });
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
