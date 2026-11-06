// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const http = require('http');

const RUNTIME_NAME = 'PUBLIC-01-redirect';
const PUBLIC_HOST = 'playground.example.com';
const KIT_PORT = 30000 + Math.floor(Math.random() * 20000);
// runtimeConfig parses the mappings at load time - set them before the app is required.
process.env.RUNTIME_SERVICE_MAPPINGS = `${RUNTIME_NAME}:127.0.0.1:${KIT_PORT}`;

const request = require('supertest');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { userOne, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken } = require('../fixtures/token.fixture');

setupTestDB();

// Fake kit: like NiceGUI behind the proxy, it builds absolute http:// redirects.
const kit = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(307, { Location: `http://${PUBLIC_HOST}/runtime-preview/${RUNTIME_NAME}/` });
  } else if (req.url === '/default') {
    res.writeHead(307, { Location: `http://${req.headers.host}/default/` });
  } else if (req.url === '/external') {
    res.writeHead(302, { Location: 'https://login.example.org/auth' });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`kit:${req.url}`);
    return;
  }
  res.end();
});

beforeAll(async () => {
  await new Promise((resolve) => {
    kit.listen(KIT_PORT, '127.0.0.1', resolve);
  });
});

afterAll(async () => {
  delete process.env.RUNTIME_SERVICE_MAPPINGS;
  await new Promise((resolve) => {
    kit.close(resolve);
  });
});

describe('Runtime preview redirects', () => {
  beforeEach(async () => {
    await insertUsers([userOne]);
  });

  const get = (path) =>
    request(app).get(path).set('Host', PUBLIC_HOST).set('Authorization', `Bearer ${userOneAccessToken}`).redirects(0);

  test('rewrites an absolute http:// redirect on the public host to a relative path', async () => {
    const res = await get(`/runtime-preview/${RUNTIME_NAME}`);
    expect(res.status).toBe(307);
    expect(res.headers.location).toBe(`/runtime-preview/${RUNTIME_NAME}/`);
  });

  test('maps a redirect on the kit host back under the preview prefix', async () => {
    const res = await get(`/runtime-preview/${RUNTIME_NAME}/default`);
    expect(res.status).toBe(307);
    expect(res.headers.location).toBe(`/runtime-preview/${RUNTIME_NAME}/default/`);
  });

  test('leaves a redirect to another host untouched', async () => {
    const res = await get(`/runtime-preview/${RUNTIME_NAME}/external`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://login.example.org/auth');
  });

  test('proxies non-redirect responses unchanged', async () => {
    const res = await get(`/runtime-preview/${RUNTIME_NAME}/page`);
    expect(res.status).toBe(200);
    expect(res.text).toBe('kit:/page');
  });
});
