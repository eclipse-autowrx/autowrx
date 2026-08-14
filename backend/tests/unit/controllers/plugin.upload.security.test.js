// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Regression tests for the security fixes in PR #614 (issue #719):
//   1. CWE-22  — path traversal via slug (validation rejects ../ and absolute paths)
//   2. CWE-22/59 — safeExtractZip rejects path-traversal, absolute, and symlink entries
//
// These tests exercise the PR's real production code:
//   - `uploadInternal` Joi schema (validations/plugin.validation.js)
//   - `safeExtractZip` (controllers/plugin.controller.js, exported for testing)

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const { execFileSync } = require('child_process');

const { uploadInternal } = require('../../../src/validations/plugin.validation');
const { safeExtractZip } = require('../../../src/controllers/plugin.controller');

const BUILD_ZIP = path.join(__dirname, '../../fixtures/build_zip.py');

// Build a zip from a spec array using the python helper.
function buildZip(zipPath, entries) {
  execFileSync('python3', [BUILD_ZIP, zipPath, JSON.stringify(entries)], { stdio: 'pipe' });
  return zipPath;
}

describe('Plugin upload security (PR #614 / issue #719)', () => {
  describe('CWE-22: slug validation rejects path traversal', () => {
    const schema = uploadInternal.params;

    const valid = ['my-plugin', 'plugin1', 'abc', 'valid-slug-2'];
    valid.forEach((slug) => {
      it(`accepts a valid slug: ${slug}`, () => {
        const { error, value } = schema.validate({ slug });
        expect(error).toBeUndefined();
        expect(value.slug).toBe(slug);
      });
    });

    const malicious = [
      '../../etc/passwd',
      '../foo',
      '..%2f..%2fsrc', // URL-encoded ../ (Express decodes before validation)
      '/etc/passwd', // absolute path
      'my.plugin', // dots not allowed
      'my plugin', // spaces not allowed
    ];
    malicious.forEach((slug) => {
      it(`rejects a malicious/invalid slug: ${slug}`, () => {
        const { error } = schema.validate({ slug });
        expect(error).toBeDefined();
      });
    });

    it('rejects an empty slug (required)', () => {
      const { error } = schema.validate({ slug: '' });
      expect(error).toBeDefined();
    });

    it('rejects a missing slug (required)', () => {
      const { error } = schema.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('CWE-22/CWE-59: safeExtractZip', () => {
    let tmpRoot;
    let zipCount;

    beforeAll(async () => {
      tmpRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'pr614-'));
      zipCount = 0;
    });

    afterAll(async () => {
      await fsp.rm(tmpRoot, { recursive: true, force: true });
    });

    // Unique target dir + zip path per test to avoid cross-test interference.
    async function nextDirs(name) {
      const target = path.join(tmpRoot, `${name}-target`);
      await fsp.mkdir(target, { recursive: true });
      zipCount += 1;
      const zipPath = path.join(tmpRoot, `${name}-${zipCount}.zip`);
      return { target, zipPath };
    }

    it('rejects a path-traversal entry (../evil.txt) and does not escape the target dir', async () => {
      const { target, zipPath } = await nextDirs('traversal');
      buildZip(zipPath, [{ name: '../evil.txt', content: 'pwned' }]);

      // Rejected either by yauzl's built-in path validation ("invalid relative path")
      // or by safeExtractZip's explicit containment check ("Unsafe zip entry").
      await expect(safeExtractZip(zipPath, target)).rejects.toThrow(/invalid relative path|Unsafe zip entry/);

      // Nothing should have escaped above the target directory.
      const escaped = path.join(tmpRoot, 'evil.txt');
      expect(fs.existsSync(escaped)).toBe(false);
      // Target dir should remain empty (entry rejected before writing).
      expect(fs.existsSync(path.join(target, 'evil.txt'))).toBe(false);
    });

    it('rejects a deeper path-traversal entry (../../etc/evil)', async () => {
      const { target, zipPath } = await nextDirs('deep-traversal');
      buildZip(zipPath, [{ name: '../../etc/evil.txt', content: 'pwned' }]);

      await expect(safeExtractZip(zipPath, target)).rejects.toThrow(/invalid relative path|Unsafe zip entry/);
      expect(fs.existsSync(path.join(tmpRoot, 'evil.txt'))).toBe(false);
    });

    it('rejects an absolute-path entry (/etc/passwd-evil)', async () => {
      const { target, zipPath } = await nextDirs('abs');
      buildZip(zipPath, [{ name: '/etc/passwd-evil', content: 'pwned' }]);

      // Rejected either by yauzl ("absolute path") or safeExtractZip ("Unsafe zip entry").
      await expect(safeExtractZip(zipPath, target)).rejects.toThrow(/absolute path|Unsafe zip entry/);
    });

    it('rejects a non-traversal filename that merely contains ".." (defense-in-depth)', async () => {
      // yauzl allows this valid relative path, so the PR's explicit `includes('..')`
      // check is the one that must catch it.
      const { target, zipPath } = await nextDirs('dots');
      buildZip(zipPath, [{ name: 'foo..bar.txt', content: 'x' }]);

      await expect(safeExtractZip(zipPath, target)).rejects.toThrow(/Unsafe zip entry/);
    });

    it('rejects a symlink entry and does not create a symlink on disk', async () => {
      const { target, zipPath } = await nextDirs('symlink');
      buildZip(zipPath, [{ name: 'link.txt', content: '/etc/passwd', type: 'symlink' }]);

      await expect(safeExtractZip(zipPath, target)).rejects.toThrow(/Symlink entries are not allowed/);

      const linkPath = path.join(target, 'link.txt');
      expect(fs.existsSync(linkPath)).toBe(false);
      // A symlink pointing outside must never have been created on disk.
      expect(fs.existsSync(linkPath) && fs.lstatSync(linkPath).isSymbolicLink()).toBe(false);
    });

    it('extracts a valid zip correctly (files + nested dirs, correct content)', async () => {
      const { target, zipPath } = await nextDirs('valid');
      buildZip(zipPath, [
        { name: 'index.js', content: 'console.log("hello");\n' },
        { name: 'sub/style.css', content: 'body { color: red; }\n' },
        { name: 'assets/', type: 'dir' },
      ]);

      await safeExtractZip(zipPath, target);

      const indexJs = path.join(target, 'index.js');
      const styleCss = path.join(target, 'sub/style.css');
      expect(fs.existsSync(indexJs)).toBe(true);
      expect(fs.existsSync(styleCss)).toBe(true);
      expect(fs.readFileSync(indexJs, 'utf8')).toBe('console.log("hello");\n');
      expect(fs.readFileSync(styleCss, 'utf8')).toBe('body { color: red; }\n');
      expect(fs.existsSync(path.join(target, 'assets'))).toBe(true);
    });

    it('rejects a zip that mixes a valid entry and a traversal entry', async () => {
      const { target, zipPath } = await nextDirs('mixed');
      buildZip(zipPath, [
        { name: 'index.js', content: 'ok' },
        { name: '../escape.txt', content: 'bad' },
      ]);

      await expect(safeExtractZip(zipPath, target)).rejects.toThrow();
      // The valid first entry may have been written (sequential extraction), but the
      // traversal entry must never escape the target dir.
      const escaped = path.join(tmpRoot, 'escape.txt');
      expect(fs.existsSync(escaped)).toBe(false);
    });

    it('removes partially extracted content on rejection (no disk accumulation)', async () => {
      // A valid entry is written first, then a traversal entry triggers failure.
      // safeExtractZip is transactional: on failure it must remove the whole
      // target dir so partial plugin directories don't accumulate on disk.
      const { target, zipPath } = await nextDirs('cleanup');
      buildZip(zipPath, [
        { name: 'good.txt', content: 'ok' },
        { name: 'sub/more.txt', content: 'ok' },
        { name: '../escape.txt', content: 'bad' },
      ]);

      await expect(safeExtractZip(zipPath, target)).rejects.toThrow();

      // Target dir (and the partial good.txt / sub/) must be cleaned up.
      expect(fs.existsSync(target)).toBe(false);
      expect(fs.existsSync(path.join(target, 'good.txt'))).toBe(false);
      expect(fs.existsSync(path.join(target, 'sub', 'more.txt'))).toBe(false);
      // And nothing escaped above the target.
      expect(fs.existsSync(path.join(tmpRoot, 'escape.txt'))).toBe(false);
    });

    it('keeps the target dir intact on successful extraction', async () => {
      // Sanity check: the transactional cleanup must NOT fire on success.
      const { target, zipPath } = await nextDirs('success-keeps');
      buildZip(zipPath, [{ name: 'index.js', content: 'ok' }]);

      await safeExtractZip(zipPath, target);

      expect(fs.existsSync(target)).toBe(true);
      expect(fs.existsSync(path.join(target, 'index.js'))).toBe(true);
    });

    it('ignores entries emitted after a stream-error failure (no orphan dirs)', async () => {
      // Reproduces the close-race: a file entry whose write errors mid-stream
      // (writing to a path that is already a directory -> EISDIR) triggers
      // fail(), which destroys the write stream. That stream's lingering
      // 'close' handler can call readEntry() and emit one more entry. A
      // later directory entry must be ignored (not mkdir'd) so it cannot race
      // with the cleanup rm() and leave orphan empty subdirectories behind.
      const { target, zipPath } = await nextDirs('close-race');
      buildZip(zipPath, [
        { name: 'd/', type: 'dir' }, // creates target/d as a directory
        { name: 'd', content: 'x' }, // file at target/d -> write errors (EISDIR)
        { name: 'orphan/', type: 'dir' }, // emitted after the stream error
      ]);

      await expect(safeExtractZip(zipPath, target)).rejects.toThrow();

      // With the post-failure guard, no orphan dir is created, so the whole
      // target dir is removed and nothing is left behind.
      expect(fs.existsSync(target)).toBe(false);
      expect(fs.existsSync(path.join(target, 'orphan'))).toBe(false);
    });
  });
});
