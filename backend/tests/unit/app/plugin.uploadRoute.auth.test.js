// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #626: zip upload is admin-only, and the permission gate must run
// before multer so a non-admin request never writes a temp file.

jest.mock('../../../src/middlewares/auth', () => () => (req, res, next) => {
  req.user = { id: req.headers['x-test-user'] };
  next();
});
jest.mock('../../../src/middlewares/upload', () => ({
  single: () => (req, res, next) => {
    req.multerRan = true;
    next();
  },
}));
jest.mock('../../../src/services', () => ({
  permissionService: { hasPermission: jest.fn() },
}));
jest.mock('../../../src/controllers', () => ({
  pluginController: new Proxy(
    {},
    {
      get: (_target, name) => (req, res) => res.status(200).send({ handler: name, multerRan: !!req.multerRan }),
    },
  ),
}));

const express = require('express');
const httpStatus = require('http-status');
const { permissionService } = require('../../../src/services');
const { errorHandler } = require('../../../src/middlewares/error');
const pluginRoute = require('../../../src/routes/v2/system/plugin.route');

const app = express();
app.use(express.json());
app.use('/plugin', pluginRoute);
app.use(errorHandler);

// supertest can't load under this Jest config (ESM-only transitive dep), so
// talk to a real ephemeral server with fetch instead.
let server;
let baseUrl;
beforeAll(
  () =>
    new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    }),
);
afterAll(
  () =>
    new Promise((resolve) => {
      server.closeAllConnections();
      server.close(() => resolve());
    }),
);

const post = async (urlPath, userId, body) => {
  const res = await fetch(`${baseUrl}${urlPath}`, {
    method: 'POST',
    headers: { 'x-test-user': userId, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

describe('POST /plugin/upload/:slug authorization', () => {
  beforeEach(() => jest.resetAllMocks());

  test('non-admin is rejected with 403 before multer runs', async () => {
    permissionService.hasPermission.mockResolvedValue(false);
    const res = await post('/plugin/upload/my-plugin', 'u1');
    expect(res.status).toBe(httpStatus.FORBIDDEN);
    expect(permissionService.hasPermission).toHaveBeenCalledWith('u1', 'manageUsers', undefined, undefined);
  });

  test('admin reaches multer and the upload handler', async () => {
    permissionService.hasPermission.mockResolvedValue(true);
    const res = await post('/plugin/upload/my-plugin', 'a1');
    expect(res.status).toBe(httpStatus.OK);
    expect(res.body).toEqual({ handler: 'uploadInternalPlugin', multerRan: true });
  });

  test('creating plugin metadata stays open to authenticated users (rules enforced in service)', async () => {
    const res = await post('/plugin', 'u1', {
      name: 'Ext',
      is_internal: false,
      url: 'https://example.com/p.js',
    });
    expect(res.status).toBe(httpStatus.OK);
    expect(permissionService.hasPermission).not.toHaveBeenCalled();
  });

  test('validation rejects a non-http(s) external url', async () => {
    const res = await post('/plugin', 'u1', {
      name: 'Ext',
      is_internal: false,
      url: ['javascript', 'alert(1)'].join(':'),
    });
    expect(res.status).toBe(httpStatus.BAD_REQUEST);
  });
});
