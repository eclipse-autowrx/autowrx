// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { ExtendedApi } = require('../models');
const ApiError = require('../utils/ApiError');
const { permissionService } = require('.');
const { PERMISSIONS } = require('../config/roles');
const Joi = require('joi');
const { extendedApiValidation } = require('../validations');

/**
 * Create a new ExtendedApi
 * @param {Object} extendedApiBody
 * @returns {Promise<ExtendedApi>}
 */
const createExtendedApi = async (extendedApiBody) => {
  const existingExtendedApi = await ExtendedApi.findOne({ apiName: extendedApiBody.apiName, model: extendedApiBody.model });
  if (existingExtendedApi) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'An extended API with the same name already exists for this model');
  }
  return ExtendedApi.create(extendedApiBody);
};

/**
 * Query for ExtendedApis
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryExtendedApis = async (filter, options) => {
  const extendedApis = await ExtendedApi.paginate(filter, options);
  return extendedApis;
};

/**
 * Get ExtendedApi by id
 * @param {ObjectId} id
 * @returns {Promise<ExtendedApi>}
 */
const getExtendedApiById = async (id) => {
  return ExtendedApi.findById(id);
};

/**
 * Update ExtendedApi by id
 * @param {ObjectId} extendedApiId
 * @param {Object} updateBody
 * @param {string} actionOwner
 * @returns {Promise<ExtendedApi>}
 */
const updateExtendedApiById = async (extendedApiId, updateBody, actionOwner) => {
  const extendedApi = await getExtendedApiById(extendedApiId);
  if (!extendedApi) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ExtendedApi not found');
  }
  if (!(await permissionService.hasPermission(actionOwner, PERMISSIONS.WRITE_MODEL, extendedApi.model))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden. You do not have permission to update extended API for this model');
  }

  updateBody.action_owner = actionOwner;
  extendedApi.set(updateBody);
  await extendedApi.save();
  return extendedApi;
};

/**
 * Delete ExtendedApi by id
 * @param {ObjectId} extendedApiId
 * @param {string} actionOwner
 * @returns {Promise<ExtendedApi>}
 */
const deleteExtendedApiById = async (extendedApiId, actionOwner) => {
  const extendedApi = await getExtendedApiById(extendedApiId);
  if (!extendedApi) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ExtendedApi not found');
  }
  if (!(await permissionService.hasPermission(actionOwner, PERMISSIONS.WRITE_MODEL, extendedApi.model))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden. You do not have permission to update extended API for this model');
  }

  extendedApi.action_owner = actionOwner;
  await extendedApi.remove();
  return extendedApi;
};

const getExtendedApiByApiNameAndModel = async (apiName, model) => {
  return ExtendedApi.findOne({ apiName, model });
};

const deleteExtendedApisByModelId = async (modelId) => {
  await ExtendedApi.deleteMany({ model: modelId });
};

/**
 *
 * @param {import('../typedefs').ExtendedApi} extendedApi
 * @returns {Promise<null | {details: string[]}>}
 */
const validateExtendedApi = async (extendedApi) => {
  const { _, error } = Joi.compile(extendedApiValidation.createExtendedApi.body.unknown())
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(extendedApi);

  if (error) {
    return {
      details: error.details.map((details) => details.message),
    };
  }

  return null;
};

module.exports.createExtendedApi = createExtendedApi;
module.exports.queryExtendedApis = queryExtendedApis;
module.exports.getExtendedApiById = getExtendedApiById;
module.exports.updateExtendedApiById = updateExtendedApiById;
module.exports.deleteExtendedApiById = deleteExtendedApiById;
module.exports.getExtendedApiByApiNameAndModel = getExtendedApiByApiNameAndModel;
module.exports.deleteExtendedApisByModelId = deleteExtendedApisByModelId;
module.exports.validateExtendedApi = validateExtendedApi;
