// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { CustomApiSet, CustomApiSchema } = require('../models');
const ApiError = require('../utils/ApiError');
const customApiSchemaService = require('./customApiSchema.service');
const logger = require('../config/logger');

/**
 * Create a CustomApiSet
 * @param {Object} setBody
 * @param {string} userId
 * @returns {Promise<CustomApiSet>}
 */
const createSet = async (setBody, userId) => {
  // Verify CustomApiSchema exists
  const customApiSchema = await customApiSchemaService.getCustomApiSchemaById(setBody.custom_api_schema);
  if (!customApiSchema.is_active) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'CustomApiSchema is not active');
  }

  // Validate data against schema
  const validation = await customApiSchemaService.validateApiData(customApiSchema, setBody.data);
  if (!validation.valid) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Validation failed: ${validation.errors.join(', ')}`);
  }

  const set = await CustomApiSet.create({
    ...setBody,
    custom_api_schema_code: customApiSchema.code,
    owner: userId,
    created_by: userId,
    updated_by: userId,
  });

  return set;
};

/**
 * Query CustomApiSets
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} userId - Current user ID for scope filtering (undefined for unauthenticated users)
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const querySets = async (filter, options, userId) => {
  // Unauthenticated users can only see system-scoped sets (public sets)
  if (!userId) {
    if (filter.scope === 'user') {
      // Unauthenticated users cannot access user-scoped sets
      filter.scope = 'nonexistent'; // Force no results
    } else if (!filter.scope) {
      // No scope filter: show only system-scoped sets
      filter.scope = 'system';
    }
    // If scope is 'system', keep it as is
  } else {
    // Authenticated users: filter by scope as before
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
  }

  const sets = await CustomApiSet.paginate(filter, options);
  return sets;
};

/**
 * Get CustomApiSet by id with permission check
 * @param {string} id
 * @param {string} userId - Optional user ID (undefined for unauthenticated users)
 * @returns {Promise<CustomApiSet>}
 */
const getSetById = async (id, userId) => {
  const set = await CustomApiSet.findById(id).populate('custom_api_schema');
  if (!set) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CustomApiSet not found');
  }

  // Check scope permissions
  // Unauthenticated users can only access 'system' scope sets (public sets)
  if (!userId) {
    if (set.scope !== 'system') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Access denied to this set');
    }
  } else {
    // Authenticated users: user-scoped sets are only accessible by owner
    if (set.scope === 'user' && set.owner.toString() !== userId.toString()) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Access denied to this set');
    }
  }

  return set;
};

/**
 * Update CustomApiSet by id
 * @param {string} id
 * @param {Object} updateBody
 * @param {string} userId
 * @returns {Promise<CustomApiSet>}
 */
const updateSetById = async (id, updateBody, userId) => {
  const set = await getSetById(id, userId);

  // Check ownership for user-scoped sets
  if (set.scope === 'user' && set.owner.toString() !== userId.toString().toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the owner can update this set');
  }

  // Validate data if being updated
  if (updateBody.data) {
    const customApiSchema = await customApiSchemaService.getCustomApiSchemaById(set.custom_api_schema);
    const validation = await customApiSchemaService.validateApiData(customApiSchema, updateBody.data);
    if (!validation.valid) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Validation failed: ${validation.errors.join(', ')}`);
    }
  }

  Object.assign(set, updateBody);
  set.updated_by = userId;
  
  // Mark data field as modified if it was updated
  if (updateBody.data) {
    set.markModified('data');
    if (updateBody.data.items) {
      set.markModified('data.items');
    }
  }
  
  await set.save();
  return set;
};

/**
 * Delete CustomApiSet by id
 * @param {string} id
 * @param {string} userId
 * @returns {Promise<void>}
 */
const deleteSetById = async (id, userId) => {
  const set = await getSetById(id, userId);

  // Check ownership for user-scoped sets
  if (set.scope === 'user' && set.owner.toString() !== userId.toString().toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the owner can delete this set');
  }

  await set.deleteOne();
};

/**
 * Add item to set
 * @param {string} id
 * @param {Object} item
 * @param {string} userId
 * @returns {Promise<CustomApiSet>}
 */
const addSetItem = async (id, item, userId) => {
  const set = await getSetById(id, userId);

  // Check ownership for user-scoped sets (already checked in getSetById, but double-check for modification)
  if (set.scope === 'user' && set.owner.toString() !== userId.toString().toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the owner can modify this set');
  }

  // Validate item
  const customApiSchema = await customApiSchemaService.getCustomApiSchemaById(set.custom_api_schema);
  
  // Check if item id already exists
  if (set.data.items.some((existingItem) => existingItem.id === item.id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Item with id '${item.id}' already exists`);
  }

  // TODO: Validate item against JSON schema if schema validation library is added
  // For now, basic validation: ensure item has id
  if (!item.id) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Item must have an id field');
  }

  set.data.items.push(item);
  set.updated_by = userId;
  await set.save();
  return set;
};

/**
 * Update item in set
 * @param {string} id
 * @param {string} itemId
 * @param {Object} itemUpdate
 * @param {string} userId
 * @returns {Promise<CustomApiSet>}
 */
const updateSetItem = async (id, itemId, itemUpdate, userId) => {
  const set = await getSetById(id, userId);

  // Check ownership for user-scoped sets
  if (set.scope === 'user' && set.owner.toString() !== userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the owner can modify this set');
  }

  const itemIndex = set.data.items.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, `Item with id '${itemId}' not found`);
  }

  // Merge update into existing item (handle both direct update and wrapped in item property)
  const updateData = itemUpdate.item || itemUpdate;
  if (!updateData || Object.keys(updateData).length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Update data cannot be empty');
  }
  
  // Update the item directly in the array - convert to plain objects first
  const itemsArray = set.data.items.map((item) => (item.toObject ? item.toObject() : { ...item }));
  Object.assign(itemsArray[itemIndex], updateData);
  set.data.items = itemsArray;
  
  set.updated_by = userId;
  set.markModified('data.items'); // Mark array as modified for Mongoose
  await set.save();
  
  // Reload to get fresh data
  return await getSetById(id, userId);
};

/**
 * Remove item from set
 * @param {string} id
 * @param {string} itemId
 * @param {string} userId
 * @returns {Promise<CustomApiSet>}
 */
const removeSetItem = async (id, itemId, userId) => {
  const set = await getSetById(id, userId);

  // Check ownership for user-scoped sets
  if (set.scope === 'user' && set.owner.toString() !== userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the owner can modify this set');
  }

  const itemIndex = set.data.items.findIndex((item) => item.id === itemId);
  if (itemIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, `Item with id '${itemId}' not found`);
  }

  set.data.items.splice(itemIndex, 1);
  set.updated_by = userId;
  await set.save();
  return set;
};

/**
 * Get sets by model
 * @param {string} modelId
 * @returns {Promise<CustomApiSet[]>}
 */
const getSetsByModel = async (modelId) => {
  const { Model } = require('../models');
  const model = await Model.findById(modelId).populate('custom_api_sets');
  if (!model) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Model not found');
  }
  return model.custom_api_sets || [];
};

module.exports = {
  createSet,
  querySets,
  getSetById,
  updateSetById,
  deleteSetById,
  addSetItem,
  updateSetItem,
  removeSetItem,
  getSetsByModel,
};

