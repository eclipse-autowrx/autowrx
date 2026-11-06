// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const mongoose = require('mongoose');

const { isValidObjectId } = mongoose;
const { UserRole, Model, Prototype, Role, Asset } = require('../models');
const ApiError = require('../utils/ApiError');
const roleModel = require('../models/role.model');
const { PERMISSIONS } = require('../config/roles');
const { visibilityTypes, publiclyVisibleVisibilities, prototypeVisibilityTypes } = require('../config/enums');
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

const isPrivatePrototype = (prototype) => prototype?.visibility === prototypeVisibilityTypes.PRIVATE;

const checkPrototypePermission = (prototype, userId, permission) => {
  if (String(prototype.created_by) === String(userId) || String(prototype.model_id?.created_by) === String(userId)) {
    return true;
  }

  // Private prototypes are limited to the creator, the model owner and global admins;
  // model-scoped roles (contributor/member) do not apply.
  if (isPrivatePrototype(prototype)) {
    return check(userId, PERMISSIONS.ADMIN);
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

  // Non-ObjectId refs (e.g. frontend preview sentinel "preview-template") are not resources.
  if (!isValidObjectId(id)) {
    return false;
  }

  if (type === 'asset') {
    const asset = await Asset.findById(id).select('created_by');
    if (!asset) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Resource not found');
    }
    return checkAssetPermission(asset, userId, permission);
  }

  const model = await Model.findById(id).select('created_by');
  const prototype = await Prototype.findById(id).populate('model_id').select('created_by model_id visibility');

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
  // If user is not logged in return publicly visible models
  if (!userId) {
    return (await Model.find({ visibility: { $in: publiclyVisibleVisibilities } }).select('_id')).map((model) =>
      String(model._id),
    );
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
  // Add publicly visible models
  const publicModels = await Model.find({ visibility: { $in: publiclyVisibleVisibilities } }).select('_id');
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
  if (publiclyVisibleVisibilities.includes(model.visibility)) return true;
  return hasPermission(userId, PERMISSIONS.READ_MODEL, modelId);
};

/**
 * Whether an authenticated user may create a prototype on the given model.
 * Owners/contributors with WRITE_MODEL always pass; non-owners pass only when visibility is editable.
 *
 * @param {string} userId
 * @param {string} modelId
 * @returns {Promise<boolean>}
 */
const canCreatePrototypeOnModel = async (userId, modelId) => {
  if (!userId) {
    return false;
  }

  if (await hasPermission(userId, PERMISSIONS.WRITE_MODEL, modelId)) {
    return true;
  }

  const model = await Model.findById(modelId).select('visibility');
  if (!model) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Model not found');
  }

  return model.visibility === visibilityTypes.EDITABLE;
};

/**
 * Whether a user may update the given prototype.
 * - Creator, model owner and global admins may always update it, including its visibility.
 * - Private prototypes: nobody else.
 * - Public prototypes: any signed-in user who can read the model may edit the content,
 *   but only the roles above may change the visibility, and editors_choice still needs WRITE_MODEL.
 *
 * @param {string} userId
 * @param {string} prototypeId
 * @param {{ changesVisibility?: boolean, changesEditorsChoice?: boolean }} [options]
 * @returns {Promise<boolean>}
 */
const canUpdatePrototype = async (userId, prototypeId, { changesVisibility = false, changesEditorsChoice = false } = {}) => {
  if (!userId) {
    return false;
  }

  const prototype = await Prototype.findById(prototypeId)
    .populate('model_id', 'created_by visibility')
    .select('created_by model_id visibility');
  if (!prototype || !prototype.model_id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Prototype not found');
  }

  // PERMISSIONS.ADMIN is held by no model-scoped role, so this resolves to creator / model owner / admin.
  if (await checkPrototypePermission(prototype, userId, PERMISSIONS.ADMIN)) {
    return true;
  }

  if (isPrivatePrototype(prototype) || changesVisibility) {
    return false;
  }

  const model = prototype.model_id;
  if (changesEditorsChoice) {
    return check(userId, PERMISSIONS.WRITE_MODEL, model._id);
  }
  if (publiclyVisibleVisibilities.includes(model.visibility)) {
    return true;
  }
  return check(userId, PERMISSIONS.READ_MODEL, model._id);
};

/**
 * Mongo filter that hides private prototypes from users who may not see them.
 * Returns null when no restriction applies (global admins).
 *
 * @param {string} [userId]
 * @returns {Promise<object | null>}
 */
const buildPrototypeVisibilityFilter = async (userId) => {
  const notPrivate = { visibility: { $ne: prototypeVisibilityTypes.PRIVATE } };
  if (!userId) {
    return notPrivate;
  }

  if (await check(userId, PERMISSIONS.ADMIN)) {
    return null;
  }

  const ownModelIds = (await Model.find({ created_by: userId }).select('_id')).map((model) => model._id);
  return {
    $or: [notPrivate, { created_by: new mongoose.Types.ObjectId(userId) }, { model_id: { $in: ownModelIds } }],
  };
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
module.exports.canCreatePrototypeOnModel = canCreatePrototypeOnModel;
module.exports.canUpdatePrototype = canUpdatePrototype;
module.exports.buildPrototypeVisibilityFilter = buildPrototypeVisibilityFilter;

// V2 services
module.exports.hasPermissionV2 = hasPermissionV2;
module.exports.assignRoleToUserV2 = assignRoleToUserV2;
