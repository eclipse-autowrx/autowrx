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
const httpStatus = require('http-status');
const { uploadInternalPlugin } = require('../../../src/controllers/plugin.controller');
const { pluginService } = require('../../../src/services');

// PLUGIN_DIR as resolved inside the controller (backend/static/plugin)
const PLUGIN_DIR = path.join(__dirname, '../../../static/plugin');

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
});
