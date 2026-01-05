// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { PluginAPI } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Create a PluginAPI schema
 * @param {Object} pluginApiBody
 * @param {string} userId
 * @returns {Promise<PluginAPI>}
 */
const createPluginAPI = async (pluginApiBody, userId) => {
  // Check if code already exists
  if (await PluginAPI.findOne({ code: pluginApiBody.code.toLowerCase() })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'PluginAPI code already exists');
  }

  const pluginAPI = await PluginAPI.create({
    ...pluginApiBody,
    code: pluginApiBody.code.toLowerCase(),
    created_by: userId,
    updated_by: userId,
  });

  return pluginAPI;
};

/**
 * Query PluginAPIs
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryPluginAPIs = async (filter, options) => {
  const pluginAPIs = await PluginAPI.paginate(filter, options);
  return pluginAPIs;
};

/**
 * Get PluginAPI by id
 * @param {string} id
 * @returns {Promise<PluginAPI>}
 */
const getPluginAPIById = async (id) => {
  const pluginAPI = await PluginAPI.findById(id);
  if (!pluginAPI) {
    throw new ApiError(httpStatus.NOT_FOUND, 'PluginAPI not found');
  }
  return pluginAPI;
};

/**
 * Get PluginAPI by code
 * @param {string} code
 * @returns {Promise<PluginAPI>}
 */
const getPluginAPIByCode = async (code) => {
  const pluginAPI = await PluginAPI.findOne({ code: code.toLowerCase(), is_active: true });
  if (!pluginAPI) {
    throw new ApiError(httpStatus.NOT_FOUND, 'PluginAPI not found');
  }
  return pluginAPI;
};

/**
 * Update PluginAPI by id
 * @param {string} id
 * @param {Object} updateBody
 * @param {string} userId
 * @returns {Promise<PluginAPI>}
 */
const updatePluginAPIById = async (id, updateBody, userId) => {
  const pluginAPI = await getPluginAPIById(id);

  // Check if code is being changed and if new code already exists
  if (updateBody.code && updateBody.code.toLowerCase() !== pluginAPI.code) {
    if (await PluginAPI.findOne({ code: updateBody.code.toLowerCase() })) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'PluginAPI code already exists');
    }
    updateBody.code = updateBody.code.toLowerCase();
  }

  Object.assign(pluginAPI, updateBody);
  pluginAPI.updated_by = userId;
  await pluginAPI.save();
  return pluginAPI;
};

/**
 * Delete PluginAPI by id
 * @param {string} id
 * @returns {Promise<void>}
 */
const deletePluginAPIById = async (id) => {
  const pluginAPI = await getPluginAPIById(id);
  await pluginAPI.deleteOne();
};

/**
 * Validate API data against PluginAPI schema
 * @param {Object} pluginAPI - PluginAPI schema
 * @param {Object} data - Data to validate
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
const validateApiData = async (pluginAPI, data) => {
  const errors = [];

  if (!data.items || !Array.isArray(data.items)) {
    errors.push('Data must contain an items array');
    return { valid: false, errors };
  }

  // TODO: Validate items against JSON schema if schema validation library is added
  // For now, basic validation: ensure items have required fields based on type
  data.items.forEach((item, index) => {
    if (!item.id) {
      errors.push(`Item ${index}: Missing required field 'id'`);
    }
  });

  // Validate tree structure if type is tree
  if (pluginAPI.type === 'tree') {
    const pathMap = new Map();
    data.items.forEach((item) => {
      if (item.path) {
        pathMap.set(item.path, item);
      }
    });

    data.items.forEach((item, index) => {
      if (item.parent_id && !pathMap.has(item.parent_id)) {
        errors.push(`Item ${index}: Parent path '${item.parent_id}' not found`);
      }
    });
  }

  // Validate graph relationships if type is graph
  if (pluginAPI.type === 'graph') {
    const itemIdMap = new Map();
    data.items.forEach((item) => {
      itemIdMap.set(item.id, item);
    });

    data.items.forEach((item, index) => {
      if (item.relationships) {
        item.relationships.forEach((rel) => {
          if (!itemIdMap.has(rel.target_item_id)) {
            errors.push(`Item ${index}: Relationship target '${rel.target_item_id}' not found`);
          }
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

module.exports = {
  createPluginAPI,
  queryPluginAPIs,
  getPluginAPIById,
  getPluginAPIByCode,
  updatePluginAPIById,
  deletePluginAPIById,
  validateApiData,
};

