// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect } from 'react'
import { configManagementService } from '../services/configManagement.service'

// Cache for site configs to avoid repeated API calls
let configCache = new Map<string, any>()
let cacheExpiry: number | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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

// Default fallback values for site configs
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

/**
 * Get a single site config value by key with fallback to default
 * @param key - The config key
 * @param scope - The scope (site, user, model, etc.)
 * @param target_id - The target ID for scoped configs
 * @param defaultValue - Default value if key not found
 * @returns Promise with the config value or default value
 */
export const getConfig = async (
  key: string,
  scope: string = 'site',
  target_id?: string,
  defaultValue: any = null,
): Promise<any> => {
  try {
    const result = await configManagementService.getPublicConfig(
      key,
      scope,
      target_id,
    )
    const value = result?.value
    return value !== null && value !== undefined
      ? value
      : defaultValue !== null
        ? defaultValue
        : DEFAULT_SITE_CONFIGS[key]
  } catch (error) {
    console.warn(`Failed to get config for key "${key}":`, error)
    return defaultValue !== null ? defaultValue : DEFAULT_SITE_CONFIGS[key]
  }
}

/**
 * Get a site config value synchronously from cache or return default
 * @param key - The config key
 * @returns The config value or default value
 */
export const getSiteConfigSync = (key: string): any => {
  const cacheKey = `public_site_`
  const cached = configCache.get(cacheKey)
  if (cached && cached[key]) {
    return cached[key]
  }
  return DEFAULT_SITE_CONFIGS[key]
}

/**
 * Get multiple site config values by keys
 * @param keys - Array of config keys
 * @param scope - The scope (site, user, model, etc.)
 * @param target_id - The target ID for scoped configs
 * @returns Promise with object containing key-value pairs
 */
export const getConfigs = async (
  keys: string[],
  scope: string = 'site',
  target_id?: string,
): Promise<Record<string, any>> => {
  try {
    const all = await configManagementService.getPublicConfigs(scope, target_id)
    const result: Record<string, any> = {}
    keys.forEach((k) => {
      if (all && Object.prototype.hasOwnProperty.call(all, k)) {
        result[k] = (all as any)[k]
      }
    })
    return result
  } catch (error) {
    console.warn('Failed to get configs:', error)
    return {}
  }
}

/**
 * Get all public site configs (cached)
 * @param scope - The scope (site, user, model, etc.)
 * @param target_id - The target ID for scoped configs
 * @param forceRefresh - Force refresh cache
 * @returns Promise with object containing all public configs
 */
export const getPublicConfigs = async (
  scope: string = 'site',
  target_id?: string,
  forceRefresh: boolean = false,
): Promise<Record<string, any>> => {
  const now = Date.now()
  const cacheKey = `public_${scope}_${target_id || 'site'}`

  // Return cached data if still valid and not forcing refresh
  if (
    !forceRefresh &&
    cacheExpiry &&
    now < cacheExpiry &&
    configCache.has(cacheKey)
  ) {
    return configCache.get(cacheKey)!
  }

  try {
    const configs = await configManagementService.getPublicConfigs(
      scope,
      target_id,
    )

    // Update cache
    configCache.set(cacheKey, configs)
    cacheExpiry = now + CACHE_DURATION

    return configs
  } catch (error) {
    console.warn('Failed to get public configs:', error)
    return configCache.get(cacheKey) || {}
  }
}

/**
 * Get a config value synchronously from cache (if available)
 * @param key - The config key
 * @param defaultValue - Default value if key not found
 * @returns The cached config value or default value
 */
export const getConfigSync = (key: string, defaultValue: any = null): any => {
  // Try common cache keys for site scope
  const siteCacheKey = `public_site_site`
  const fallbackKey = 'public'
  if (configCache.has(siteCacheKey)) {
    const publicConfigs = configCache.get(siteCacheKey)!
    return publicConfigs[key] !== undefined ? publicConfigs[key] : defaultValue
  }
  if (configCache.has(fallbackKey)) {
    const publicConfigs = configCache.get(fallbackKey)!
    return publicConfigs[key] !== undefined ? publicConfigs[key] : defaultValue
  }
  return defaultValue
}

/**
 * Get multiple config values synchronously from cache (if available)
 * @param keys - Array of config keys
 * @returns Object with key-value pairs
 */
export const getConfigsSync = (keys: string[]): Record<string, any> => {
  if (configCache.has('public')) {
    const publicConfigs = configCache.get('public')!
    const result: Record<string, any> = {}
    keys.forEach((key) => {
      if (publicConfigs[key] !== undefined) {
        result[key] = publicConfigs[key]
      }
    })
    return result
  }
  return {}
}

/**
 * Clear the config cache
 */
export const clearCache = (): void => {
  configCache.clear()
  cacheExpiry = null
}

/**
 * React hook for getting site configs
 * @param keys - Array of config keys to watch
 * @param defaultValue - Default values for the keys
 * @returns Object with config values and loading state
 */
export const useSiteConfigs = (
  keys: string[],
  defaultValue: Record<string, any> = {},
) => {
  const [configs, setConfigs] = useState<Record<string, any>>(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to get from cache first
        const cachedConfigs = getConfigsSync(keys)
        if (Object.keys(cachedConfigs).length === keys.length) {
          setConfigs(cachedConfigs)
          setLoading(false)
          return
        }

        // Fetch from API
        const fetchedConfigs = await getConfigs(keys)
        setConfigs(fetchedConfigs)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch configs')
      } finally {
        setLoading(false)
      }
    }

    fetchConfigs()
  }, [keys.join(',')])

  return { configs, loading, error }
}

/**
 * React hook for getting a single site config value
 * @param key - The config key
 * @param scope - The scope (site, user, model, etc.)
 * @param target_id - The target ID for scoped configs
 * @returns Object with value, loading state, and error
 */
export const useSiteConfig = (
  key: string,
  fallback?: any,
  scope: string = 'site',
  target_id?: string,
) => {
  const defaultVal = fallback ?? DEFAULT_SITE_CONFIGS[key]
  const [value, setValue] = useState<any>(() =>
    parseConfigValue(getConfigSync(key, defaultVal), defaultVal),
  )

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const result = await getConfig(key, scope, target_id, defaultVal)
        const next = parseConfigValue(result, defaultVal)
        setValue((prev: any) => (Object.is(prev, next) ? prev : next))
      } catch {
        setValue((prev: any) =>
          Object.is(prev, defaultVal) ? prev : defaultVal,
        )
      }
    }

    loadConfig()
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
