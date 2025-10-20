// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const permissionService = require('./permission.service');
const { PERMISSIONS, RESOURCES } = require('../config/roles');
const { Role } = require('../models');
const Asset = require('../models/asset.model');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const logger = require('../config/logger');
const { isValidObjectId } = require('mongoose');

/**
 *
 * @param {object} data
 * @returns {Promise<import('../models/asset.model').Asset>}
 */
const createAsset = (data) => {
  return Asset.create(data);
};

/**
 *
 * @param {object} filter
 * @param {object} options
 * @param {string} options.sortBy
 * @param {number} options.limit
 * @param {number} options.page
 * @param {string} [options.userId]
 */
const queryAssets = async (filter, options, userId) => {
  const finalFilter = {
    $and: [],
  };

  if (filter.name) {
    finalFilter.$and.push({
      name: new RegExp(filter.name, 'i'),
    });
  }

  if (filter.type) {
    finalFilter.$and.push({
      type: {
        $in: filter.type
          .split(',')
          .map((type) => type.trim())
          .filter(Boolean),
      },
    });
  }

  if (userId) {
    let accessibleIds = [];
    try {
      const roles = permissionService.getMappedRoles(await permissionService.getUserRoles(userId));
      roles?.forEach?.((value, key) => {
        if (!Array.isArray(value)) {
          logger.error(`Unexpected role value for ${key}: ${value}`);
        } else if (
          (value.includes(PERMISSIONS.READ_ASSET) || value.includes(PERMISSIONS.WRITE_ASSET)) &&
          isValidObjectId(key)
        ) {
          accessibleIds.push(key);
        }
      });
    } catch (error) {
      logger.error(`Error while find accessible assetIds for user ${userId}: ${error}`);
    }

    finalFilter.$and.push({
      $or: [
        {
          _id: {
            $in: accessibleIds,
          },
        },
        {
          created_by: userId,
        },
      ],
    });
  }

  return Asset.paginate(finalFilter, options);
};

/**
 *
 * @param {string} assetId
 */
const getAssetById = (assetId) => {
  return Asset.findById(assetId);
};

/**
 *
 * @param {string} assetId
 * @param {{
 * name?:string
 * type?:string
 * data?:any}} assetBody
 */
const updateAsset = (assetId, assetBody) => {
  return Asset.findOneAndUpdate(
    {
      _id: assetId,
    },
    assetBody
  );
};

/**
 *
 * @param {string} assetId
 */
const deleteAsset = (assetId) => {
  return Asset.findOneAndDelete({
    _id: assetId,
  });
};

/**
 *
 * @param {string} id
 * @param {{
 *  role: 'read_asset' | 'write_asset',
 *  userId: string,
 * }} roleBody
 * @returns {Promise<void>}
 */
const addAuthorizedUser = async (id, roleBody) => {
  const role = await Role.findOne({
    ref: roleBody.role,
  });
  if (!role) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Role not found');
  }
  // eslint-disable-next-line no-param-reassign
  roleBody.role = role._id;
  await permissionService.assignRoleToUser(roleBody.userId, roleBody.role, id);
};

/**
 *
 * @param {string} id
 * @param {{
 *  role: 'read_asset' | 'write_asset',
 *  userId: string,
 * }} roleBody
 * @param {string} userId
 * @returns {Promise<void>}
 */
const deleteAuthorizedUser = async (id, roleBody) => {
  const role = await Role.findOne({
    ref: roleBody.role,
  });
  if (!role) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Role not found');
  }
  await permissionService.removeRoleFromUser(roleBody.userId, role, id);
};

module.exports = {
  createAsset,
  queryAssets,
  updateAsset,
  getAssetById,
  deleteAsset,
  addAuthorizedUser,
  deleteAuthorizedUser,
};
