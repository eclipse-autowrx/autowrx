// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { siteConfigService } = require('../services');
const config = require('../config/config');
const logger = require('../config/logger');

// Cache for site configs to avoid repeated database calls
let configCache = new Map();
let cacheExpiry = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Auth config cache - separate from general config cache
let authConfigCache = new Map();
let authCacheExpiry = null;
const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
    logger.warn('Failed to get site config for key "%s": %s', key, error.message);
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
    logger.warn('Failed to get site configs: %s', error.message);
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
    logger.warn('Failed to get public site configs: %s', error.message);
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
    logger.warn('Failed to get all site configs: %s', error.message);
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

/**
 * Get authentication config value with fallback to STRICT_AUTH environment variable
 * @param {string} key - Auth config key (PUBLIC_VIEWING, SELF_REGISTRATION, SSO_AUTO_REGISTRATION, PASSWORD_MANAGEMENT)
 * @returns {Promise<boolean>} - The auth config value
 */
const getAuthConfig = async (key) => {
  const validKeys = ['PUBLIC_VIEWING', 'SELF_REGISTRATION', 'SSO_AUTO_REGISTRATION', 'PASSWORD_MANAGEMENT'];
  
  if (!validKeys.includes(key)) {
    logger.warn('Invalid auth config key: %s. Valid keys are: %s', key, validKeys.join(', '));
    return false;
  }

  try {
    // Try to get from database with category='auth'
    const dbConfig = await siteConfigService.getSiteConfigByKey(key, 'site', null, false);
    
    if (dbConfig && dbConfig.value !== undefined && dbConfig.value !== null) {
      // Store in cache
      authConfigCache.set(key, dbConfig.value);
      authCacheExpiry = Date.now() + AUTH_CACHE_DURATION;
      return Boolean(dbConfig.value);
    }

    // Fallback to STRICT_AUTH environment variable
    // STRICT_AUTH=false → all configs = true (open mode)
    // STRICT_AUTH=true → all configs = false (closed mode)
    // No STRICT_AUTH → default to false (closed mode)
    const strictAuth = config.strictAuth !== undefined ? config.strictAuth : true;
    const fallbackValue = !strictAuth; // Invert: false strict = true open
    
    logger.info('Auth config "%s" not found in database, using STRICT_AUTH fallback: %s', key, fallbackValue);
    return fallbackValue;
  } catch (error) {
    logger.warn('Failed to get auth config "%s": %s', key, error.message);
    // On error, default to closed/secure mode
    return false;
  }
};

/**
 * Get authentication config value synchronously from cache
 * @param {string} key - Auth config key
 * @param {boolean} defaultValue - Default value if not in cache
 * @returns {boolean} - The cached auth config value or default
 */
const getAuthConfigSync = (key, defaultValue = false) => {
  const validKeys = ['PUBLIC_VIEWING', 'SELF_REGISTRATION', 'SSO_AUTO_REGISTRATION', 'PASSWORD_MANAGEMENT'];
  
  if (!validKeys.includes(key)) {
    logger.warn('Invalid auth config key: %s', key);
    return defaultValue;
  }

  if (authConfigCache.has(key) && authCacheExpiry && Date.now() < authCacheExpiry) {
    return authConfigCache.get(key);
  }
  
  return defaultValue;
};

/**
 * Clear the auth config cache
 */
const clearAuthCache = () => {
  authConfigCache.clear();
  authCacheExpiry = null;
};

module.exports = {
  getConfig,
  getConfigs,
  getPublicConfigs,
  getAllConfigs,
  clearCache,
  getConfigSync,
  getConfigsSync,
  getAuthConfig,
  getAuthConfigSync,
  clearAuthCache,
};
