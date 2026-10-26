// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #630: authorization decisions must not be exposed through /auth/authorize.
jest.mock('../../../src/middlewares/auth', () => {
  const auth = () => (req, res, next) => {
    if (req.headers.authorization) req.user = { id: 'authenticated-user' };
    next();
  };
  auth.sanitizeUser = (user) => user;
  return auth;
});
jest.mock('../../../src/services', () => ({
  authService: {},
  userService: {},
  tokenService: {},
  emailService: {},
  logService: {},
  permissionService: {
    hasPermission: jest.fn().mockResolvedValue(true),
    hasPermissionV2: jest.fn().mockResolvedValue(true),
  },
}));
jest.mock('../../../src/models', () => ({}));

const express = require('express');
const httpStatus = require('http-status');
const { permissionService } = require('../../../src/services');
const ApiError = require('../../../src/utils/ApiError');
const { errorConverter, errorHandler } = require('../../../src/middlewares/error');
const authRoute = require('../../../src/routes/v2/user-management/auth.route');

const app = express();
app.use(express.json());
app.use('/v2/auth', authRoute);
app.use((req, res, next) => next(new ApiError(httpStatus.NOT_FOUND, 'Not found')));
app.use(errorConverter);
app.use(errorHandler);

let server;
let baseUrl;
beforeAll(
  () =>
    new Promise((resolve, reject) => {
      server = app.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
      server.once('error', reject);
    }),
);
afterAll(
  () =>
    new Promise((resolve) => {
      server.close(resolve);
    }),
);
beforeEach(() => jest.clearAllMocks());

describe.each([
  ['anonymous', {}],
  ['with an Authorization header', { authorization: 'Bearer test-token' }],
])('POST /v2/auth/authorize (%s)', (description, headers) => {
  test.each([
    ['legacy permissions', { permissions: 'readModel:model-id', userId: 'other-user' }],
    ['Casbin query', { permissionQuery: 'other-user#read#model-id' }],
    ['user ID only', { userId: 'other-user' }],
    ['empty body', {}],
  ])('returns 404 for %s without evaluating permissions', async (payloadDescription, body) => {
    const response = await fetch(`${baseUrl}/v2/auth/authorize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(await response.json()).toMatchObject({ code: httpStatus.NOT_FOUND, message: 'Not found' });
    expect(permissionService.hasPermission).not.toHaveBeenCalled();
    expect(permissionService.hasPermissionV2).not.toHaveBeenCalled();
  });
});
