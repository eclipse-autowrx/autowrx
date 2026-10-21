// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #638: uploads are served same-origin under /d, so they must be sent
// as inert data (nosniff + restrictive CSP, attachment for active content).

const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const uploadStaticOptions = require('../../../src/utils/uploadStatic');

let dir;
let server;
let baseUrl;
beforeAll(
  () =>
    new Promise((resolve) => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'd-test-'));
      ['a.png', 'a.html', 'a.SVG', 'a.json', 'a.pdf', 'a.txt'].forEach((f) => fs.writeFileSync(path.join(dir, f), 'x'));
      const app = express();
      app.use('/d', express.static(dir, uploadStaticOptions));
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    }),
);
afterAll(
  () =>
    new Promise((resolve) => {
      fs.rmSync(dir, { recursive: true, force: true });
      server.closeAllConnections();
      server.close(() => resolve());
    }),
);

describe('/d static headers', () => {
  ['a.png', 'a.html', 'a.SVG', 'a.json', 'a.pdf', 'a.txt'].forEach((f) => {
    test(`${f} gets nosniff and a locked-down CSP`, async () => {
      const res = await fetch(`${baseUrl}/d/${f}`);
      expect(res.status).toBe(200);
      expect(res.headers.get('x-content-type-options')).toBe('nosniff');
      expect(res.headers.get('content-security-policy')).toBe(
        "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      );
      expect(res.headers.get('cache-control')).toBe('public, max-age=31536000');
    });
  });

  ['a.html', 'a.SVG', 'a.txt'].forEach((f) => {
    test(`${f} is forced to download`, async () => {
      const res = await fetch(`${baseUrl}/d/${f}`);
      expect(res.headers.get('content-disposition')).toBe('attachment');
    });
  });

  ['a.png', 'a.json', 'a.pdf'].forEach((f) => {
    test(`${f} is served inline`, async () => {
      const res = await fetch(`${baseUrl}/d/${f}`);
      expect(res.headers.get('content-disposition')).toBeNull();
    });
  });
});
