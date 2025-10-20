// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { objectId, objectIdList } = require('./custom.validation');
const { PERMISSIONS } = require('../config/roles');

const createAsset = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    type: Joi.string().required(),
    data: Joi.any(),
  }),
};

const getAssets = {
  query: Joi.object().keys({
    name: Joi.string(),
    type: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getAsset = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
};

const updateAsset = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      type: Joi.string(),
      data: Joi.any(),
    })
    .min(1),
};

const deleteAsset = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
};

const generateToken = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
};

const addAuthorizedUser = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    userId: Joi.string().required().custom(objectIdList),
    role: Joi.string().valid('read_asset', 'write_asset').required(),
  }),
};

const deleteAuthorizedUser = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    userId: Joi.string().required().custom(objectId),
    role: Joi.string().valid('read_asset', 'write_asset').required(),
  }),
};

module.exports = {
  createAsset,
  getAssets,
  updateAsset,
  getAsset,
  deleteAsset,
  generateToken,
  addAuthorizedUser,
  deleteAuthorizedUser,
};
