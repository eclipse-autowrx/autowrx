// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const fs = require('fs');
const path = require('path');

const HEAD_BYTES = 16;

const startsWith = (buf, bytes, offset = 0) => bytes.every((b, i) => buf[offset + i] === b);
const ascii = (buf, start, end) => buf.toString('latin1', start, end);

// Magic-byte checks for binary formats.
const BINARY_CHECKS = {
  '.png': (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  '.jpg': (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  '.jpeg': (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  '.gif': (b) => ascii(b, 0, 6) === 'GIF87a' || ascii(b, 0, 6) === 'GIF89a',
  '.webp': (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP',
  '.bmp': (b) => ascii(b, 0, 2) === 'BM',
  '.pdf': (b) => ascii(b, 0, 5) === '%PDF-',
  // local file header, empty archive, or spanned archive
  '.zip': (b) =>
    ascii(b, 0, 2) === 'PK' &&
    [
      [3, 4],
      [5, 6],
      [7, 8],
    ].some(([x, y]) => b[2] === x && b[3] === y),
};

const TEXT_EXTS = new Set(['.json', '.txt', '.csv', '.md']);

const isValidUtf8Text = (buf) => {
  if (buf.includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buf);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Verify that the content of a file written to disk matches its extension.
 * @param {string} filePath path of the stored file
 * @param {string} [originalName] name used to determine the extension (defaults to filePath)
 * @returns {Promise<boolean>}
 */
const verifyFileSignature = async (filePath, originalName) => {
  const ext = path.extname(originalName || filePath).toLowerCase();

  if (BINARY_CHECKS[ext]) {
    const handle = await fs.promises.open(filePath, 'r');
    try {
      const buf = Buffer.alloc(HEAD_BYTES);
      await handle.read(buf, 0, HEAD_BYTES, 0); // zero-filled, so short files simply fail the check
      return BINARY_CHECKS[ext](buf);
    } finally {
      await handle.close();
    }
  }

  if (TEXT_EXTS.has(ext)) {
    const buf = await fs.promises.readFile(filePath);
    if (!isValidUtf8Text(buf)) return false;
    if (ext === '.json') {
      try {
        JSON.parse(buf.toString('utf8').replace(/^\uFEFF/, ''));
      } catch (e) {
        return false;
      }
    }
    return true;
  }

  return false;
};

module.exports = { verifyFileSignature };
