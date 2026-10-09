// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { password, objectId } = require('./custom.validation');
const { roles } = require('../config/roles');

const rolesSchema = Joi.object().keys({
  model_contributor: Joi.array().items(Joi.string()).default([]),
  tenant_admin: Joi.array().items(Joi.string()).default([]),
  model_member: Joi.array().items(Joi.string()).default([]),
});

const userInfo = Joi.object({
  email: Joi.string().email(),
  providerId: Joi.string(),
});

const createUser = {
  body: Joi.object().keys({
    name: Joi.string().required().trim(),
    email: Joi.string().required().email().trim(),
    password: Joi.string().custom(password).optional(), // Always allow password in validation, check at runtime
    role: Joi.string()
      .valid(...roles)
      .default('user'),
    roles: rolesSchema,
    email_verified: Joi.boolean().default(false),
    provider: Joi.string().trim().default('email'),
    image_file: Joi.string().optional().trim(),
    uid: Joi.string().optional(),
    provider_data: Joi.array().items(userInfo),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    // the UI always sends search= (empty when the box is clear)
    search: Joi.string().allow(''),
    id: Joi.string(),
    includeFullDetails: Joi.boolean().default(false),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    includeFullDetails: Joi.boolean().default(false),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      name: Joi.string(),
      password: Joi.string().custom(password).optional(), // Always allow password in validation, check at runtime
      role: Joi.string().valid(...roles),
    })
    .min(1),
};

const updateSelfUser = {
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      name: Joi.string(),
      password: Joi.string().custom(password).optional(), // Always allow password in validation, check at runtime
      is_email_verified: Joi.boolean(),
      image_file: Joi.string(),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateSelfUser,
  updateUser,
  deleteUser,
};
