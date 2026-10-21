// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #638: the upload middleware must only accept an allowlist of
// extensions + matching MIME types, and must not leave rejected files on disk.

const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const httpStatus = require('http-status');
const { uploadAsset, uploadPluginZip } = require('../../../src/middlewares/upload');
const { errorConverter, errorHandler } = require('../../../src/middlewares/error');

const uploadsDir = path.join(__dirname, '../../../static/uploads');
const todayDir = () => path.join(uploadsDir, new Date().toISOString().split('T')[0]);
const listToday = () => (fs.existsSync(todayDir()) ? fs.readdirSync(todayDir()).sort() : []);

const app = express();
app.post('/asset', uploadAsset.single('file'), (req, res) => res.json({ filename: req.file.filename }));
app.post('/zip', uploadPluginZip.single('file'), (req, res) => res.json({ filename: req.file.filename }));
app.use(errorConverter);
app.use(errorHandler);

let server;
let baseUrl;
const created = [];
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
      created.forEach((f) => fs.rmSync(path.join(todayDir(), f), { force: true }));
      server.closeAllConnections();
      server.close(() => resolve());
    }),
);

const upload = async (route, name, type, content = 'x') => {
  const fd = new FormData();
  fd.append('file', new Blob([content], { type }), name);
  const res = await fetch(`${baseUrl}${route}`, { method: 'POST', body: fd });
  const body = await res.json().catch(() => null);
  if (body && body.filename) created.push(body.filename);
  return { status: res.status, body };
};

describe('uploadAsset middleware (issue #638)', () => {
  const accepted = [
    ['pic.png', 'image/png'],
    ['pic.jpg', 'image/jpeg'],
    ['pic.JPEG', 'image/jpeg'],
    ['data.json', 'application/json'],
    ['data.json', 'application/octet-stream'],
    ['doc.pdf', 'application/pdf'],
    ['notes.txt', 'text/plain'],
    ['table.csv', 'text/csv'],
    ['readme.md', 'text/markdown'],
  ];
  accepted.forEach(([name, type]) => {
    test(`accepts ${name} (${type})`, async () => {
      const res = await upload('/asset', name, type);
      expect(res.status).toBe(httpStatus.OK);
    });
  });

  test('stores the lower-cased extension', async () => {
    const res = await upload('/asset', 'PIC.PNG', 'image/png');
    expect(res.status).toBe(httpStatus.OK);
    expect(res.body.filename.endsWith('.png')).toBe(true);
  });

  const rejected = [
    ['page.html', 'text/html'],
    ['page.html', 'application/octet-stream'],
    ['image.svg', 'image/svg+xml'],
    ['image.SVG', 'image/svg+xml'],
    ['image.svg', 'image/png'],
    ['script.js', 'application/javascript'],
    ['tool.exe', 'application/octet-stream'],
    ['evil.png.html', 'image/png'],
    ['evil.png', 'text/html'],
    ['noext', 'application/octet-stream'],
    ['pic.png', 'application/octet-stream'],
    ['bundle.zip', 'application/zip'],
  ];
  rejected.forEach(([name, type]) => {
    test(`rejects ${name} (${type}) with 415 and writes nothing`, async () => {
      const before = listToday();
      const res = await upload('/asset', name, type);
      expect(res.status).toBe(httpStatus.UNSUPPORTED_MEDIA_TYPE);
      expect(res.body.message).toBe('File type not allowed');
      expect(listToday()).toEqual(before);
    });
  });
});

describe('uploadPluginZip middleware', () => {
  test('accepts a .zip', async () => {
    expect((await upload('/zip', 'plugin.zip', 'application/zip')).status).toBe(httpStatus.OK);
  });

  test('rejects non-zip files', async () => {
    const before = listToday();
    expect((await upload('/zip', 'plugin.png', 'image/png')).status).toBe(httpStatus.UNSUPPORTED_MEDIA_TYPE);
    expect((await upload('/zip', 'plugin.html', 'text/html')).status).toBe(httpStatus.UNSUPPORTED_MEDIA_TYPE);
    expect(listToday()).toEqual(before);
  });
});

describe('error handler', () => {
  test('maps multer LIMIT_FILE_SIZE to 413', () => {
    const err = new multer.MulterError('LIMIT_FILE_SIZE', 'file');
    let converted;
    errorConverter(err, {}, {}, (e) => {
      converted = e;
    });
    expect(converted.statusCode).toBe(httpStatus.REQUEST_ENTITY_TOO_LARGE);
  });
});
