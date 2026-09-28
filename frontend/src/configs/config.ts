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
const parseCsvEnv = (raw: string | undefined): string[] | null => {
  if (raw === undefined) return null
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

// Default "clean" admin UI, matching what a lean ETAS-style deployment shows:
// only Public/Home/Style/Model & Prototype/Privacy in Site Config, and only
// Unlimited model/Admin in Manage Features.
const ADMIN_CLEAN_MODE_HIDDEN_SITE_CONFIG_SECTIONS = [
  'auth',
  'genai',
  'sso',
  'email',
  'secrets',
  'staging',
]
const ADMIN_CLEAN_MODE_VISIBLE_FEATURE_CATEGORIES = ['Unlimited model', 'Admin']

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
  // Env-controlled visibility for the Admin pages (Site Config sidebar,
  // Manage Features categories). Set at build time so it can't be flipped
  // back on through the Admin UI itself. Unset = show everything (today's
  // behavior). VITE_ADMIN_CLEAN_MODE=true applies the defaults below for
  // whichever of the two list vars isn't explicitly set.
  adminUi: (() => {
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
      hiddenSiteConfigSections: new Set(hiddenSiteConfigSectionsList),
      // null means "no allowlist configured" -> show every category the API returns.
      visibleFeatureCategories,
    }
  })(),
}

export default config
