// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { configManagementService } from '../services/configManagement.service';

// Cache for site configs to avoid repeated API calls
let configCache = new Map<string, any>();
let cacheExpiry: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Default fallback values for site configs
const DEFAULT_SITE_CONFIGS: Record<string, any> = {
  SITE_LOGO_WIDE: '/imgs/logo-wide.png',
  SITE_TITLE: 'AutoWRX',
  SITE_DESCRIPTION: 'Vehicle Signal Specification Management Platform',
  SITE_FAVICON: '/imgs/favicon.ico',
  SITE_THEME_COLOR: '#198100',
};

/**
 * Get a single site config value by key with fallback to default
 * @param key - The config key
 * @param scope - The scope (site, user, model, etc.)
 * @param target_id - The target ID for scoped configs
 * @param defaultValue - Default value if key not found
 * @returns Promise with the config value or default value
 */
export const getConfig = async (key: string, scope: string = 'site', target_id?: string, defaultValue: any = null): Promise<any> => {
  try {
    const result = await configManagementService.getPublicConfig(key, scope, target_id);
    const value = result?.value;
    return value !== null && value !== undefined ? value : (defaultValue !== null ? defaultValue : DEFAULT_SITE_CONFIGS[key]);
  } catch (error) {
    console.warn(`Failed to get config for key "${key}":`, error);
    return defaultValue !== null ? defaultValue : DEFAULT_SITE_CONFIGS[key];
  }
};

/**
 * Get a site config value synchronously from cache or return default
 * @param key - The config key
 * @returns The config value or default value
 */
export const getSiteConfigSync = (key: string): any => {
  const cacheKey = `public_site_`;
  const cached = configCache.get(cacheKey);
  if (cached && cached[key]) {
    return cached[key];
  }
  return DEFAULT_SITE_CONFIGS[key];
};

/**
 * Get multiple site config values by keys
 * @param keys - Array of config keys
 * @param scope - The scope (site, user, model, etc.)
 * @param target_id - The target ID for scoped configs
 * @returns Promise with object containing key-value pairs
 */
export const getConfigs = async (keys: string[], scope: string = 'site', target_id?: string): Promise<Record<string, any>> => {
  try {
    const all = await configManagementService.getPublicConfigs(scope, target_id);
    const result: Record<string, any> = {};
    keys.forEach((k) => {
      if (all && Object.prototype.hasOwnProperty.call(all, k)) {
        result[k] = (all as any)[k];
      }
    });
    return result;
  } catch (error) {
    console.warn('Failed to get configs:', error);
    return {};
  }
};

/**
 * Get all public site configs (cached)
 * @param scope - The scope (site, user, model, etc.)
 * @param target_id - The target ID for scoped configs
 * @param forceRefresh - Force refresh cache
 * @returns Promise with object containing all public configs
 */
export const getPublicConfigs = async (scope: string = 'site', target_id?: string, forceRefresh: boolean = false): Promise<Record<string, any>> => {
  const now = Date.now();
  const cacheKey = `public_${scope}_${target_id || 'site'}`;
  
  // Return cached data if still valid and not forcing refresh
  if (!forceRefresh && cacheExpiry && now < cacheExpiry && configCache.has(cacheKey)) {
    return configCache.get(cacheKey)!;
  }

  try {
    const configs = await configManagementService.getPublicConfigs(scope, target_id);
    
    // Update cache
    configCache.set(cacheKey, configs);
    cacheExpiry = now + CACHE_DURATION;
    
    return configs;
  } catch (error) {
    console.warn('Failed to get public configs:', error);
    return configCache.get(cacheKey) || {};
  }
};

/**
 * Get a config value synchronously from cache (if available)
 * @param key - The config key
 * @param defaultValue - Default value if key not found
 * @returns The cached config value or default value
 */
export const getConfigSync = (key: string, defaultValue: any = null): any => {
  // Try common cache keys for site scope
  const siteCacheKey = `public_site_site`;
  const fallbackKey = 'public';
  if (configCache.has(siteCacheKey)) {
    const publicConfigs = configCache.get(siteCacheKey)!;
    return publicConfigs[key] !== undefined ? publicConfigs[key] : defaultValue;
  }
  if (configCache.has(fallbackKey)) {
    const publicConfigs = configCache.get(fallbackKey)!;
    return publicConfigs[key] !== undefined ? publicConfigs[key] : defaultValue;
  }
  return defaultValue;
};

/**
 * Get multiple config values synchronously from cache (if available)
 * @param keys - Array of config keys
 * @returns Object with key-value pairs
 */
export const getConfigsSync = (keys: string[]): Record<string, any> => {
  if (configCache.has('public')) {
    const publicConfigs = configCache.get('public')!;
    const result: Record<string, any> = {};
    keys.forEach(key => {
      if (publicConfigs[key] !== undefined) {
        result[key] = publicConfigs[key];
      }
    });
    return result;
  }
  return {};
};

/**
 * Clear the config cache
 */
export const clearCache = (): void => {
  configCache.clear();
  cacheExpiry = null;
};

/**
 * React hook for getting site configs
 * @param keys - Array of config keys to watch
 * @param defaultValue - Default values for the keys
 * @returns Object with config values and loading state
 */
export const useSiteConfigs = (keys: string[], defaultValue: Record<string, any> = {}) => {
  const [configs, setConfigs] = useState<Record<string, any>>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to get from cache first
        const cachedConfigs = getConfigsSync(keys);
        if (Object.keys(cachedConfigs).length === keys.length) {
          setConfigs(cachedConfigs);
          setLoading(false);
          return;
        }

        // Fetch from API
        const fetchedConfigs = await getConfigs(keys);
        setConfigs(fetchedConfigs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch configs');
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, [keys.join(',')]);

  return { configs, loading, error };
};

/**
 * React hook for getting a single site config value
 * @param key - The config key
 * @param scope - The scope (site, user, model, etc.)
 * @param target_id - The target ID for scoped configs
 * @returns Object with value, loading state, and error
 */
export const useSiteConfig = (key: string, fallback?: any, scope: string = 'site', target_id?: string) => {
  const [value, setValue] = useState<any>(fallback ?? DEFAULT_SITE_CONFIGS[key]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const result = await getConfig(key, scope, target_id, fallback ?? DEFAULT_SITE_CONFIGS[key]);
        // Treat null/undefined/empty string as missing -> use fallback/default
        const next = result !== null && result !== undefined && result !== '' ? result : (fallback ?? DEFAULT_SITE_CONFIGS[key]);
        setValue(next);
      } catch {
        setValue(fallback ?? DEFAULT_SITE_CONFIGS[key]);
      }
    };

    loadConfig();
  }, [key, scope, target_id, fallback]);

  return value;
};

// Import React hooks (you might need to adjust the import based on your React version)
import { useState, useEffect } from 'react';
