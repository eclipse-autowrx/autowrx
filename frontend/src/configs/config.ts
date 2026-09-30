// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Comma-separated env value -> trimmed, non-empty entries. Returns null when
// the env var isn't set at all, so callers can distinguish "not configured"
// from "configured as empty".
export const parseCsvEnv = (raw: string | undefined): string[] | null => {
  if (raw === undefined) return null
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

// Default "clean" admin UI, matching what a lean ETAS-style deployment shows:
// only Public/Home/Style/Model & Prototype/Privacy in Site Config, and only
// Unlimited model/Admin in Manage Features.
export const ADMIN_CLEAN_MODE_HIDDEN_SITE_CONFIG_SECTIONS = [
  'auth',
  'genai',
  'sso',
  'email',
  'secrets',
  'staging',
]

export const ADMIN_CLEAN_MODE_VISIBLE_FEATURE_CATEGORIES = [
  'Unlimited model',
  'Admin',
]

export type AdminUiConfig = {
  cleanMode: boolean
  hiddenSiteConfigSections: Set<string>
  // null means "no allowlist configured" -> show every category the API returns.
  visibleFeatureCategories: string[] | null
}

/**
 * Resolve Admin UI visibility from Vite build-time env.
 * Used as a fallback when the backend `/site-config/admin-ui` endpoint is
 * unavailable (e.g. Playwright frontend-only servers). Runtime source of
 * truth is the backend process env via that endpoint.
 */
export const resolveAdminUiFromViteEnv = (): AdminUiConfig => {
  const cleanMode =
    (import.meta.env.VITE_ADMIN_CLEAN_MODE || '').trim().toLowerCase() ===
    'true'

  const hiddenSiteConfigSectionsList =
    parseCsvEnv(import.meta.env.VITE_ADMIN_HIDDEN_SITE_CONFIG_SECTIONS) ??
    (cleanMode ? ADMIN_CLEAN_MODE_HIDDEN_SITE_CONFIG_SECTIONS : [])

  const visibleFeatureCategories =
    parseCsvEnv(import.meta.env.VITE_ADMIN_VISIBLE_FEATURE_CATEGORIES) ??
    (cleanMode ? ADMIN_CLEAN_MODE_VISIBLE_FEATURE_CATEGORIES : null)

  return {
    cleanMode,
    hiddenSiteConfigSections: new Set(hiddenSiteConfigSectionsList),
    visibleFeatureCategories,
  }
}

const config: any = {
  instance: 'autowrx',
  serverBaseUrl: (() => {
    const env = (import.meta.env.VITE_SERVER_BASE_URL || '').trim()
    if (env) return env
    return typeof window !== 'undefined' ? window.location.origin : ''
  })(),
  serverVersion: import.meta.env.VITE_SERVER_VERSION || 'v2',
  logBaseUrl: '',
  // cacheBaseUrl: '',
  showPrivacyPolicy: false,
  github: {
    clientId: '',
  },
  runtime: {
    url: 'https://kit.digitalauto.tech',
  },
  // strictAuth has been replaced by granular auth configs (PUBLIC_VIEWING, SELF_REGISTRATION, etc.)
  // See useAuthConfigs hook for the new implementation
  //
  // Build-time fallback only. Prefer runtime values from
  // GET /v2/site-config/admin-ui (backend process.env / printenv).
  adminUi: resolveAdminUiFromViteEnv(),
}

export default config
