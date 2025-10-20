// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { userService } = require('.');
const prototypeService = require('./prototype.service');
const apiService = require('./api.service');
const permissionService = require('./permission.service');
const fileService = require('./file.service');
const { Model, Role } = require('../models');
const ApiError = require('../utils/ApiError');
const { PERMISSIONS } = require('../config/roles');
const mongoose = require('mongoose');
const logger = require('../config/logger');
const _ = require('lodash');
const config = require('../config/config');

/**
 *
 * @param {string} userId
 * @param {Object} modelBody
 * @returns {Promise<string>}
 */
const createModel = async (userId, modelBody) => {
  const user = await userService.getUserById(userId);

  if (user.role !== 'admin') {
    const count = await Model.countDocuments({ created_by: userId });
    if (count >= 3) {
      if (!(await permissionService.hasPermission(userId, PERMISSIONS.UNLIMITED_MODEL))) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Users are limited to 3 models');
      }
    }
  }

  if (modelBody.extend && typeof modelBody.extend === 'string') {
    try {
      const parsedExtend = JSON.parse(modelBody.extend);
      modelBody.extend = parsedExtend;
    } catch (error) {
      logger.warn(`Failed while parsing extend field: ${error}`);
    }
  }

  const model = await Model.create({
    ...modelBody,
    created_by: userId,
  });
  return model._id;
};

/**
 *
 * @param {Object}model
 */
const getModelStats = async (model) => {
  // Number of used APIS / total apis
  const stats = {
    apis: {},
    prototypes: {},
    architecture: {},
    collaboration: {},
  };

  if (!model) return stats;

  let prototypes = null;
  const modelId = model._id || model.id;

  // Query prototypes
  try {
    prototypes = await prototypeService.queryPrototypes({ model_id: modelId }, { limit: 1000 });
    stats.prototypes.count = prototypes.results.length || 0;
  } catch (error) {
    logger.warn(`Error in querying prototypes ${error}`);
  }

  // Query APIs
  try {
    const cvi = await apiService.computeVSSApi(modelId);
    const apiList = apiService.parseCvi(cvi);
    stats.apis.total = { count: apiList?.length || 0 };

    const mergedCode = prototypes.results.map((prototype) => prototype.code).join('\n');
    const usedApis = apiService.getUsedApis(mergedCode, apiList);
    stats.apis.used = {
      count: usedApis.length,
    };
  } catch (error) {
    logger.warn(`Error in computing VSS API ${error}`);
  }

  // Query architecture of prototypes
  try {
    const prototypeArchitectureCount =
      prototypes?.results?.reduce((acc, prototype) => {
        const architecture = JSON.parse(prototype.skeleton || '{}');
        return acc + (architecture?.nodes?.length || 0);
      }, 0) || 0;
    stats.architecture.prototypes = {
      count: prototypeArchitectureCount,
    };
  } catch (error) {
    logger.warn(`Error in parsing prototype architecture ${error}`);
  }

  // Query architecture of model
  try {
    const architecture = JSON.parse(model.skeleton || '{}');
    stats.architecture.model = {
      count: architecture?.nodes?.length || 0,
    };
  } catch (error) {
    logger.warn(`Error in parsing architecture of ${error}`);
  }

  // Calculate total architectures in model
  stats.architecture.total = {
    count: (stats.architecture.prototypes?.count || 0) + (stats.architecture.model?.count || 0),
  };

  // Query contributors collaboration
  try {
    const contributors = await permissionService.listAuthorizedUser({
      role: 'model_contributor',
      ref: modelId,
    });
    stats.collaboration.contributors = {
      count: contributors?.length || 0,
    };
  } catch (error) {
    logger.warn(`Error in querying collaborators ${error}`);
  }

  // Query members collaboration
  try {
    const members = await permissionService.listAuthorizedUser({
      role: 'model_member',
      ref: modelId,
    });
    stats.collaboration.members = {
      count: members?.length || 0,
    };
  } catch (error) {
    logger.warn(`Error in querying members ${error}`);
  }

  return stats;
};

/**
 * Query for models with filters
 * @param {Object} filter
 */
const getModels = async (filter) => {
  return Model.find(filter);
};

/**
 * Query for users with filters, pagination and authorized user check
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {fields} [options.fields] - Fields to select
 * @returns {Promise<QueryResult>}
 */
const queryModels = async (filter, options, advanced, userId) => {
  const { sortBy, limit = config.constraints.defaultPageSize, page = 1, fields } = options;

  // Cast id to ObjectId if have
  if (filter.id) {
    filter._id = new mongoose.Types.ObjectId(filter.id);
    delete filter.id;
  }
  if (filter.created_by) {
    filter.created_by = new mongoose.Types.ObjectId(filter.created_by);
  }

  const pipeline = [{ $match: filter }];

  const permissionFilter = {
    $or: [],
  };

  if (!advanced.is_contributor) {
    permissionFilter.$or.push({ visibility: 'public' });
  }

  // List based on permissions
  if (userId) {
    const roles = await permissionService.getUserRoles(userId);
    const roleMap = permissionService.getMappedRoles(roles);
    const objectRoleMap = Object.fromEntries(roleMap.entries());

    permissionFilter.$or.push(
      ...[
        { created_by: userId },
        { created_by: { _id: userId } },
        {
          $expr: {
            $function: {
              body: `function (map, modelId, permission, requesterId, createdById) {
                const stringModelId = modelId.toString();
                const stringCreatedById = createdById.toString();
                return (map && map[stringModelId] && map[stringModelId].includes(permission)) || (requesterId == stringCreatedById);
              }`,
              args: [
                objectRoleMap,
                { $toString: '$_id' },
                PERMISSIONS.READ_MODEL,
                userId || null,
                { $toString: '$created_by' },
              ],
              lang: 'js',
            },
          },
        },
      ]
    );
  }

  if (permissionFilter.$or.length > 0) {
    pipeline.push({ $match: permissionFilter });
  }

  if (fields) {
    pipeline.push({ $project: fields.split(',').reduce((acc, field) => ({ ...acc, [field]: 1 }), {}) });
  }

  const totalResults = await Model.aggregate([...pipeline, { $count: 'count' }]).exec();

  if (sortBy) {
    const [sortField, sortOrder] = sortBy.split(':');
    pipeline.push({ $sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 } });
  }

  const skip = (page - 1) * limit;
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  pipeline.push(
    ...[
      {
        $lookup: {
          from: 'users',
          let: { created_by: '$created_by' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$created_by'],
                },
              },
            },
            {
              $project: {
                id: '$_id',
                image_file: 1,
                name: 1,
                _id: 0,
              },
            },
          ],
          as: 'created_by',
        },
      },
      {
        $unwind: {
          path: '$created_by',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]
  );

  const models = await Model.aggregate(pipeline).exec();

  const totalResultsCount = totalResults.length > 0 ? totalResults[0].count : 0;
  const totalPages = Math.ceil(totalResultsCount / limit);

  return {
    results: models.map((model) => {
      const { _id, ...rest } = model;
      return {
        ...rest,
        id: _id,
      };
    }),
    page,
    limit,
    totalPages,
    totalResults: totalResultsCount,
  };
};

/**
 *
 * @param {string} id
 * @param {string} userId
 * @param {boolean} [includeCreatorFullDetails]
 * @returns {Promise<Model>}
 */
const getModelById = async (id, userId, includeCreatorFullDetails) => {
  const model = await Model.findById(id).populate(
    'created_by',
    includeCreatorFullDetails ? 'id name image_file email' : 'id name image_file'
  );
  if (!model) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Model not found');
  }
  if (model.visibility === 'private') {
    if (!userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
    if (!(await permissionService.hasPermission(userId, PERMISSIONS.READ_MODEL, id))) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  return model;
};

/**
 *
 * @param {string} id
 * @param {Object} updateBody
 * @param {string} actionOwner
 * @returns {Promise<string>}
 */
const updateModelById = async (id, updateBody, actionOwner) => {
  const model = await getModelById(id, actionOwner);
  if (!model) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Model not found');
  }

  updateBody.action_owner = actionOwner;

  if (updateBody.extend && typeof updateBody.extend === 'string') {
    try {
      const parsedExtend = JSON.parse(updateBody.extend);
      updateBody.extend = parsedExtend;
    } catch (error) {
      logger.warn(`Failed while parsing extend field: ${error}`);
    }
  }

  Object.assign(model, updateBody);
  await model.save();
  return model._id;
};

/**
 *
 * @param {string} id
 * @param {string} actionOwner
 * @returns {Promise<void>}
 */
const deleteModelById = async (id, actionOwner) => {
  const model = await getModelById(id, actionOwner);

  if (!model) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Model not found');
  }

  model.action_owner = actionOwner;
  await model.remove();
  await prototypeService.deleteMany({ model_id: id }, actionOwner);
};

/**
 *
 * @param {string} id
 * @param {{
 *  role: 'model_contributor' | 'model_member',
 *  userId: string,
 * }} roleBody
 * @param {string} userId
 * @returns {Promise<void>}
 */
const addAuthorizedUser = async (id, roleBody, userId) => {
  const role = await Role.findOne({
    ref: roleBody.role,
  });
  if (!role) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Role not found');
  }
  // eslint-disable-next-line no-param-reassign
  roleBody.role = role._id;
  if (!(await permissionService.hasPermission(userId, PERMISSIONS.WRITE_MODEL, id))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  await permissionService.assignRoleToUser(roleBody.userId, roleBody.role, id, 'model');
};

/**
 *
 * @param {string} id
 * @param {{
 *  role: 'model_contributor' | 'model_member',
 *  userId: string,
 * }} roleBody
 * @param {string} userId
 * @returns {Promise<void>}
 */
const deleteAuthorizedUser = async (id, roleBody, userId) => {
  const role = await Role.findOne({
    ref: roleBody.role,
  });
  if (!(await permissionService.hasPermission(userId, PERMISSIONS.WRITE_MODEL, id))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  await permissionService.removeRoleFromUser(roleBody.userId, role, id, 'model');
};

const getAccessibleModels = async (userId) => {
  const roles = await permissionService.getUserRoles(userId);
  const roleMap = permissionService.getMappedRoles(roles);
  const objectRoleMap = Object.fromEntries(roleMap.entries());

  const visibleModels = await Model.find({
    $or: [
      { visibility: 'public' },
      { created_by: userId },
      {
        $expr: {
          $function: {
            body: `function (map, modelId, permission, requesterId, createdById) {
            const stringModelId = modelId.toString();
            const stringCreatedById = createdById.toString();
            return (map && map[stringModelId] && map[stringModelId].includes(permission)) || (requesterId == stringCreatedById);
          }`,
            args: [
              objectRoleMap,
              { $toString: '$_id' },
              PERMISSIONS.READ_MODEL,
              userId || null,
              { $toString: '$created_by' },
            ],
            lang: 'js',
          },
        },
      },
    ],
  });

  return visibleModels;
};

/**
 *
 * @param {object} api
 * @returns {object}
 */
const convertToExtendedApiFormat = (api) => {
  const { name, ...rest } = api;
  return {
    ...rest,
    apiName: name,
  };
};

const traverse = (api, callback, prefix = '') => {
  if (api.children) {
    for (const [key, child] of Object.entries(api.children)) {
      traverse(child, callback, `${prefix}.${key}`);
    }
  }
  callback(api, prefix);
};

/**
 *
 * @param {string} apiDataUrl
 * @returns {Promise<{main_api: string; api_version: string; extended_apis: any[]} | undefined>}
 */
const processApiDataUrl = async (apiDataUrl) => {
  try {
    // resolve the correct url incase the apiDataUrl is relative. Eg. /api/v2/data/vehicle.json
    const response = await fetch(fileService.resolveUrl(apiDataUrl));
    const data = await response.json();
    const extendedApis = [];

    const mainApi = Object.keys(data).at(0) || 'Vehicle';

    // Detached wishlist APIs
    traverse(
      data[mainApi],
      (api, prefix) => {
        for (const [key, value] of Object.entries(api.children || {})) {
          if (value.isWishlist) {
            const name = value?.name || `${prefix}.${key}`;
            extendedApis.push(
              convertToExtendedApiFormat({
                ...value,
                name,
              })
            );
            delete api.children[key];
          }
        }
      },
      mainApi
    );

    const result = {
      main_api: mainApi,
    };

    // Check if this is COVESA VSS version
    const versionList = require('../../data/vss.json');
    for (const version of versionList) {
      const file = require(`../../data/${version.name}.json`);
      const isEqual = _.isEqual(file, data);
      if (isEqual) {
        result.api_version = version.name;
        break;
      }
    }

    // If not COVESA VSS version, then add the rest APIs
    if (!result.api_version) {
      traverse(
        data[mainApi],
        (api, prefix) => {
          for (const [key, value] of Object.entries(api.children || {})) {
            const name = value?.name || `${prefix}.${key}`;
            extendedApis.push(
              convertToExtendedApiFormat({
                ...value,
                name,
              })
            );
            delete api.children[key];
          }
        },
        mainApi
      );
    }

    if (extendedApis.length > 0) {
      result.extended_apis = extendedApis;
    }

    return result;
  } catch (error) {
    logger.error(`Error in processing api data: ${error}`);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      error?.message || `Error in processing api data. Please check content of the file again.`
    );
  }
};

module.exports.createModel = createModel;
module.exports.getModels = getModels;
module.exports.queryModels = queryModels;
module.exports.getModelById = getModelById;
module.exports.updateModelById = updateModelById;
module.exports.deleteModelById = deleteModelById;
module.exports.addAuthorizedUser = addAuthorizedUser;
module.exports.deleteAuthorizedUser = deleteAuthorizedUser;
module.exports.getAccessibleModels = getAccessibleModels;
module.exports.processApiDataUrl = processApiDataUrl;
module.exports.getModelStats = getModelStats;
