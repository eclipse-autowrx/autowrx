// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #626: non-admins may only register external http(s) plugins; internal
// (zip-uploaded, same-origin) plugins are admin-only. `is_trusted` is computed
// from the creator's current admin role and drives frontend sandboxing.

jest.mock('../../../src/models', () => ({
  Plugin: { create: jest.fn(), exists: jest.fn(), findById: jest.fn() },
  Role: { findOne: jest.fn() },
  UserRole: { find: jest.fn(), exists: jest.fn() },
}));

const httpStatus = require('http-status');
const { Plugin, Role, UserRole } = require('../../../src/models');
const pluginService = require('../../../src/services/plugin.service');

const scriptUrl = ['javascript', 'alert(1)'].join(':'); // built at runtime to satisfy no-script-url

const user = { id: 'u1', isAdmin: false };
const admin = { id: 'a1', isAdmin: true };

const adminsAre = (...ids) => {
  Role.findOne.mockReturnValue({ select: () => Promise.resolve({ id: 'role-admin' }) });
  UserRole.find.mockReturnValue({ distinct: () => Promise.resolve(ids) });
};

const statusOf = async (promise) => {
  try {
    await promise;
    return 'ok';
  } catch (err) {
    return err.statusCode;
  }
};

describe('plugin write authorization', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Plugin.exists.mockResolvedValue(null);
    Plugin.create.mockImplementation(async (doc) => doc);
  });

  test('non-admin can create an external https plugin', async () => {
    const body = { name: 'Ext', is_internal: false, url: 'https://example.com/p.js', created_by: 'u1' };
    expect(await statusOf(pluginService.createPlugin(body, user))).toBe('ok');
    expect(Plugin.create).toHaveBeenCalled();
  });

  test.each([
    ['internal plugin', { is_internal: true, url: '/plugin/x/index.js' }, httpStatus.FORBIDDEN],
    ['relative url', { is_internal: false, url: '/d/2026/evil.js' }, httpStatus.BAD_REQUEST],
    ['script-scheme url', { is_internal: false, url: scriptUrl }, httpStatus.BAD_REQUEST],
    ['data: url', { is_internal: false, url: 'data:text/javascript,alert(1)' }, httpStatus.BAD_REQUEST],
  ])('non-admin cannot create %s', async (_label, extra, status) => {
    expect(await statusOf(pluginService.createPlugin({ name: 'X', ...extra }, user))).toBe(status);
    expect(Plugin.create).not.toHaveBeenCalled();
  });

  test('admin can create an internal plugin with a relative url', async () => {
    const body = { name: 'Int', is_internal: true, url: '/plugin/int/index.js' };
    expect(await statusOf(pluginService.createPlugin(body, admin))).toBe('ok');
  });

  const existing = (fields) => {
    const doc = { created_by: 'u1', save: jest.fn(), ...fields };
    Plugin.findById.mockResolvedValue(doc);
    return doc;
  };

  test('non-admin owner cannot switch an external plugin to internal', async () => {
    existing({ is_internal: false, url: 'https://example.com/p.js' });
    expect(await statusOf(pluginService.updatePluginById('p1', { is_internal: true }, user))).toBe(httpStatus.FORBIDDEN);
  });

  test('non-admin owner cannot point a plugin at a same-origin path', async () => {
    const doc = existing({ is_internal: false, url: 'https://example.com/p.js' });
    expect(await statusOf(pluginService.updatePluginById('p1', { url: '/plugin/other/index.js' }, user))).toBe(
      httpStatus.BAD_REQUEST,
    );
    expect(doc.save).not.toHaveBeenCalled();
  });

  test('non-admin owner of a legacy internal plugin can still edit its metadata', async () => {
    const doc = existing({ is_internal: true, url: '/plugin/legacy/index.js' });
    const body = { name: 'Renamed', is_internal: true, url: '/plugin/legacy/index.js' };
    expect(await statusOf(pluginService.updatePluginById('p1', body, user))).toBe('ok');
    expect(doc.save).toHaveBeenCalled();
  });

  test('admin can update any field', async () => {
    existing({ is_internal: false, url: 'https://example.com/p.js' });
    const body = { is_internal: true, url: '/plugin/x/index.js' };
    expect(await statusOf(pluginService.updatePluginById('p1', body, admin))).toBe('ok');
  });
});

describe('withTrust', () => {
  beforeEach(() => jest.resetAllMocks());

  test('marks plugins trusted only when the creator currently holds the admin role', async () => {
    adminsAre('a1');
    const result = await pluginService.withTrust([
      { id: 'p1', created_by: 'a1' },
      { id: 'p2', created_by: 'u1' },
    ]);
    expect(result.map((p) => p.is_trusted)).toEqual([true, false]);
  });

  test('a demoted admin loses trust immediately', async () => {
    adminsAre();
    const result = await pluginService.withTrust({ id: 'p1', created_by: 'a1' });
    expect(result.is_trusted).toBe(false);
  });

  test('no admin role configured means nothing is trusted', async () => {
    Role.findOne.mockReturnValue({ select: () => Promise.resolve(null) });
    const result = await pluginService.withTrust({ id: 'p1', created_by: 'a1' });
    expect(result.is_trusted).toBe(false);
  });

  test('uses document toJSON when available', async () => {
    adminsAre('a1');
    const doc = { created_by: 'a1', toJSON: () => ({ id: 'p1', name: 'n' }) };
    expect(await pluginService.withTrust(doc)).toEqual({ id: 'p1', name: 'n', is_trusted: true });
  });
});
