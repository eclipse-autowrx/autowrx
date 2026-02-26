// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { Prototype } = require('../models');
const ApiError = require('../utils/ApiError');
const permissionService = require('./permission.service');
const { PERMISSIONS } = require('../config/roles');
const { default: axios, isAxiosError } = require('axios');
const config = require('../config/config');
const logger = require('../config/logger');
const modelService = require('./model.service');
const _ = require('lodash');

/**
 * Strip trailing number suffix from a prototype name.
 * e.g. "test_2" → "test", "test" → "test"
 * @param {string} name
 * @returns {string}
 */
const stripTrailingNumber = (name) => {
  return name.replace(/_\d+$/, '');
};

/**
 * Generate up to 3 available prototype name suggestions for a model.
 * @param {string} modelId
 * @param {string} baseName
 * @returns {Promise<string[]>}
 */
const getSuggestedNames = async (modelId, baseName) => {
  const suggestions = [];
  let counter = 1;
  while (suggestions.length < 3) {
    const candidateName = `${baseName}_${counter}`;
    const exists = await Prototype.existsPrototypeInModel(modelId, candidateName);
    if (!exists) {
      suggestions.push(candidateName);
    }
    counter++;
  }
  return suggestions;
};

/**
 * Handle duplicate prototype name error with suggestions.
 * @param {string} modelId
 * @param {string} prototypeName
 * @param {string} userId
 * @throws {ApiError}
 */
const throwDuplicateNameError = async (modelId, prototypeName, userId) => {
  const model = await modelService.getModelById(modelId, userId);
  const baseName = stripTrailingNumber(prototypeName);
  const suggestions = await getSuggestedNames(modelId, baseName);
  throw new ApiError(
    httpStatus.BAD_REQUEST,
    `The prototype name '${prototypeName}' is already in use for model '${model.name}'. Please choose another name like: ${suggestions.join(', ')}.`
  );
};

/**
 *
 * @param {string} userId
 * @param {Object} prototypeBody
 * @returns {Promise<string>}
 */
const createPrototype = async (userId, prototypeBody) => {
  if (await Prototype.existsPrototypeInModel(prototypeBody.model_id, prototypeBody.name)) {
    await throwDuplicateNameError(prototypeBody.model_id, prototypeBody.name, userId);
  }

  if (prototypeBody.extend && typeof prototypeBody.extend === 'string') {
    try {
      const parsedExtend = JSON.parse(prototypeBody.extend);
      prototypeBody.extend = parsedExtend;
    } catch (error) {
      logger.warn(`Failed to parse 'extend' field: ${error}`);
    }
  }

  if (prototypeBody.requirements_data && typeof prototypeBody.requirements_data === 'string') {
    try {
      const parsedRequirementsData = JSON.parse(prototypeBody.requirements_data);
      prototypeBody.requirements_data = parsedRequirementsData;
    } catch (error) {
      logger.warn(`Failed to parse 'requirements_data' field: ${error}`);
    }
  }

  const prototype = await Prototype.create({
    ...prototypeBody,
    created_by: userId,
  });
  return prototype;
};

/**
 *
 * @param {string} userId
 * @param {Object[]} prototypes
 * @returns {Promise<string>}create
 */
const bulkCreatePrototypes = async (userId, prototypes) => {
  for (const prototype of prototypes) {
    if (await Prototype.existsPrototypeInModel(prototype.model_id, prototype.name)) {
      await throwDuplicateNameError(prototype.model_id, prototype.name, userId);
    }
  }

  const data = await Prototype.insertMany(
    prototypes.map((prototype) => ({
      ...prototype,
      created_by: userId,
    }))
  );
  return data.map((item) => item._id);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {fields} [options.fields] - Fields to select
 * @returns {Promise<QueryResult>}
 */
const queryPrototypes = async (filter, options) => {
  const prototypes = await Prototype.paginate(filter, {
    ...options,
    // Default sort by editors_choice and createdAt
    sortBy: options?.sortBy
      ? ['editors_choice:desc,createdAt:asc', options.sortBy].join(',')
      : 'editors_choice:desc,createdAt:asc',
  });
  return prototypes;
};

/**
 *
 * @param {string} id
 * @returns {Promise<import('../models/prototype.model').Prototype>}
 */
const getPrototypeById = async (id, userId) => {
  const prototype = await Prototype.findById(id).populate([
    {
      path: 'created_by',
      select: 'name image_file',
    },
    {
      path: 'model_id',
      select: 'name visibility',
    },
  ]);

  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  if (prototype.model_id.visibility === 'private') {
    if (!(await permissionService.hasPermission(userId, PERMISSIONS.READ_MODEL, id))) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  return prototype;
};

/**
 *
 * @param {string} id
 * @param {Object} updateBody
 * @param {string} actionOwner
 * @returns {Promise<import("../models/prototype.model").Prototype>}
 */
const updatePrototypeById = async (id, updateBody, actionOwner) => {
  const prototype = await Prototype.findById(id);
  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  if (updateBody.name && (await Prototype.existsPrototypeInModel(prototype.model_id, updateBody.name, id))) {
    await throwDuplicateNameError(prototype.model_id, updateBody.name, actionOwner);
  }

  if (updateBody.extend && typeof updateBody.extend === 'string') {
    try {
      const parsedExtend = JSON.parse(updateBody.extend);
      updateBody.extend = parsedExtend;
    } catch (error) {
      logger.warn(`Failed to parse 'extend' field: ${error}`);
    }
  }

  if (updateBody.requirements_data && typeof updateBody.requirements_data === 'string') {
    try {
      const parsedRequirementsData = JSON.parse(updateBody.requirements_data);
      updateBody.requirements_data = parsedRequirementsData;
    } catch (error) {
      logger.warn(`Failed to parse 'requirements_data' field: ${error}`);
    }
  }

  updateBody.action_owner = actionOwner;
  Object.assign(prototype, updateBody);
  await prototype.save();

  return prototype;
};

/**
 *
 * @param {string} id
 * @param {string} actionOwner
 * @returns {Promise<void>}
 */
const deletePrototypeById = async (id, actionOwner) => {
  const prototype = await Prototype.findById(id);
  if (!prototype) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  prototype.action_owner = actionOwner;

  await prototype.deleteOne();
};

/**
 *
 * @param {string} userId
 */
const getRecentCachedPrototypes = async (userId) => {
  /**
   * @type {Array<import('../typedefs/cacheDef').CacheEntity>}
   */
  let recentData = [];
  try {
    recentData = (await axios.get(`${config.services.cache.url}/get-recent-activities/${userId}`)).data;
  } catch (error) {
    if (isAxiosError(error)) {
      logger.error('Error while getting recent prototypes from cache', error.response?.data?.message || error.message);
    } else {
      logger.error('Error while getting recent prototypes from cache', error.message);
    }
  }
  return recentData;
};

/**
 *
 * @param {string} userId
 */
const listRecentPrototypes = async (userId) => {
  const recentData = await getRecentCachedPrototypes(userId);

  // Create map
  const prototypeMap = new Map();
  recentData.forEach((data) => {
    prototypeMap.set(data.referenceId, data);
  });

  const prototypes = await Prototype.find({ _id: { $in: Array.from(prototypeMap.keys()) } })
    .select('name model_id description image_file executed_turns')
    .populate('model', 'name visibility')
    .populate('created_by', 'name image_file');

  const results = [];
  recentData.forEach((data) => {
    const correspondingPrototype = prototypes.find((prototype) => String(prototype._id) === data.referenceId);
    if (correspondingPrototype) {
      results.push({
        ...correspondingPrototype.toJSON(),
        last_visited: data.time,
        last_page: data.page,
      });
    }
  });
  return results;
};

/**
 *
 * @param {string} id
 * @param {Object} [body]
 * @returns {Promise<void>}
 */
const executeCode = async (id, _) => {
  const prototype = await Prototype.findById(id);
  prototype.executed_turns += 1;
  await prototype.save();
};

/**
 *
 * @returns {Promise<import('../typedefs/prototypeDef').Prototype[]>}
 */
const listPopularPrototypes = async () => {
  const publicModelIds = (
    await modelService.getModels({
      visibility: 'public',
    })
  ).map((model) => String(model._id));
  return Prototype.find({
    model_id: { $in: publicModelIds },
    state: 'Released',
  })
    .sort({ executed_turns: -1 })
    .limit(8)
    .select('name model_id description image_file executed_turns')
    .populate('model', 'name visibility')
    .populate('created_by', 'name image_file');
};

/**
 *
 * @param {object} filter
 * @param {string} actionOwner
 */
const deleteMany = async (filter, actionOwner) => {
  if (_.isEmpty(filter)) {
    throw new Error('Filter is required');
  }
  const prototypes = (await Prototype.find(filter)).filter((prototype) => prototype);
  await Promise.all(
    prototypes.map(async (prototype) => {
      prototype.action_owner = actionOwner;
      await prototype.deleteOne();
    })
  );
};

module.exports.createPrototype = createPrototype;
module.exports.queryPrototypes = queryPrototypes;
module.exports.getPrototypeById = getPrototypeById;
module.exports.updatePrototypeById = updatePrototypeById;
module.exports.deletePrototypeById = deletePrototypeById;
module.exports.listRecentPrototypes = listRecentPrototypes;
module.exports.executeCode = executeCode;
module.exports.listPopularPrototypes = listPopularPrototypes;
module.exports.bulkCreatePrototypes = bulkCreatePrototypes;
module.exports.deleteMany = deleteMany;
