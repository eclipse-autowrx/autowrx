// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

jest.mock('../../../src/models', () => ({
  SiteConfig: { find: jest.fn(), deleteMany: jest.fn() },
  SiteConfigSnapshot: {},
  SiteConfigSnapshotMeta: {},
}));

const { SiteConfig } = require('../../../src/models');
const { pruneLegacySiteConfigs } = require('../../../src/services/siteConfig.service');

const mockFind = (rows) => {
  SiteConfig.find.mockReturnValue({ select: () => ({ lean: () => Promise.resolve(rows) }) });
};

describe('siteConfig.service pruneLegacySiteConfigs', () => {
  beforeEach(() => jest.resetAllMocks());

  test('does nothing without categories or keys', async () => {
    expect(await pruneLegacySiteConfigs({})).toEqual([]);
    expect(SiteConfig.find).not.toHaveBeenCalled();
  });

  test('deletes legacy rows, excluding predefined/kept keys and secrets in the query', async () => {
    mockFind([{ _id: 'a', key: 'OLD_KEY' }]);
    const removed = await pruneLegacySiteConfigs({ categories: ['auth'] });

    expect(removed).toEqual(['OLD_KEY']);
    const query = SiteConfig.find.mock.calls[0][0];
    expect(query.scope).toBe('site');
    expect(query.secret).toEqual({ $ne: true });
    expect(query.key.$nin).toEqual(expect.arrayContaining(['SITE_TITLE', 'SSO_PROVIDERS', 'EMAIL_CONFIG']));
    expect(SiteConfig.deleteMany).toHaveBeenCalledWith({ _id: { $in: ['a'] } });
  });

  test('keys filter also targets uncategorized (general) rows', async () => {
    mockFind([]);
    await pruneLegacySiteConfigs({ keys: ['SITE_TITLE'] });
    const query = SiteConfig.find.mock.calls[0][0];
    expect(query.$or[0]).toEqual({ category: { $in: ['general'] } });
    expect(SiteConfig.deleteMany).not.toHaveBeenCalled();
  });
});

describe('predefined site config parity with the admin frontend', () => {
  const fs = require('fs');
  const path = require('path');
  const predefinedSite = require('../../../src/config/predefinedSiteConfigs');
  const predefinedAuth = require('../../../src/config/predefinedAuthConfigs');

  const frontendKeys = (source, exportName) => {
    const start = source.indexOf(`export const ${exportName}`);
    const end = source.indexOf('\nexport ', start + 1);
    return [...source.slice(start, end).matchAll(/^ {4}key: '([A-Z0-9_]+)'/gm)].map((m) => m[1]);
  };

  // The frontend list decides what tabs show; the backend list decides what
  // Restore default may prune. A key missing on the backend would be deleted.
  test('every frontend predefined key exists in the backend predefined lists', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../../../frontend/src/pages/SiteConfigManagement.tsx'),
      'utf8'
    );
    const backendKeys = new Set([...predefinedSite, ...predefinedAuth].map((c) => c.key));
    const missing = [
      ...frontendKeys(source, 'PREDEFINED_SITE_CONFIGS'),
      ...frontendKeys(source, 'PREDEFINED_AUTH_CONFIGS'),
    ].filter((key) => !backendKeys.has(key));
    expect(missing).toEqual([]);
  });
});
