// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { UserRole, Model, Prototype, Role, Asset } = require('../models');
const ApiError = require('../utils/ApiError');
const roleModel = require('../models/role.model');
const { PERMISSIONS, ROLES } = require('../config/roles');
const { getRolesClient } = require('../config/rolesV2');

/**
 *
 * @param {{
 *  role: 'model_contributor' | 'model_member',
 *  ref: string,
 *  refType: 'model' | 'prototype',
 * }} condition
 * @returns {Promise<import('../models/user.model').User>}
 */
const listAuthorizedUser = async ({ role, ...condition }) => {
  const roleObject = await Role.findOne({ ref: role });
  if (!roleObject) {
    return [];
  }
  const userRoles = await UserRole.find({
    ...condition,
    role: roleObject._id,
  }).populate('user', 'id image_file name email');
  return userRoles.reduce((acc, userRole) => {
    if (userRole && userRole.user) {
      acc.push(userRole.user);
    }
    return acc;
  }, []);
};

const getRoles = async () => {
  return roleModel.find();
};

const assignRoleToUser = async (user, role, ref) => {
  if (await UserRole.checkExist(user, role, ref)) {
    return;
  }
  return UserRole.create({ user, role, ref });
};

const removeRoleFromUser = async (user, role, ref) => {
  return UserRole.deleteOne({ user, role, ref });
};

const getUserRoles = async (user, filter) => {
  return UserRole.find({ user, ...filter }).populate('role');
};

const getRoleUsers = async () => {
  return UserRole.aggregate([
    {
      $group: {
        _id: '$role',
        users: { $push: '$user' },
      },
    },
    {
      $lookup: {
        from: 'roles',
        localField: '_id',
        foreignField: '_id',
        as: 'role',
      },
    },

    {
      $unwind: {
        path: '$role',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'users',
        foreignField: '_id',
        as: 'users',
      },
    },
    {
      $addFields: {
        role: {
          id: '$role._id',
        },
        users: {
          $map: {
            input: '$users',
            as: 'user',
            in: {
              id: '$$user._id',
              name: '$$user.name',
              email: '$$user.email',
              email_verified: '$$user.email_verified',
              image_file: '$$user.image_file',
              provider: '$$user.provider',
              provider_data: '$$user.provider_data',
              createdAt: '$$user.createdAt',
              updatedAt: '$$user.updatedAt',
            },
          },
        },
      },
    },
    {
      $unset: ['_id', 'users._id', 'role._id'],
    },
  ]);
};

// Create a map for better search performance
const getMappedRoles = (roles) => {
  const map = new Map();
  roles.forEach((role) => {
    const roleRef = String(role.ref || '*');

    if (map.has(roleRef)) {
      let existingRolePermissions = map.get(roleRef);
      if (!Array.isArray(existingRolePermissions)) {
        existingRolePermissions = [];
      } else {
        const newArray = existingRolePermissions.concat(role?.role?.permissions || []);
        existingRolePermissions = Array.from(new Set(newArray));
      }
      map.set(roleRef, existingRolePermissions);
    } else {
      map.set(roleRef, role?.role?.permissions || []);
    }
  });
  return map;
};

// Check if the role map contains the permission
const containsPermission = (roleMap, permission, id) => {
  const stringId = String(id);
  // In case user is admin, have access to all type of resources
  const firstCondition = roleMap.has('*') && roleMap.get('*').includes(permission);
  // In case user has access to specific resource
  const secondCondition = roleMap.has(stringId) && roleMap.get(stringId).includes(permission);
  return firstCondition || secondCondition;
};

const check = async (userId, permission, id) => {
  const userRoles = await getUserRoles(userId);
  const roleMap = getMappedRoles(userRoles);
  return containsPermission(roleMap, permission, id);
};

const checkModelPermission = (model, userId, permission) => {
  if (String(model.created_by) === String(userId)) {
    return true;
  }
  return check(userId, permission, model._id);
};

const checkPrototypePermission = (prototype, userId, permission) => {
  if (String(prototype.created_by) === String(userId) || String(prototype.model_id?.created_by) === String(userId)) {
    return true;
  }

  return check(userId, permission, prototype.model_id._id);
};

const checkAssetPermission = (asset, userId, permission) => {
  if (String(asset.created_by) === String(userId)) {
    return true;
  }
  return check(userId, permission, asset._id);
};

/**
 *
 * @param {string} userId
 * @param {string} [id]
 * @param {string} permission
 * @param {string} [type]
 * @returns {Promise<boolean>}
 */
const hasPermission = async (userId, permission, id, type) => {
  if (!userId) {
    return false;
  }

  if (!id) {
    return check(userId, permission);
  }

  if (type === 'asset') {
    const asset = await Asset.findById(id).select('created_by');
    if (!asset) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Resource not found');
    }
    return checkAssetPermission(asset, userId, permission);
  }

  const model = await Model.findById(id).select('created_by');
  const prototype = await Prototype.findById(id).populate('model_id').select('created_by model_id');

  if (model) {
    return checkModelPermission(model, userId, permission);
  }

  if (prototype) {
    return checkPrototypePermission(prototype, userId, permission);
  }

  throw new ApiError(httpStatus.NOT_FOUND, 'Resource not found');
};

const getPermissions = () => {
  return Role.find({
    not_feature: {
      $ne: true,
    },
  });
};

/**
 *
 * @param {string} userId
 * @returns {Promise<string[] | '*'>}
 */
const listReadableModelIds = async (userId) => {
  // If user is not logged in return public models
  if (!userId) {
    return (await Model.find({ visibility: 'public' }).select('_id')).map((model) => String(model._id));
  }

  const userRoles = await getUserRoles(userId);
  const roleMap = getMappedRoles(userRoles);

  // If user has permission to read all models return '*'
  if (roleMap.has('*') && roleMap.get('*').includes(PERMISSIONS.READ_MODEL)) {
    return '*';
  }

  const results = new Set();

  // Add authorized models
  roleMap.forEach((value, key) => {
    if ((value || []).includes(PERMISSIONS.READ_MODEL)) {
      results.add(key);
    }
  });
  // Add own models
  const ownModels = await Model.find({ created_by: userId }).select('_id');
  ownModels.forEach((model) => {
    results.add(String(model._id));
  });
  // Add public models
  const publicModels = await Model.find({ visibility: 'public' }).select('_id');
  publicModels.forEach((model) => {
    results.add(String(model._id));
  });

  return Array.from(results);
};

/**
 *
 * @param {string} userId
 * @param {string} modelId
 * @returns {Promise<boolean>}
 */
const canAccessModel = async (userId, modelId) => {
  const model = await Model.findById(modelId);
  if (!model) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Model not found');
  }
  if (model.visibility === 'public') return true;
  return hasPermission(userId, PERMISSIONS.READ_MODEL, modelId);
};

// V2 services logic
/**
 *
 * @param {{
 *  sub: string,
 *  act: string,
 *  obj?: string,
 * }} query
 * @returns {Promise<boolean>}
 */
const hasPermissionV2 = async (query) => {
  const { sub, act, obj } = query || {};
  const rolesClient = getRolesClient();

  const params = [sub, act, obj].filter(Boolean);

  const allowed = await rolesClient.enforce(...params);
  return allowed;
};

/**
 *
 * @param {{
 *  sub: string,
 *  act: string,
 *  obj?: string,
 * }} policy
 * @returns {Promise<void>}
 */
const assignRoleToUserV2 = async (policy) => {
  const { sub, act, obj } = policy || {};
  const rolesClient = getRolesClient();

  const success = await rolesClient.addPolicy(sub, act, obj);
  if (!success) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to assign role to user');
  }
};

module.exports.listAuthorizedUser = listAuthorizedUser;
module.exports.assignRoleToUser = assignRoleToUser;
module.exports.getUserRoles = getUserRoles;
module.exports.getRoleUsers = getRoleUsers;
module.exports.hasPermission = hasPermission;
module.exports.removeRoleFromUser = removeRoleFromUser;
module.exports.getMappedRoles = getMappedRoles;
module.exports.containsPermission = containsPermission;
module.exports.getRoles = getRoles;
module.exports.getPermissions = getPermissions;
module.exports.listReadableModelIds = listReadableModelIds;
module.exports.canAccessModel = canAccessModel;

// V2 services
module.exports.hasPermissionV2 = hasPermissionV2;
module.exports.assignRoleToUserV2 = assignRoleToUserV2;
