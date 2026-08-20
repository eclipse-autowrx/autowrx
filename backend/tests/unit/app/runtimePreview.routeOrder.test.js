// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const http = require('http');
const express = require('express');
const httpStatus = require('http-status');

/**
 * Mirrors the /runtime-preview mount order in backend/src/app.js:
 * auth → name/mapping gate → proxy stub.
 * Catches F1: nameless paths must still hit auth.
 */
function runtimeNameFromReq(req) {
  const original = String(req.originalUrl || '').split('?')[0];
  const fromOriginal = original.match(/^\/runtime-preview\/([^/]+)/);
  if (fromOriginal) return fromOriginal[1];
  if (original === '/runtime-preview' || original.startsWith('/runtime-preview/')) {
    const stripped = String(req.url || '').split('?')[0];
    const match = stripped.match(/^\/([^/]+)/);
    return match ? match[1] : null;
  }
  return null;
}

function createPreviewApp({ mappings = { 'PUBLIC-01-test': 'http://runtime-09:8080' } } = {}) {
  const app = express();
  const RUNTIME_NAME_RE = /^[a-zA-Z0-9-]+$/;

  const auth = () => (req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Please authenticate' });
    }
    return next();
  };

  app.use(
    '/runtime-preview',
    auth(),
    (req, res, next) => {
      const runtimeName = runtimeNameFromReq(req);
      if (!runtimeName || !RUNTIME_NAME_RE.test(runtimeName)) {
        return res.status(400).send('invalid');
      }
      if (!Object.hasOwn(mappings, runtimeName)) {
        return res.status(502).send('unmapped');
      }
      return next();
    },
    (req, res) => {
      res.status(200).send('proxied');
    },
  );

  return app;
}

function getStatus(app, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const req = http.get({ hostname: '127.0.0.1', port, path, headers }, (res) => {
        res.resume();
        server.close(() => resolve(res.statusCode));
      });
      req.on('error', (err) => {
        server.close(() => reject(err));
      });
    });
  });
}

describe('runtime-preview route order', () => {
  test('requires auth on nameless and named paths (F1)', async () => {
    const app = createPreviewApp();
    const paths = ['/runtime-preview', '/runtime-preview/', '/runtime-preview//admin', '/runtime-preview/PUBLIC-01-test'];
    const statuses = await Promise.all(paths.map((path) => getStatus(app, path)));
    expect(statuses).toEqual([
      httpStatus.UNAUTHORIZED,
      httpStatus.UNAUTHORIZED,
      httpStatus.UNAUTHORIZED,
      httpStatus.UNAUTHORIZED,
    ]);
  });

  test('authenticated nameless path is rejected by the name gate', async () => {
    const app = createPreviewApp();
    const headers = { authorization: 'Bearer test' };
    await expect(getStatus(app, '/runtime-preview', headers)).resolves.toBe(400);
    await expect(getStatus(app, '/runtime-preview/', headers)).resolves.toBe(400);
    // Express may collapse //; either invalid name (400) or unmapped (502) — never proxied
    const doubleSlash = await getStatus(app, '/runtime-preview//admin', headers);
    expect([400, 502]).toContain(doubleSlash);
  });

  test('authenticated mapped name reaches the proxy', async () => {
    const app = createPreviewApp();
    const headers = { authorization: 'Bearer test' };
    await expect(getStatus(app, '/runtime-preview/PUBLIC-01-test', headers)).resolves.toBe(200);
  });
});
