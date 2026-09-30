// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Runtime Admin UI visibility for Site Config / Manage Features.
 *
 * Read from process.env so container / UAT env (printenv) takes effect without
 * a frontend rebuild. Prefer ADMIN_* names; accept VITE_ADMIN_* as aliases for
 * deployments that already set the old Vite build-time names.
 *
 * These flags only filter the Admin UI. They are not editable via Site Config
 * and do not change API permissions.
 */

const ADMIN_CLEAN_MODE_HIDDEN_SITE_CONFIG_SECTIONS = [
  'auth',
  'genai',
  'sso',
  'email',
  'secrets',
  'staging',
];

const ADMIN_CLEAN_MODE_VISIBLE_FEATURE_CATEGORIES = ['Unlimited model', 'Admin'];

const envFirst = (...keys) => {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(process.env, key)) {
      return process.env[key];
    }
  }
  return undefined;
};

// undefined -> null (caller may apply clean-mode defaults);
// set (including "") -> trimmed non-empty CSV entries.
const parseCsvEnv = (raw) => {
  if (raw === undefined) return null;
  return String(raw)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const isTruthyTrue = (raw) => String(raw || '').trim().toLowerCase() === 'true';

/**
 * Resolve Admin UI visibility from the current process environment.
 * @returns {{
 *   cleanMode: boolean,
 *   hiddenSiteConfigSections: string[],
 *   visibleFeatureCategories: string[] | null
 * }}
 */
const resolveAdminUiConfig = () => {
  const cleanMode = isTruthyTrue(envFirst('ADMIN_CLEAN_MODE', 'VITE_ADMIN_CLEAN_MODE'));

  const hiddenSiteConfigSections =
    parseCsvEnv(envFirst('ADMIN_HIDDEN_SITE_CONFIG_SECTIONS', 'VITE_ADMIN_HIDDEN_SITE_CONFIG_SECTIONS')) ??
    (cleanMode ? [...ADMIN_CLEAN_MODE_HIDDEN_SITE_CONFIG_SECTIONS] : []);

  const visibleFeatureCategories =
    parseCsvEnv(envFirst('ADMIN_VISIBLE_FEATURE_CATEGORIES', 'VITE_ADMIN_VISIBLE_FEATURE_CATEGORIES')) ??
    (cleanMode ? [...ADMIN_CLEAN_MODE_VISIBLE_FEATURE_CATEGORIES] : null);

  return {
    cleanMode,
    hiddenSiteConfigSections,
    visibleFeatureCategories,
  };
};

module.exports = {
  ADMIN_CLEAN_MODE_HIDDEN_SITE_CONFIG_SECTIONS,
  ADMIN_CLEAN_MODE_VISIBLE_FEATURE_CATEGORIES,
  resolveAdminUiConfig,
};
