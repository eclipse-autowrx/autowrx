// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { siteConfigService } = require('../services');

// Cache for site configs to avoid repeated database calls
let configCache = new Map();
let cacheExpiry = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get a single site config value by key
 * @param {string} key - The config key
 * @param {*} defaultValue - Default value if key not found
 * @returns {Promise<*>} - The config value or default value
 */
const getConfig = async (key, defaultValue = null) => {
  try {
    const value = await siteConfigService.getSiteConfigValue(key);
    return value !== null ? value : defaultValue;
  } catch (error) {
    console.warn(`Failed to get site config for key "${key}":`, error.message);
    return defaultValue;
  }
};

/**
 * Get multiple site config values by keys
 * @param {string[]} keys - Array of config keys
 * @returns {Promise<Object>} - Object with key-value pairs
 */
const getConfigs = async (keys) => {
  try {
    return await siteConfigService.getSiteConfigValues(keys);
  } catch (error) {
    console.warn('Failed to get site configs:', error.message);
    return {};
  }
};

/**
 * Get all public site configs (cached)
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Object>} - Object with all public configs
 */
const getPublicConfigs = async (forceRefresh = false) => {
  const now = Date.now();
  
  // Return cached data if still valid and not forcing refresh
  if (!forceRefresh && cacheExpiry && now < cacheExpiry && configCache.has('public')) {
    return configCache.get('public');
  }

  try {
    const configs = await siteConfigService.getPublicSiteConfigs();
    
    // Update cache
    configCache.set('public', configs);
    cacheExpiry = now + CACHE_DURATION;
    
    return configs;
  } catch (error) {
    console.warn('Failed to get public site configs:', error.message);
    return configCache.get('public') || {};
  }
};

/**
 * Get all site configs including secret ones (admin only, cached)
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Object>} - Object with all configs
 */
const getAllConfigs = async (forceRefresh = false) => {
  const now = Date.now();
  
  // Return cached data if still valid and not forcing refresh
  if (!forceRefresh && cacheExpiry && now < cacheExpiry && configCache.has('all')) {
    return configCache.get('all');
  }

  try {
    const configs = await siteConfigService.getAllSiteConfigs();
    
    // Update cache
    configCache.set('all', configs);
    cacheExpiry = now + CACHE_DURATION;
    
    return configs;
  } catch (error) {
    console.warn('Failed to get all site configs:', error.message);
    return configCache.get('all') || {};
  }
};

/**
 * Clear the config cache
 */
const clearCache = () => {
  configCache.clear();
  cacheExpiry = null;
};

/**
 * Get a config value synchronously from cache (if available)
 * @param {string} key - The config key
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} - The cached config value or default value
 */
const getConfigSync = (key, defaultValue = null) => {
  if (configCache.has('public')) {
    const publicConfigs = configCache.get('public');
    return publicConfigs[key] !== undefined ? publicConfigs[key] : defaultValue;
  }
  return defaultValue;
};

/**
 * Get multiple config values synchronously from cache (if available)
 * @param {string[]} keys - Array of config keys
 * @returns {Object} - Object with key-value pairs
 */
const getConfigsSync = (keys) => {
  if (configCache.has('public')) {
    const publicConfigs = configCache.get('public');
    const result = {};
    keys.forEach(key => {
      if (publicConfigs[key] !== undefined) {
        result[key] = publicConfigs[key];
      }
    });
    return result;
  }
  return {};
};

module.exports = {
  getConfig,
  getConfigs,
  getPublicConfigs,
  getAllConfigs,
  clearCache,
  getConfigSync,
  getConfigsSync,
};
