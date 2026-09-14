// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Regression test for the authorization fix in PR #614 (issue #719, CWE-862):
// the ownership check must run BEFORE any zip extraction, so an unauthorized
// upload to an existing slug owned by another user returns 403 without writing
// files to disk or mutating the plugin record.
//
// The plugin service is mocked so no DB is required. Because the controller
// throws at the authorization gate (before ensureDir/safeExtractZip), no real
// filesystem writes occur, so fs is left un-mocked.

jest.mock('../../../src/services', () => ({
  pluginService: {
    getPluginBySlug: jest.fn(),
    isAdminUser: jest.fn(),
    upsertPluginBySlug: jest.fn(),
    getPluginById: jest.fn(),
    queryPlugins: jest.fn(),
    queryAdminPlugins: jest.fn(),
    createPlugin: jest.fn(),
    updatePluginById: jest.fn(),
    deletePluginById: jest.fn(),
  },
}));

const path = require('path');
const fs = require('fs');
const os = require('os');
const fsp = require('fs/promises');
const { execFileSync } = require('child_process');
const httpStatus = require('http-status');
const { uploadInternalPlugin } = require('../../../src/controllers/plugin.controller');
const { pluginService } = require('../../../src/services');

// PLUGIN_DIR as resolved inside the controller (backend/static/plugin)
const PLUGIN_DIR = path.join(__dirname, '../../../static/plugin');
const BUILD_ZIP = path.join(__dirname, '../../fixtures/build_zip.py');

// Build a zip from a spec array using the python helper.
function buildZip(zipPath, entries) {
  execFileSync('python3', [BUILD_ZIP, zipPath, JSON.stringify(entries)], { stdio: 'pipe' });
  return zipPath;
}

// catchAsync does not return its inner promise, so we wait on next()/res.send()
// (whichever fires first) to know the handler has settled.
function runHandler(req) {
  let settle;
  const done = new Promise((resolve) => {
    settle = resolve;
  });
  let nextErr;
  let sent;
  const res = {
    status() {
      return res;
    },
    send(body) {
      sent = body;
      settle();
    },
  };
  const next = (err) => {
    nextErr = err;
    settle();
  };
  uploadInternalPlugin(req, res, next);
  return done.then(() => ({ nextErr, sent }));
}

describe('Plugin upload authorization (PR #614 / issue #719, CWE-862)', () => {
  const slug = 'pr614-auth-test-slug';

  beforeEach(() => {
    jest.clearAllMocks();
    pluginService.isAdminUser.mockResolvedValue(false);
  });

  afterAll(() => {
    // Defensive cleanup in case any dir was created.
    const slugDir = path.join(PLUGIN_DIR, slug);
    if (fs.existsSync(slugDir)) {
      fs.rmSync(slugDir, { recursive: true, force: true });
    }
  });

  it('returns 403 and writes nothing when the slug is owned by another user', async () => {
    pluginService.getPluginBySlug.mockResolvedValue({ created_by: 'other-user-id' });

    const { nextErr, sent } = await runHandler({
      params: { slug },
      user: { id: 'me-user-id', roles: ['user'] },
      file: { path: '/tmp/pr614-does-not-matter.zip' },
    });

    // No response was sent; the error was forwarded to next().
    expect(sent).toBeUndefined();
    expect(nextErr).toBeDefined();
    expect(nextErr.statusCode).toBe(httpStatus.FORBIDDEN);

    // Authorization was checked (getPluginBySlug called), but the plugin record
    // was NOT mutated (extraction never happened).
    expect(pluginService.getPluginBySlug).toHaveBeenCalledWith(slug);
    expect(pluginService.upsertPluginBySlug).not.toHaveBeenCalled();

    // No plugin directory should have been created on disk — the throw happens
    // before ensureDir/safeExtractZip.
    expect(fs.existsSync(path.join(PLUGIN_DIR, slug))).toBe(false);
  });

  it('returns 403 when the requester is a non-owner non-admin (roles missing admin)', async () => {
    pluginService.getPluginBySlug.mockResolvedValue({ created_by: 'other-user-id' });
    pluginService.isAdminUser.mockResolvedValue(false);

    const { nextErr } = await runHandler({
      params: { slug },
      user: { id: 'me-user-id', roles: [] },
      file: { path: '/tmp/pr614-does-not-matter.zip' },
    });

    expect(nextErr).toBeDefined();
    expect(nextErr.statusCode).toBe(httpStatus.FORBIDDEN);
    expect(pluginService.upsertPluginBySlug).not.toHaveBeenCalled();
  });

  it('removes the multer temp upload even on the 403 authorization path', async () => {
    // Regression: the temp-file cleanup must run on the 403 path (which throws
    // before the extraction try block), otherwise an authenticated user could
    // disk-exhaust by repeatedly uploading to a slug owned by someone else.
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'pr614-403-'));
    const tmpFile = path.join(tmpDir, 'upload.zip');
    await fsp.writeFile(tmpFile, 'fake-zip-bytes');
    try {
      pluginService.getPluginBySlug.mockResolvedValue({ created_by: 'other-user-id' });
      pluginService.isAdminUser.mockResolvedValue(false);

      const { nextErr } = await runHandler({
        params: { slug },
        user: { id: 'me-user-id', roles: ['user'] },
        file: { path: tmpFile },
      });

      expect(nextErr.statusCode).toBe(httpStatus.FORBIDDEN);
      // The temp upload must be removed even though auth rejected the request.
      expect(fs.existsSync(tmpFile)).toBe(false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('allows the owner through the ownership gate (no 403 at the gate)', async () => {
    pluginService.getPluginBySlug.mockResolvedValue({ created_by: 'me-user-id' });
    pluginService.isAdminUser.mockResolvedValue(false);

    const { nextErr } = await runHandler({
      params: { slug },
      user: { id: 'me-user-id', roles: ['user'] },
      // Non-existent zip: the request passes the ownership gate and then fails
      // at extraction. The failure must NOT be a 403 (it is a file/zip error).
      file: { path: '/tmp/pr614-definitely-does-not-exist.zip' },
    });

    expect(nextErr).toBeDefined();
    // The owner passed the ownership gate; the subsequent error is NOT FORBIDDEN.
    expect(nextErr.statusCode).not.toBe(httpStatus.FORBIDDEN);

    // Clean up the plugin dir the gate allowed to be created.
    const slugDir = path.join(PLUGIN_DIR, slug);
    if (fs.existsSync(slugDir)) {
      fs.rmSync(slugDir, { recursive: true, force: true });
    }
  });

  it('preserves the currently-serving plugin when a re-upload extraction fails (M1)', async () => {
    const m1Slug = 'pr614-m1-slug';
    const pluginPath = path.join(PLUGIN_DIR, m1Slug);
    // Pre-create the live plugin dir with a serving index.js.
    await fsp.mkdir(pluginPath, { recursive: true });
    await fsp.writeFile(path.join(pluginPath, 'index.js'), 'console.log("live");');
    try {
      // Existing plugin owned by the requesting user -> auth passes (re-upload).
      pluginService.getPluginBySlug.mockResolvedValue({ created_by: 'me-user-id' });
      pluginService.isAdminUser.mockResolvedValue(false);

      // Malicious zip (traversal entry) -> extraction fails.
      const badZip = path.join(os.tmpdir(), `pr614-m1-${m1Slug}.zip`);
      buildZip(badZip, [{ name: '../evil.txt', content: 'bad' }]);

      const { nextErr } = await runHandler({
        params: { slug: m1Slug },
        user: { id: 'me-user-id', roles: ['user'] },
        file: { path: badZip },
      });

      expect(nextErr).toBeDefined();
      // The live plugin must be intact (a failed re-upload must not wipe it).
      expect(fs.existsSync(path.join(pluginPath, 'index.js'))).toBe(true);
      expect(fs.readFileSync(path.join(pluginPath, 'index.js'), 'utf8')).toBe('console.log("live");');
      // The traversal entry must not have escaped into PLUGIN_DIR.
      expect(fs.existsSync(path.join(PLUGIN_DIR, 'evil.txt'))).toBe(false);
      // No leftover .old or swap-in-progress artifacts.
      expect(fs.existsSync(`${pluginPath}.old`)).toBe(false);
    } finally {
      fs.rmSync(pluginPath, { recursive: true, force: true });
      fs.rmSync(`${pluginPath}.old`, { recursive: true, force: true });
      fs.readdirSync(PLUGIN_DIR)
        .filter((n) => n.startsWith(`${m1Slug}.tmp-`))
        .forEach((n) => fs.rmSync(path.join(PLUGIN_DIR, n), { recursive: true, force: true }));
    }
  });

  it('end-to-end happy path: a valid re-upload swaps the new plugin into place and upserts', async () => {
    const happySlug = 'pr614-happy-slug';
    const pluginPath = path.join(PLUGIN_DIR, happySlug);
    // Pre-create the currently-serving (old) plugin dir being replaced.
    await fsp.mkdir(pluginPath, { recursive: true });
    await fsp.writeFile(path.join(pluginPath, 'index.js'), 'console.log("old");');
    try {
      // Existing plugin owned by the requester -> auth passes, upsert branch taken.
      pluginService.getPluginBySlug.mockResolvedValue({ created_by: 'me-user-id' });
      pluginService.isAdminUser.mockResolvedValue(false);
      pluginService.upsertPluginBySlug.mockResolvedValue({
        slug: happySlug,
        is_internal: true,
        url: 'placeholder',
      });

      const goodZip = path.join(os.tmpdir(), `pr614-happy-${happySlug}.zip`);
      buildZip(goodZip, [
        { name: 'index.js', content: 'console.log("new");' },
        { name: 'sub/style.css', content: 'body{color:red}' },
      ]);

      const { nextErr, sent } = await runHandler({
        params: { slug: happySlug },
        user: { id: 'me-user-id', roles: ['user'] },
        file: { path: goodZip },
      });

      // No error; a 200 response with the new plugin URL.
      expect(nextErr).toBeUndefined();
      expect(sent).toBeDefined();
      expect(sent.url).toBe(`/plugin/${happySlug}/index.js`);
      expect(sent.plugin).toEqual({ slug: happySlug, is_internal: true, url: 'placeholder' });

      // upsert was called with the URL derived from the extracted entry file.
      expect(pluginService.upsertPluginBySlug).toHaveBeenCalledWith(
        happySlug,
        expect.objectContaining({
          is_internal: true,
          url: `/plugin/${happySlug}/index.js`,
          updated_by: 'me-user-id',
        }),
      );

      // The atomic swap delivered the NEW plugin into pluginPath (not merged
      // with the old one).
      expect(fs.existsSync(path.join(pluginPath, 'index.js'))).toBe(true);
      expect(fs.readFileSync(path.join(pluginPath, 'index.js'), 'utf8')).toBe('console.log("new");');
      expect(fs.readFileSync(path.join(pluginPath, 'sub', 'style.css'), 'utf8')).toBe('body{color:red}');
      // The old backup was cleaned up after the swap.
      expect(fs.existsSync(`${pluginPath}.old`)).toBe(false);
    } finally {
      fs.rmSync(pluginPath, { recursive: true, force: true });
      fs.rmSync(`${pluginPath}.old`, { recursive: true, force: true });
      fs.readdirSync(PLUGIN_DIR)
        .filter((n) => n.startsWith(`${happySlug}.tmp-`))
        .forEach((n) => fs.rmSync(path.join(PLUGIN_DIR, n), { recursive: true, force: true }));
    }
  });
});
