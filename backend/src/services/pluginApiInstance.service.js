// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { PluginApiInstance, PluginAPI } = require('../models');
const ApiError = require('../utils/ApiError');
const pluginApiService = require('./pluginApi.service');
const logger = require('../config/logger');

/**
 * Create a PluginApiInstance
 * @param {Object} instanceBody
 * @param {string} userId
 * @returns {Promise<PluginApiInstance>}
 */
const createInstance = async (instanceBody, userId) => {
  // Verify PluginAPI exists
  const pluginAPI = await pluginApiService.getPluginAPIById(instanceBody.plugin_api);
  if (!pluginAPI.is_active) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'PluginAPI is not active');
  }

  // Validate data against schema
  const validation = await pluginApiService.validateApiData(pluginAPI, instanceBody.data);
  if (!validation.valid) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Validation failed: ${validation.errors.join(', ')}`);
  }

  const instance = await PluginApiInstance.create({
    ...instanceBody,
    plugin_api_code: pluginAPI.code,
    owner: userId,
    created_by: userId,
    updated_by: userId,
  });

  return instance;
};

/**
 * Query PluginApiInstances
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} userId - Current user ID for scope filtering
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryInstances = async (filter, options, userId) => {
  // Filter by scope: user can only see system-scoped or their own user-scoped instances
  if (filter.scope === 'system') {
    // Explicitly filter for system scope only
    filter.scope = 'system';
  } else if (filter.scope === 'user') {
    // Filter for user scope, but only show instances owned by the current user
    filter.owner = userId;
  } else {
    // No scope filter specified: show system-scoped OR user-scoped (owned by current user)
    filter.$or = [
      { scope: 'system' },
      { scope: 'user', owner: userId },
    ];
    // Remove scope from filter since we're using $or
    delete filter.scope;
  }

  const instances = await PluginApiInstance.paginate(filter, options);
  return instances;
};

/**
 * Get PluginApiInstance by id with permission check
 * @param {string} id
 * @param {string} userId
 * @returns {Promise<PluginApiInstance>}
 */
const getInstanceById = async (id, userId) => {
  const instance = await PluginApiInstance.findById(id).populate('plugin_api');
  if (!instance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'PluginApiInstance not found');
  }

  // Check scope permissions
  if (instance.scope === 'user' && instance.owner.toString() !== userId.toString().toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied to this instance');
  }

  return instance;
};

/**
 * Update PluginApiInstance by id
 * @param {string} id
 * @param {Object} updateBody
 * @param {string} userId
 * @returns {Promise<PluginApiInstance>}
 */
const updateInstanceById = async (id, updateBody, userId) => {
  const instance = await getInstanceById(id, userId);

  // Check ownership for user-scoped instances
  if (instance.scope === 'user' && instance.owner.toString() !== userId.toString().toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the owner can update this instance');
  }

  // Validate data if being updated
  if (updateBody.data) {
    const pluginAPI = await pluginApiService.getPluginAPIById(instance.plugin_api);
    const validation = await pluginApiService.validateApiData(pluginAPI, updateBody.data);
    if (!validation.valid) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Validation failed: ${validation.errors.join(', ')}`);
    }
  }

  Object.assign(instance, updateBody);
  instance.updated_by = userId;
  
  // Mark data field as modified if it was updated
  if (updateBody.data) {
    instance.markModified('data');
    if (updateBody.data.items) {
      instance.markModified('data.items');
    }
  }
  
  await instance.save();
  return instance;
};

/**
 * Delete PluginApiInstance by id
 * @param {string} id
 * @param {string} userId
 * @returns {Promise<void>}
 */
const deleteInstanceById = async (id, userId) => {
  const instance = await getInstanceById(id, userId);

  // Check ownership for user-scoped instances
  if (instance.scope === 'user' && instance.owner.toString() !== userId.toString().toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the owner can delete this instance');
  }

  await instance.deleteOne();
};

/**
 * Add item to instance
 * @param {string} id
 * @param {Object} item
 * @param {string} userId
 * @returns {Promise<PluginApiInstance>}
 */
const addInstanceItem = async (id, item, userId) => {
  const instance = await getInstanceById(id, userId);

  // Check ownership for user-scoped instances (already checked in getInstanceById, but double-check for modification)
  if (instance.scope === 'user' && instance.owner.toString() !== userId.toString().toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the owner can modify this instance');
  }

  // Validate item
  const pluginAPI = await pluginApiService.getPluginAPIById(instance.plugin_api);
  
  // Check if item id already exists
  if (instance.data.items.some((existingItem) => existingItem.id === item.id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Item with id '${item.id}' already exists`);
  }

  // TODO: Validate item against JSON schema if schema validation library is added
  // For now, basic validation: ensure item has id
  if (!item.id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Item must have an id field');
  }

  instance.data.items.push(item);
  instance.updated_by = userId;
  await instance.save();
  return instance;
};

/**
 * Update item in instance
 * @param {string} id
 * @param {string} itemId
 * @param {Object} itemUpdate
 * @param {string} userId
 * @returns {Promise<PluginApiInstance>}
 */
const updateInstanceItem = async (id, itemId, itemUpdate, userId) => {
  const instance = await getInstanceById(id, userId);

  // Check ownership for user-scoped instances
  if (instance.scope === 'user' && instance.owner.toString() !== userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the owner can modify this instance');
  }

  const itemIndex = instance.data.items.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, `Item with id '${itemId}' not found`);
  }

  // Merge update into existing item (handle both direct update and wrapped in item property)
  const updateData = itemUpdate.item || itemUpdate;
  if (!updateData || Object.keys(updateData).length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Update data cannot be empty');
  }
  
  // Update the item directly in the array - convert to plain objects first
  const itemsArray = instance.data.items.map((item) => (item.toObject ? item.toObject() : { ...item }));
  Object.assign(itemsArray[itemIndex], updateData);
  instance.data.items = itemsArray;
  
  instance.updated_by = userId;
  instance.markModified('data.items'); // Mark array as modified for Mongoose
  await instance.save();
  
  // Reload to get fresh data
  return await getInstanceById(id, userId);
};

/**
 * Remove item from instance
 * @param {string} id
 * @param {string} itemId
 * @param {string} userId
 * @returns {Promise<PluginApiInstance>}
 */
const removeInstanceItem = async (id, itemId, userId) => {
  const instance = await getInstanceById(id, userId);

  // Check ownership for user-scoped instances
  if (instance.scope === 'user' && instance.owner.toString() !== userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the owner can modify this instance');
  }

  const itemIndex = instance.data.items.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, `Item with id '${itemId}' not found`);
  }

  instance.data.items.splice(itemIndex, 1);
  instance.updated_by = userId;
  await instance.save();
  return instance;
};

/**
 * Get instances by model
 * @param {string} modelId
 * @returns {Promise<PluginApiInstance[]>}
 */
const getInstancesByModel = async (modelId) => {
  const { Model } = require('../models');
  const model = await Model.findById(modelId).populate('plugin_api_instances');
  if (!model) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Model not found');
  }
  return model.plugin_api_instances || [];
};

module.exports = {
  createInstance,
  queryInstances,
  getInstanceById,
  updateInstanceById,
  deleteInstanceById,
  addInstanceItem,
  updateInstanceItem,
  removeInstanceItem,
  getInstancesByModel,
};

