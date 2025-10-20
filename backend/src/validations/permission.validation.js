// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { objectId } = require('./custom.validation');

const assignRoleToUser = {
  body: Joi.object().keys({
    user: Joi.string().required(), // Assuming this is a user ID
    role: Joi.string().required(), // Assuming this is a role ID
    ref: Joi.string(), // Assuming this is a reference ID
  }),
};

const getUserRoles = {
  params: Joi.object().keys({
    user: Joi.string().required(), // Assuming this is a user ID
  }),
};

const getRoleUsers = {
  params: Joi.object().keys({
    role: Joi.string().required(), // Assuming this is a role ID
  }),
};

const getSelfUsers = {
  query: Joi.object().keys({
    permission: Joi.string(),
  }),
};

const hasPermission = {
  query: Joi.object().keys({
    permissions: Joi.string(),
  }),
};

const getPermissions = {
  query: Joi.object().keys({
    permissions: Joi.string(),
  }),
};

const removeRoleFromUser = {
  query: Joi.object().keys({
    user: Joi.string().required().custom(objectId),
    role: Joi.string().required().custom(objectId),
  }),
};

module.exports = {
  assignRoleToUser,
  getUserRoles,
  getRoleUsers,
  getSelfUsers,
  hasPermission,
  getPermissions,
  removeRoleFromUser,
};
