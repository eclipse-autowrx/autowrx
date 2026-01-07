// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { CustomApiSchema } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Create a CustomApiSchema schema
 * @param {Object} customApiSchemaBody
 * @param {string} userId
 * @returns {Promise<CustomApiSchema>}
 */
const createCustomApiSchema = async (customApiSchemaBody, userId) => {
  // Check if code already exists
  if (await CustomApiSchema.findOne({ code: customApiSchemaBody.code.toLowerCase() })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'CustomApiSchema code already exists');
  }

  const customApiSchema = await CustomApiSchema.create({
    ...customApiSchemaBody,
    code: customApiSchemaBody.code.toLowerCase(),
    created_by: userId,
    updated_by: userId,
  });

  return customApiSchema;
};

/**
 * Query CustomApiSchemas
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryCustomApiSchemas = async (filter, options) => {
  const customApiSchemas = await CustomApiSchema.paginate(filter, options);
  return customApiSchemas;
};

/**
 * Get CustomApiSchema by id
 * @param {string} id
 * @returns {Promise<CustomApiSchema>}
 */
const getCustomApiSchemaById = async (id) => {
  const customApiSchema = await CustomApiSchema.findById(id);
  if (!customApiSchema) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CustomApiSchema not found');
  }
  return customApiSchema;
};

/**
 * Get CustomApiSchema by code
 * @param {string} code
 * @returns {Promise<CustomApiSchema>}
 */
const getCustomApiSchemaByCode = async (code) => {
  const customApiSchema = await CustomApiSchema.findOne({ code: code.toLowerCase(), is_active: true });
  if (!customApiSchema) {
    throw new ApiError(httpStatus.NOT_FOUND, 'CustomApiSchema not found');
  }
  return customApiSchema;
};

/**
 * Update CustomApiSchema by id
 * @param {string} id
 * @param {Object} updateBody
 * @param {string} userId
 * @returns {Promise<CustomApiSchema>}
 */
const updateCustomApiSchemaById = async (id, updateBody, userId) => {
  const customApiSchema = await getCustomApiSchemaById(id);

  // Check if code is being changed and if new code already exists
  if (updateBody.code && updateBody.code.toLowerCase() !== customApiSchema.code) {
    if (await CustomApiSchema.findOne({ code: updateBody.code.toLowerCase() })) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'CustomApiSchema code already exists');
    }
    updateBody.code = updateBody.code.toLowerCase();
  }

  Object.assign(customApiSchema, updateBody);
  customApiSchema.updated_by = userId;
  await customApiSchema.save();
  return customApiSchema;
};

/**
 * Delete CustomApiSchema by id
 * @param {string} id
 * @returns {Promise<void>}
 */
const deleteCustomApiSchemaById = async (id) => {
  const customApiSchema = await getCustomApiSchemaById(id);
  await customApiSchema.deleteOne();
};

/**
 * Validate API data against CustomApiSchema schema
 * @param {Object} customApiSchema - CustomApiSchema schema
 * @param {Object} data - Data to validate
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
const validateApiData = async (customApiSchema, data) => {
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
  if (customApiSchema.type === 'tree') {
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
  if (customApiSchema.type === 'graph') {
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
  createCustomApiSchema,
  queryCustomApiSchemas,
  getCustomApiSchemaById,
  getCustomApiSchemaByCode,
  updateCustomApiSchemaById,
  deleteCustomApiSchemaById,
  validateApiData,
};

