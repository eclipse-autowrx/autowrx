// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import {
  AdminUiConfig,
  resolveAdminUiFromViteEnv,
} from '@/configs/config'
import { configManagementService } from '@/services/configManagement.service'

let adminUiCache: AdminUiConfig | null = null
let cacheExpiry: number | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const toAdminUiConfig = (payload: {
  cleanMode?: boolean
  hiddenSiteConfigSections?: string[]
  visibleFeatureCategories?: string[] | null
}): AdminUiConfig => ({
  cleanMode: Boolean(payload.cleanMode),
  hiddenSiteConfigSections: new Set(payload.hiddenSiteConfigSections || []),
  visibleFeatureCategories:
    payload.visibleFeatureCategories === undefined
      ? null
      : payload.visibleFeatureCategories,
})

const isSameConfig = (a: AdminUiConfig, b: AdminUiConfig): boolean =>
  a.cleanMode === b.cleanMode &&
  a.hiddenSiteConfigSections.size === b.hiddenSiteConfigSections.size &&
  [...a.hiddenSiteConfigSections].every((k) => b.hiddenSiteConfigSections.has(k)) &&
  JSON.stringify(a.visibleFeatureCategories) ===
    JSON.stringify(b.visibleFeatureCategories)

const isCacheFresh = (): boolean =>
  !!adminUiCache && !!cacheExpiry && Date.now() < cacheExpiry

const fetchAdminUiConfig = async (): Promise<AdminUiConfig> => {
  const now = Date.now()
  if (adminUiCache && cacheExpiry && now < cacheExpiry) {
    return adminUiCache
  }

  try {
    const remote = await configManagementService.getAdminUiConfig()
    const next = toAdminUiConfig(remote)
    // Keep the previous object when nothing changed so consumers don't re-render.
    if (!adminUiCache || !isSameConfig(adminUiCache, next)) adminUiCache = next
    cacheExpiry = now + CACHE_DURATION
    return adminUiCache
  } catch (error) {
    console.warn(
      'Failed to fetch admin UI config from backend, using Vite build-time fallback:',
      error,
    )
    return adminUiCache || resolveAdminUiFromViteEnv()
  }
}

/**
 * Runtime Admin UI visibility (Site Config sections / Manage Features
 * categories). Prefers backend process.env via GET /site-config/admin-ui;
 * falls back to VITE_* build-time values when the API is unreachable.
 */
export const useAdminUiConfig = () => {
  const [adminUi, setAdminUi] = useState<AdminUiConfig>(
    adminUiCache || resolveAdminUiFromViteEnv(),
  )
  const [loading, setLoading] = useState(!adminUiCache)
  const [error, setError] = useState<string | null>(null)

  const loadConfig = async () => {
    try {
      // Only show a loading state when there is nothing cached to render yet.
      if (!adminUiCache) setLoading(true)
      setError(null)
      setAdminUi(await fetchAdminUiConfig())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin UI config')
      setAdminUi(resolveAdminUiFromViteEnv())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isCacheFresh() && adminUiCache) {
      setAdminUi(adminUiCache)
      setLoading(false)
      return
    }
    loadConfig()
  }, [])

  return {
    adminUi,
    loading,
    error,
    refetch: loadConfig,
  }
}

export const getAdminUiConfigSync = (): AdminUiConfig => {
  return adminUiCache || resolveAdminUiFromViteEnv()
}

export const clearAdminUiConfigCache = (): void => {
  adminUiCache = null
  cacheExpiry = null
}

export default useAdminUiConfig
