// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import { configManagementService } from '../services/configManagement.service'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const DEFAULT_SITE_CONFIGS: Record<string, any> = {
  SITE_LOGO_WIDE: '/imgs/logo-wide.png',
  DEFAULT_MODEL_IMAGE: '/imgs/default-model-image.png',
  DEFAULT_PROTOTYPE_IMAGE: '/imgs/default_prototype_cover.jpg',
  SITE_TITLE: 'AutoWRX',
  SITE_DESCRIPTION: 'Vehicle Signal Specification Management Platform',
  SITE_FAVICON: '/imgs/favicon.ico',
  SITE_THEME_COLOR: '#198100',
  DISABLE_CUSTOM_API_SETS: false,
  GENAI_SDV_APP_ENDPOINT:
    'https://workflow.digital.auto/webhook/c0ba14bc-c6a3-4319-ad0a-ad89b1460b36',
  VSS_PLUGINS: [{ label: 'A2L Importer', plugin: 'a2l-importer' }],
}

type CachedBulkConfigs = { data: Record<string, any>; expiry: number }

const bulkCache = new Map<string, CachedBulkConfigs>()
const inFlightBulk = new Map<string, Promise<Record<string, any>>>()

const makeBulkCacheKey = (scope: string, target_id?: string) =>
  `public_${scope}_${target_id ?? ''}`

const readCachedBulk = (
  scope: string,
  target_id?: string,
): Record<string, any> | null => {
  const cached = bulkCache.get(makeBulkCacheKey(scope, target_id))
  if (cached && Date.now() < cached.expiry) {
    return cached.data
  }
  return null
}

const resolveConfigValue = (raw: any, key: string, defaultValue: any): any => {
  if (raw !== null && raw !== undefined) {
    return raw
  }
  return defaultValue !== null ? defaultValue : DEFAULT_SITE_CONFIGS[key]
}

const pickConfigValue = (
  configs: Record<string, any> | null | undefined,
  key: string,
): any => {
  if (configs && Object.prototype.hasOwnProperty.call(configs, key)) {
    return configs[key]
  }
  return undefined
}

const parseConfigValue = (raw: any, defaultVal: any): any => {
  if (raw === null || raw === undefined || raw === '') {
    return defaultVal
  }
  if (Array.isArray(defaultVal)) {
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      } catch {
        // not valid JSON, fall through
      }
    }
    return defaultVal
  }
  if (typeof defaultVal === 'boolean') {
    if (raw === true || raw === false) {
      return raw
    }
    if (typeof raw === 'string') {
      const normalized = raw.trim().toLowerCase()
      if (normalized === 'true' || normalized === '1') return true
      if (normalized === 'false' || normalized === '0') return false
    }
    if (typeof raw === 'number') {
      return raw === 1
    }
  }
  return raw
}

/**
 * Get a single site config value by key with fallback to default.
 * Reads from the shared public-config bulk cache so many keys share one request.
 */
export const getConfig = async (
  key: string,
  scope: string = 'site',
  target_id?: string,
  defaultValue: any = null,
): Promise<any> => {
  try {
    const configs = await getPublicConfigs(scope, target_id)
    return resolveConfigValue(pickConfigValue(configs, key), key, defaultValue)
  } catch (error) {
    console.warn(`Failed to get config for key "${key}":`, error)
    return defaultValue !== null ? defaultValue : DEFAULT_SITE_CONFIGS[key]
  }
}

/**
 * Get a site config value synchronously from cache or return default
 */
export const getSiteConfigSync = (key: string): any => {
  const cached = readCachedBulk('site')
  if (cached && Object.prototype.hasOwnProperty.call(cached, key)) {
    const raw = cached[key]
    if (raw !== undefined && raw !== null) {
      return raw
    }
  }
  return DEFAULT_SITE_CONFIGS[key]
}

/**
 * Get multiple site config values by keys
 */
export const getConfigs = async (
  keys: string[],
  scope: string = 'site',
  target_id?: string,
): Promise<Record<string, any>> => {
  try {
    const all = await getPublicConfigs(scope, target_id)
    const result: Record<string, any> = {}
    keys.forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(all, k)) {
        result[k] = all[k]
      }
    })
    return result
  } catch (error) {
    console.warn('Failed to get configs:', error)
    return {}
  }
}

/**
 * Get all public site configs (cached, in-flight deduped)
 */
export const getPublicConfigs = async (
  scope: string = 'site',
  target_id?: string,
  forceRefresh: boolean = false,
): Promise<Record<string, any>> => {
  const cacheKey = makeBulkCacheKey(scope, target_id)

  if (!forceRefresh) {
    const cached = readCachedBulk(scope, target_id)
    if (cached) {
      return cached
    }

    const inFlight = inFlightBulk.get(cacheKey)
    if (inFlight) {
      return inFlight
    }
  }

  const request = (async () => {
    try {
      const configs =
        (await configManagementService.getPublicConfigs(scope, target_id)) || {}
      bulkCache.set(cacheKey, {
        data: configs,
        expiry: Date.now() + CACHE_DURATION,
      })
      return configs
    } catch (error) {
      console.warn('Failed to get public configs:', error)
      return bulkCache.get(cacheKey)?.data || {}
    }
  })()

  inFlightBulk.set(cacheKey, request)
  try {
    return await request
  } finally {
    inFlightBulk.delete(cacheKey)
  }
}

/**
 * Get a config value synchronously from cache (if available)
 */
export const getConfigSync = (
  key: string,
  defaultValue: any = null,
  scope: string = 'site',
  target_id?: string,
): any => {
  const cached = readCachedBulk(scope, target_id)
  if (!cached) {
    return defaultValue
  }
  const raw = pickConfigValue(cached, key)
  return raw !== undefined && raw !== null ? raw : defaultValue
}

/**
 * Get multiple config values synchronously from cache (if available)
 */
export const getConfigsSync = (keys: string[]): Record<string, any> => {
  const publicConfigs = readCachedBulk('site')
  if (!publicConfigs) {
    return {}
  }
  const result: Record<string, any> = {}
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(publicConfigs, key)) {
      result[key] = publicConfigs[key]
    }
  })
  return result
}

/**
 * Clear the config cache
 */
export const clearCache = (): void => {
  bulkCache.clear()
  inFlightBulk.clear()
}

/**
 * React hook for getting site configs
 */
export const useSiteConfigs = (
  keys: string[],
  defaultValue: Record<string, any> = {},
) => {
  const [configs, setConfigs] = useState<Record<string, any>>(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchConfigs = async () => {
      try {
        setLoading(true)
        setError(null)

        const cachedConfigs = getConfigsSync(keys)
        if (Object.keys(cachedConfigs).length === keys.length) {
          if (!cancelled) {
            setConfigs(cachedConfigs)
            setLoading(false)
          }
          return
        }

        const fetchedConfigs = await getConfigs(keys)
        if (!cancelled) {
          setConfigs(fetchedConfigs)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch configs',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchConfigs()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join(',')])

  return { configs, loading, error }
}

/**
 * React hook for getting a single site config value.
 * All keys in the same scope share one `/site-config/public` request.
 */
export const useSiteConfig = (
  key: string,
  fallback?: any,
  scope: string = 'site',
  target_id?: string,
) => {
  const defaultVal = fallback ?? DEFAULT_SITE_CONFIGS[key]
  const [value, setValue] = useState<any>(() =>
    parseConfigValue(
      getConfigSync(key, defaultVal, scope, target_id),
      defaultVal,
    ),
  )

  useEffect(() => {
    let cancelled = false

    const applyValue = (raw: any) => {
      const next = parseConfigValue(
        resolveConfigValue(raw, key, defaultVal),
        defaultVal,
      )
      setValue((prev: any) => (Object.is(prev, next) ? prev : next))
    }

    const cached = readCachedBulk(scope, target_id)
    if (cached) {
      applyValue(pickConfigValue(cached, key))
      return
    }

    getConfig(key, scope, target_id, defaultVal)
      .then((result) => {
        if (!cancelled) {
          const next = parseConfigValue(result, defaultVal)
          setValue((prev: any) => (Object.is(prev, next) ? prev : next))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setValue((prev: any) =>
            Object.is(prev, defaultVal) ? prev : defaultVal,
          )
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, scope, target_id])

  return value
}

export const useDefaultModelImage = () =>
  useSiteConfig('DEFAULT_MODEL_IMAGE', DEFAULT_SITE_CONFIGS.DEFAULT_MODEL_IMAGE)

export const useDefaultPrototypeImage = () =>
  useSiteConfig(
    'DEFAULT_PROTOTYPE_IMAGE',
    DEFAULT_SITE_CONFIGS.DEFAULT_PROTOTYPE_IMAGE,
  )
