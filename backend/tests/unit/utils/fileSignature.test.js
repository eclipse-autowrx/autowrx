// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #638: stored bytes must match the claimed type.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { verifyFileSignature } = require('../../../src/utils/fileSignature');

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

let dir;
beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sig-test-'));
});
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

const write = (name, content) => {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content);
  return p;
};

describe('verifyFileSignature', () => {
  test('accepts a real PNG', async () => {
    expect(await verifyFileSignature(write('a.png', PNG_1X1))).toBe(true);
  });

  test('rejects HTML named .png', async () => {
    expect(await verifyFileSignature(write('b.png', '<html><script>alert(1)</script></html>'))).toBe(false);
  });

  test('rejects SVG content named .jpg and a truncated file', async () => {
    expect(await verifyFileSignature(write('c.jpg', '<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe(false);
    expect(await verifyFileSignature(write('d.png', Buffer.from([0x89, 0x50])))).toBe(false);
  });

  test('accepts jpeg, gif, webp, bmp, pdf and zip magic bytes', async () => {
    expect(await verifyFileSignature(write('e.jpg', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])))).toBe(true);
    expect(await verifyFileSignature(write('e.gif', 'GIF89a......'))).toBe(true);
    expect(await verifyFileSignature(write('e.webp', 'RIFF\0\0\0\0WEBPVP8 '))).toBe(true);
    expect(await verifyFileSignature(write('e.bmp', 'BM......'))).toBe(true);
    expect(await verifyFileSignature(write('e.pdf', '%PDF-1.7\n'))).toBe(true);
    expect(await verifyFileSignature(write('e.zip', Buffer.from([0x50, 0x4b, 3, 4, 0, 0])))).toBe(true);
  });

  test('rejects HTML named .zip or .pdf', async () => {
    expect(await verifyFileSignature(write('f.zip', '<html></html>'))).toBe(false);
    expect(await verifyFileSignature(write('f.pdf', '<html></html>'))).toBe(false);
  });

  test('validates .json content', async () => {
    expect(await verifyFileSignature(write('g.json', '{"a":1}'))).toBe(true);
    expect(await verifyFileSignature(write('h.json', '{not json'))).toBe(false);
    expect(await verifyFileSignature(write('i.json', '<html></html>'))).toBe(false);
  });

  test('text types must be UTF-8 without NUL bytes', async () => {
    expect(await verifyFileSignature(write('j.txt', 'héllo'))).toBe(true);
    expect(await verifyFileSignature(write('k.txt', Buffer.from([0x68, 0x00, 0x69])))).toBe(false);
    expect(await verifyFileSignature(write('l.csv', Buffer.from([0xff, 0xfe, 0xfd])))).toBe(false);
    expect(await verifyFileSignature(write('m.md', '# title'))).toBe(true);
  });

  test('uses originalName for the extension when given and rejects unknown types', async () => {
    expect(await verifyFileSignature(write('n.tmp', PNG_1X1), 'photo.png')).toBe(true);
    expect(await verifyFileSignature(write('o.html', '<html></html>'))).toBe(false);
  });
});
