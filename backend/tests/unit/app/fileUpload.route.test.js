// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #638: route-level checks — POST /file/upload/store-be accepts images
// but not SVG/HTML (even disguised), and the plugin upload accepts zip only.

jest.mock('../../../src/middlewares/auth', () => () => (req, res, next) => {
  req.user = { id: 'u1' };
  next();
});
jest.mock('../../../src/middlewares/permission', () => ({
  checkPermission: () => (req, res, next) => next(),
}));
jest.mock('../../../src/controllers', () => ({
  fileController: jest.requireActual('../../../src/controllers/file.controller'),
  pluginController: new Proxy(
    {},
    {
      get: (_target, name) => (req, res) => res.status(200).send({ handler: name, file: req.file && req.file.originalname }),
    },
  ),
}));

// Loading the real route graph pulls in models whose module-level setInterval
// would keep Jest alive; unref timers created while the routes are required.
const realSetInterval = global.setInterval;
jest.spyOn(global, 'setInterval').mockImplementation((...args) => {
  const timer = realSetInterval(...args);
  if (timer && timer.unref) timer.unref();
  return timer;
});

const fs = require('fs');
const path = require('path');
const express = require('express');
const httpStatus = require('http-status');
const { errorConverter, errorHandler } = require('../../../src/middlewares/error');
const fileRoute = require('../../../src/routes/v2/system/file.route');
const pluginRoute = require('../../../src/routes/v2/system/plugin.route');

const uploadsDir = path.join(__dirname, '../../../static/uploads');
const todayDir = () => path.join(uploadsDir, new Date().toISOString().split('T')[0]);
const listToday = () => (fs.existsSync(todayDir()) ? fs.readdirSync(todayDir()).sort() : []);

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const app = express();
app.use(express.json());
app.use('/file', fileRoute);
app.use('/plugin', pluginRoute);
app.use(errorConverter);
app.use(errorHandler);

let server;
let baseUrl;
const createdUrls = [];
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
      createdUrls.forEach((u) => fs.rmSync(path.join(uploadsDir, u.replace(/^\/d\//, '')), { force: true }));
      server.closeAllConnections();
      server.close(() => resolve());
    }),
);

const upload = async (route, name, type, content) => {
  const fd = new FormData();
  fd.append('file', new Blob([content], { type }), name);
  const res = await fetch(`${baseUrl}${route}`, { method: 'POST', body: fd });
  const body = await res.json().catch(() => null);
  if (body && body.url && body.url.startsWith('/d/')) createdUrls.push(body.url);
  return { status: res.status, body };
};

describe('POST /file/upload/store-be', () => {
  test('accepts a real PNG and returns its /d url', async () => {
    const res = await upload('/file/upload/store-be', 'a.png', 'image/png', PNG_1X1);
    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.url).toMatch(/^\/d\/\d{4}-\d{2}-\d{2}\/file-\d+-\d+\.png$/);
  });

  test('accepts valid json', async () => {
    const res = await upload('/file/upload/store-be', 'vss.json', 'application/json', '{"Vehicle":{}}');
    expect(res.status).toBe(httpStatus.OK);
  });

  test('rejects svg with 415', async () => {
    const before = listToday();
    const res = await upload('/file/upload/store-be', 'x.svg', 'image/svg+xml', '<svg onload="alert(1)"/>');
    expect(res.status).toBe(httpStatus.UNSUPPORTED_MEDIA_TYPE);
    expect(listToday()).toEqual(before);
  });

  test('HTML content disguised as .png is rejected with 415 and deleted', async () => {
    const before = listToday();
    const res = await upload('/file/upload/store-be', 'evil.png', 'image/png', '<html><script>alert(1)</script></html>');
    expect(res.status).toBe(httpStatus.UNSUPPORTED_MEDIA_TYPE);
    expect(listToday()).toEqual(before);
  });

  test('invalid JSON in a .json file is rejected with 415 and deleted', async () => {
    const before = listToday();
    const res = await upload('/file/upload/store-be', 'bad.json', 'application/json', '<html>');
    expect(res.status).toBe(httpStatus.UNSUPPORTED_MEDIA_TYPE);
    expect(listToday()).toEqual(before);
  });
});

describe('POST /plugin/upload/:slug', () => {
  const zipBytes = Buffer.from([0x50, 0x4b, 3, 4, 0, 0, 0, 0]);

  test('accepts a .zip', async () => {
    const res = await upload('/plugin/upload/my-plugin', 'p.zip', 'application/zip', zipBytes);
    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.handler).toBe('uploadInternalPlugin');
    // the (mocked) handler does not clean up the multer temp file
    fs.readdirSync(todayDir())
      .filter((f) => f.endsWith('.zip'))
      .forEach((f) => fs.rmSync(path.join(todayDir(), f), { force: true }));
  });

  test('rejects non-zip with 415', async () => {
    const before = listToday();
    expect((await upload('/plugin/upload/my-plugin', 'p.png', 'image/png', PNG_1X1)).status).toBe(
      httpStatus.UNSUPPORTED_MEDIA_TYPE,
    );
    expect((await upload('/plugin/upload/my-plugin', 'p.html', 'text/html', '<html>')).status).toBe(
      httpStatus.UNSUPPORTED_MEDIA_TYPE,
    );
    expect(listToday()).toEqual(before);
  });
});
