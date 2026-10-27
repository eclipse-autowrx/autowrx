// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #633: reset/verify tokens are accepted in the request body; the query form is deprecated.

jest.mock('../../../src/middlewares/auth', () => {
  const auth = () => (req, res, next) => next();
  auth.sanitizeUser = (user) => user;
  return auth;
});
jest.mock('../../../src/services', () => ({
  authService: {
    verifyEmail: jest.fn().mockResolvedValue(),
    resetPassword: jest.fn().mockResolvedValue({ id: 'u1', email: 'u@example.com' }),
    resetPasswordWithCode: jest.fn().mockResolvedValue({ id: 'u1', email: 'u@example.com' }),
  },
  userService: {},
  tokenService: {},
  emailService: {},
  logService: { createLog: jest.fn().mockResolvedValue() },
  permissionService: {},
}));
// The real models start a cleanup interval (captureChange plugin) that keeps Jest alive.
jest.mock('../../../src/models', () => ({}));

const express = require('express');
const httpStatus = require('http-status');
const config = require('../../../src/config/config');
const { authService } = require('../../../src/services');
const { errorConverter, errorHandler } = require('../../../src/middlewares/error');
const authRoute = require('../../../src/routes/v2/user-management/auth.route');

const app = express();
app.use(express.json());
app.use('/auth', authRoute);
app.use(errorConverter);
app.use(errorHandler);

// supertest can't load under this Jest config, so use a real ephemeral server with fetch.
let server;
let baseUrl;
const originalEnabled = config.rateLimit.enabled;
beforeAll(
  () =>
    new Promise((resolve) => {
      config.rateLimit.enabled = false;
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
beforeEach(() => jest.clearAllMocks());

const post = (path, body = {}) =>
  fetch(`${baseUrl}/auth${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /auth/verify-email', () => {
  test('accepts the token in the body', async () => {
    const res = await post('/verify-email', { token: 'body-token' });
    expect(res.status).toBe(httpStatus.NO_CONTENT);
    expect(authService.verifyEmail).toHaveBeenCalledWith('body-token');
  });

  test('still accepts the deprecated query token', async () => {
    const res = await post('/verify-email?token=query-token');
    expect(res.status).toBe(httpStatus.NO_CONTENT);
    expect(authService.verifyEmail).toHaveBeenCalledWith('query-token');
  });

  test('returns 400 without a token', async () => {
    const res = await post('/verify-email');
    expect(res.status).toBe(httpStatus.BAD_REQUEST);
    expect(authService.verifyEmail).not.toHaveBeenCalled();
  });
});

describe('POST /auth/reset-password (legacy token flow)', () => {
  test('accepts the token in the body', async () => {
    const res = await post('/reset-password', { token: 'body-token', password: 'password1' });
    expect(res.status).toBe(httpStatus.NO_CONTENT);
    expect(authService.resetPassword).toHaveBeenCalledWith('body-token', 'password1');
  });

  test('still accepts the deprecated query token', async () => {
    const res = await post('/reset-password?token=query-token', { password: 'password1' });
    expect(res.status).toBe(httpStatus.NO_CONTENT);
    expect(authService.resetPassword).toHaveBeenCalledWith('query-token', 'password1');
  });

  test('returns 400 without email+code or token', async () => {
    const res = await post('/reset-password', { password: 'password1' });
    expect(res.status).toBe(httpStatus.BAD_REQUEST);
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });
});
