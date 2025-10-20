// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { password } = require('./custom.validation');

const authorize = {
  body: Joi.object()
    .keys({
      permissions: Joi.string(),
      permissionQuery: Joi.string(),
      userId: Joi.string(),
    })
    .min(1),
};

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    image_file: Joi.string().allow(''),
    provider: Joi.string().allow(''),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  query: Joi.object().keys({
    return_raw_token: Joi.boolean().default(false),
  }),
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

const legacyRegister = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    pwd: Joi.string().required().custom(password),
    name: Joi.string().required(),
  }),
};

const sso = {
  body: Joi.object().keys({
    msAccessToken: Joi.string().required(),
  }),
};

module.exports = {
  authorize,
  register,
  login,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  legacyRegister,
  sso,
};
