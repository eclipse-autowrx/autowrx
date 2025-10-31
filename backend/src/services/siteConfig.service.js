// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { SiteConfig } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const fs = require('fs');
const path = require('path');

/**
 * Get value type from a value
 * @param {*} value
 * @returns {string}
 */
const getValueType = (value) => {
  if (value === null || value === undefined) return 'string';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (value instanceof Date) return 'date';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') {
    // Check for specific string patterns
    if (value.match(/^#[0-9A-Fa-f]{6}$/)) return 'color';
    if (value.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) return 'image_url';
  }
  return 'string';
};

/**
 * Mapping of config keys to their default file names
 * Add more mappings here as needed
 */
const DEFAULT_CONFIG_FILES = {
  'CFG_HOME_CONTENT': 'home_content.json',
  // Add more default files here as needed
  // 'CFG_ANOTHER_KEY': 'another_default.json',
};

/**
 * Load default value from file system for a given config key
 * @param {string} key - The config key
 * @returns {Object|null} - Default value object with value and valueType, or null if not found
 */
const loadDefaultConfigValue = (key) => {
  const defaultFileName = DEFAULT_CONFIG_FILES[key];
  if (!defaultFileName) {
    return null;
  }

  const defaultFilePath = path.join(__dirname, '..', '..', 'default', defaultFileName);

  try {
    if (!fs.existsSync(defaultFilePath)) {
      console.warn(`Default file not found for config key "${key}" at path: ${defaultFilePath}`);
      return null;
    }

    const fileContent = fs.readFileSync(defaultFilePath, 'utf8');
    const value = JSON.parse(fileContent);
    const valueType = getValueType(value);

    return {
      value,
      valueType,
      isDefault: true, // Flag to indicate this is a default value
    };
  } catch (error) {
    console.error(`Error loading default config file for key "${key}":`, error.message);
    return null;
  }
};

/**
 * Create a site config
 * @param {Object} siteConfigBody
 * @returns {Promise<SiteConfig>}
 */
const createSiteConfig = async (siteConfigBody) => {
  const { key, scope = 'site', target_id, value, valueType: clientValueType, secret = false, description, category = 'general', created_by } = siteConfigBody;
  
  // Check if key already exists for this scope and target
  const query = { key, scope };
  if (target_id) {
    query.target_id = target_id;
  }
  
  const existingConfig = await SiteConfig.findOne(query);
  if (existingConfig) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Config key "${key}" already exists for scope "${scope}"${target_id ? ` and target ${target_id}` : ''}`);
  }

  const valueType = clientValueType || getValueType(value);
  
  return SiteConfig.create({
    key,
    scope,
    target_id: scope === 'site' ? undefined : target_id,
    value,
    valueType,
    secret,
    description,
    category,
    created_by,
    updated_by: created_by,
  });
};

/**
 * Query for site configs
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {boolean} [options.useDefaultFallback] - Whether to include default values if not found in DB
 * @returns {Promise<QueryResult>}
 */
const querySiteConfigs = async (filter, options) => {
  const { useDefaultFallback = true, ...paginateOptions } = options;
  const siteConfigs = await SiteConfig.paginate(filter, paginateOptions);

  // If no results and a specific key is queried and fallback is enabled, check for defaults
  // Default scope to 'site' if not specified
  const scope = filter.scope || 'site';
  if (siteConfigs.results.length === 0 && filter.key && useDefaultFallback && scope === 'site') {
    const defaultConfig = loadDefaultConfigValue(filter.key);
    if (defaultConfig) {
      // Inject the default config into results
      siteConfigs.results = [{
        key: filter.key,
        scope: scope,
        value: defaultConfig.value,
        valueType: defaultConfig.valueType,
        secret: false,
        category: 'default',
        isDefault: true,
      }];
      siteConfigs.totalResults = 1;
      siteConfigs.totalPages = 1;
    }
  }

  return siteConfigs;
};

/**
 * Get site config by id
 * @param {ObjectId} id
 * @returns {Promise<SiteConfig>}
 */
const getSiteConfigById = async (id) => {
  return SiteConfig.findById(id);
};

/**
 * Get site config by key
 * @param {string} key
 * @param {string} scope
 * @param {string} target_id
 * @param {boolean} useDefaultFallback - Whether to load default values if not found in DB
 * @returns {Promise<SiteConfig|Object>}
 */
const getSiteConfigByKey = async (key, scope = 'site', target_id = null, useDefaultFallback = true) => {
  const query = { key, scope };
  if (target_id) {
    query.target_id = target_id;
  }

  const config = await SiteConfig.findOne(query);

  // If config exists in DB, return it
  if (config) {
    return config;
  }

  // If not found and fallback is enabled, try to load default
  if (useDefaultFallback && scope === 'site') {
    const defaultConfig = loadDefaultConfigValue(key);
    if (defaultConfig) {
      // Return a plain object that mimics the SiteConfig structure
      return {
        key,
        scope,
        value: defaultConfig.value,
        valueType: defaultConfig.valueType,
        secret: false,
        category: 'default',
        isDefault: true, // Flag to indicate this is from default file, not DB
      };
    }
  }

  return null;
};

/**
 * Get site config value by key (for internal use)
 * @param {string} key
 * @param {string} scope
 * @param {string} target_id
 * @param {boolean} useDefaultFallback - Whether to use default fallback
 * @returns {Promise<*>}
 */
const getSiteConfigValue = async (key, scope = 'site', target_id = null, useDefaultFallback = true) => {
  const config = await getSiteConfigByKey(key, scope, target_id, useDefaultFallback);
  return config ? config.value : null;
};

/**
 * Get multiple site config values by keys (for internal use)
 * @param {string[]} keys
 * @param {string} scope
 * @param {string} target_id
 * @returns {Promise<Object>}
 */
const getSiteConfigValues = async (keys, scope = 'site', target_id = null) => {
  const query = { key: { $in: keys }, scope };
  if (target_id) {
    query.target_id = target_id;
  }
  const configs = await SiteConfig.find(query);
  const result = {};
  configs.forEach(config => {
    result[config.key] = config.value;
  });
  return result;
};

/**
 * Get all public site configs (non-secret)
 * @param {string} scope
 * @param {string} target_id
 * @returns {Promise<Object>}
 */
const getPublicSiteConfigs = async (scope = 'site', target_id = null) => {
  const query = { secret: false, scope };
  if (target_id) {
    query.target_id = target_id;
  }
  const configs = await SiteConfig.find(query);
  const result = {};
  configs.forEach(config => {
    result[config.key] = config.value;
  });
  return result;
};

/**
 * Get all site configs (including secret ones) - admin only
 * @param {string} scope
 * @param {string} target_id
 * @returns {Promise<Object>}
 */
const getAllSiteConfigs = async (scope = 'site', target_id = null) => {
  const query = { scope };
  if (target_id) {
    query.target_id = target_id;
  }
  const configs = await SiteConfig.find(query);
  const result = {};
  configs.forEach(config => {
    result[config.key] = config.value;
  });
  return result;
};

/**
 * Get configs by scope and target
 * @param {string} scope
 * @param {string} target_id
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getConfigsByScope = async (scope, target_id = null, options = {}) => {
  const filter = { scope };
  if (target_id) {
    filter.target_id = target_id;
  }
  return querySiteConfigs(filter, options);
};

/**
 * Get user configs
 * @param {string} userId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getUserConfigs = async (userId, options = {}) => {
  return getConfigsByScope('user', userId, options);
};

/**
 * Get model configs
 * @param {string} modelId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getModelConfigs = async (modelId, options = {}) => {
  return getConfigsByScope('model', modelId, options);
};

/**
 * Update site config by id
 * @param {ObjectId} siteConfigId
 * @param {Object} updateBody
 * @returns {Promise<SiteConfig>}
 */
const updateSiteConfigById = async (siteConfigId, updateBody) => {
  const siteConfig = await getSiteConfigById(siteConfigId);
  if (!siteConfig) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Site config not found');
  }

  // Preserve existing valueType unless client explicitly provides a new one
  // If only value is updated, do NOT auto-derive and overwrite valueType

  Object.assign(siteConfig, updateBody);
  await siteConfig.save();
  return siteConfig;
};

/**
 * Update site config by key
 * @param {string} key
 * @param {Object} updateBody
 * @returns {Promise<SiteConfig>}
 */
const updateSiteConfigByKey = async (key, updateBody) => {
  // Don't use default fallback for update operations
  const siteConfig = await getSiteConfigByKey(key, 'site', null, false);
  if (!siteConfig) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Site config not found');
  }

  // Preserve existing valueType unless client explicitly provides a new one
  // If only value is updated, do NOT auto-derive and overwrite valueType

  Object.assign(siteConfig, updateBody);
  await siteConfig.save();
  return siteConfig;
};

/**
 * Delete site config by id
 * @param {ObjectId} siteConfigId
 * @returns {Promise<SiteConfig>}
 */
const deleteSiteConfigById = async (siteConfigId) => {
  const siteConfig = await getSiteConfigById(siteConfigId);
  if (!siteConfig) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Site config not found');
  }
  await siteConfig.deleteOne();
  return siteConfig;
};

/**
 * Delete site config by key
 * @param {string} key
 * @returns {Promise<SiteConfig>}
 */
const deleteSiteConfigByKey = async (key) => {
  // Don't use default fallback for delete operations
  const siteConfig = await getSiteConfigByKey(key, 'site', null, false);
  if (!siteConfig) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Site config not found');
  }
  await siteConfig.deleteOne();
  return siteConfig;
};

/**
 * Bulk create or update site configs
 * @param {Array} configs - Array of config objects
 * @param {string} userId - User ID performing the operation
 * @returns {Promise<Array>}
 */
const bulkUpsertSiteConfigs = async (configs, userId) => {
  const operations = configs.map(config => ({
    updateOne: {
      filter: { key: config.key },
      update: {
        $set: {
          ...config,
          valueType: config.valueType || getValueType(config.value),
          updated_by: userId,
        },
        $setOnInsert: {
          created_by: userId,
        },
      },
      upsert: true,
    },
  }));

  await SiteConfig.bulkWrite(operations);
  return SiteConfig.find({ key: { $in: configs.map(c => c.key) } });
};

module.exports = {
  createSiteConfig,
  querySiteConfigs,
  getSiteConfigById,
  getSiteConfigByKey,
  getSiteConfigValue,
  getSiteConfigValues,
  getPublicSiteConfigs,
  getAllSiteConfigs,
  getConfigsByScope,
  getUserConfigs,
  getModelConfigs,
  updateSiteConfigById,
  updateSiteConfigByKey,
  deleteSiteConfigById,
  deleteSiteConfigByKey,
  bulkUpsertSiteConfigs,
};
