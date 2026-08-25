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
const {
  RUNTIME_NAME_RE,
  runtimeNameFromReq,
  rewriteRuntimePreviewPath,
  stripKitUpstreamCredentials,
} = require('../../../src/utils/runtimePreviewProxy');

/**
 * Mirrors the /runtime-preview mount order in backend/src/app.js:
 * promote access_token → auth → name/mapping gate → proxy stub.
 */
function promotePreviewAccessToken(req, _res, next) {
  if (!req.headers.authorization) {
    const token = req.query && req.query.access_token;
    if (typeof token === 'string' && token) {
      req.headers.authorization = `Bearer ${token}`;
    }
  }
  next();
}

function createPreviewApp({ mappings = { 'PUBLIC-01-test': 'http://runtime-09:8080' } } = {}) {
  const app = express();

  const auth = () => (req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: 'Please authenticate' });
    }
    return next();
  };

  app.use(
    '/runtime-preview',
    promotePreviewAccessToken,
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
  test('requires auth on nameless and named paths', async () => {
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
    const doubleSlash = await getStatus(app, '/runtime-preview//admin', headers);
    expect([400, 502]).toContain(doubleSlash);
  });

  test('authenticated mapped name reaches the proxy', async () => {
    const app = createPreviewApp();
    const headers = { authorization: 'Bearer test' };
    await expect(getStatus(app, '/runtime-preview/PUBLIC-01-test', headers)).resolves.toBe(200);
  });

  test('access_token query promotes to Bearer for iframe JWT loads', async () => {
    const app = createPreviewApp();
    await expect(getStatus(app, '/runtime-preview/PUBLIC-01-test?access_token=test-jwt')).resolves.toBe(200);
    await expect(getStatus(app, '/runtime-preview/PUBLIC-01-test')).resolves.toBe(httpStatus.UNAUTHORIZED);
  });
});

describe('runtimeNameFromReq (shipped util)', () => {
  test('resolves name from req.url when originalUrl is missing', () => {
    expect(runtimeNameFromReq({ url: '/runtime-preview/PUBLIC-01-test/ws' })).toBe('PUBLIC-01-test');
  });

  test('returns null for nameless upgrade urls', () => {
    expect(runtimeNameFromReq({ url: '/runtime-preview' })).toBeNull();
    expect(runtimeNameFromReq({ url: '/runtime-preview/' })).toBeNull();
    expect(runtimeNameFromReq({ url: '/runtime-preview//' })).toBeNull();
  });

  test('still resolves Express-stripped paths via originalUrl', () => {
    expect(
      runtimeNameFromReq({
        originalUrl: '/runtime-preview/PUBLIC-01-test/index.html',
        url: '/PUBLIC-01-test/index.html',
      }),
    ).toBe('PUBLIC-01-test');
  });
});

describe('rewriteRuntimePreviewPath (shipped util)', () => {
  test('preserves kit/socket.io query params and strips access_token', () => {
    expect(
      rewriteRuntimePreviewPath({
        originalUrl: '/runtime-preview/PUBLIC-01-test/socket.io/?EIO=4&transport=websocket&access_token=secret',
        url: '/PUBLIC-01-test/socket.io/?EIO=4&transport=websocket&access_token=secret',
      }),
    ).toBe('/socket.io/?EIO=4&transport=websocket');
  });

  test('preserves ordinary query state', () => {
    expect(
      rewriteRuntimePreviewPath({
        originalUrl: '/runtime-preview/PUBLIC-01-test/ui?tab=signals',
        url: '/PUBLIC-01-test/ui?tab=signals',
      }),
    ).toBe('/ui?tab=signals');
  });
});

describe('stripKitUpstreamCredentials (shipped util)', () => {
  test('removes Authorization and runtime_preview_at cookie', () => {
    const headers = {
      authorization: 'Bearer platform-jwt',
      cookie: 'runtime_preview_at=platform-jwt; other=1',
    };
    const proxyReq = {
      removeHeader: (name) => {
        delete headers[name.toLowerCase()];
      },
      getHeader: (name) => headers[name.toLowerCase()],
      setHeader: (name, value) => {
        headers[name.toLowerCase()] = value;
      },
    };
    stripKitUpstreamCredentials(proxyReq);
    expect(headers.authorization).toBeUndefined();
    expect(headers.cookie).toBe('other=1');
  });
});
