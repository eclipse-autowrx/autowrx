// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

describe('adminUi config', () => {
  const KEYS = [
    'ADMIN_CLEAN_MODE',
    'VITE_ADMIN_CLEAN_MODE',
    'ADMIN_HIDDEN_SITE_CONFIG_SECTIONS',
    'VITE_ADMIN_HIDDEN_SITE_CONFIG_SECTIONS',
    'ADMIN_VISIBLE_FEATURE_CATEGORIES',
    'VITE_ADMIN_VISIBLE_FEATURE_CATEGORIES',
  ];

  const originals = {};

  beforeEach(() => {
    KEYS.forEach((key) => {
      originals[key] = process.env[key];
      delete process.env[key];
    });
    jest.resetModules();
  });

  afterEach(() => {
    KEYS.forEach((key) => {
      if (originals[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originals[key];
      }
    });
    jest.resetModules();
  });

  const load = () => {
    // eslint-disable-next-line global-require
    return require('../../../src/config/adminUi');
  };

  test('unset env shows everything (no clean mode)', () => {
    const { resolveAdminUiConfig } = load();
    expect(resolveAdminUiConfig()).toEqual({
      cleanMode: false,
      hiddenSiteConfigSections: [],
      visibleFeatureCategories: null,
    });
  });

  test('ADMIN_CLEAN_MODE=true applies default hidden sections and categories', () => {
    process.env.ADMIN_CLEAN_MODE = 'true';
    const { resolveAdminUiConfig, ADMIN_CLEAN_MODE_HIDDEN_SITE_CONFIG_SECTIONS, ADMIN_CLEAN_MODE_VISIBLE_FEATURE_CATEGORIES } =
      load();

    expect(resolveAdminUiConfig()).toEqual({
      cleanMode: true,
      hiddenSiteConfigSections: ADMIN_CLEAN_MODE_HIDDEN_SITE_CONFIG_SECTIONS,
      visibleFeatureCategories: ADMIN_CLEAN_MODE_VISIBLE_FEATURE_CATEGORIES,
    });
  });

  test('accepts VITE_ADMIN_CLEAN_MODE alias for existing UAT envs', () => {
    process.env.VITE_ADMIN_CLEAN_MODE = 'true';
    const { resolveAdminUiConfig } = load();
    expect(resolveAdminUiConfig().cleanMode).toBe(true);
    expect(resolveAdminUiConfig().hiddenSiteConfigSections).toContain('auth');
  });

  test('ADMIN_* preferred over VITE_ADMIN_* aliases', () => {
    process.env.ADMIN_CLEAN_MODE = 'false';
    process.env.VITE_ADMIN_CLEAN_MODE = 'true';
    const { resolveAdminUiConfig } = load();
    expect(resolveAdminUiConfig().cleanMode).toBe(false);
  });

  test('explicit list overrides clean mode defaults; empty list clears them', () => {
    process.env.ADMIN_CLEAN_MODE = 'true';
    process.env.ADMIN_HIDDEN_SITE_CONFIG_SECTIONS = 'auth,staging';
    process.env.ADMIN_VISIBLE_FEATURE_CATEGORIES = '';
    const { resolveAdminUiConfig } = load();

    expect(resolveAdminUiConfig()).toEqual({
      cleanMode: true,
      hiddenSiteConfigSections: ['auth', 'staging'],
      visibleFeatureCategories: [],
    });
  });
});
