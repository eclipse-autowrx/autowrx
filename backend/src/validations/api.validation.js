// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { objectId, jsonString } = require('./custom.validation');

const createApi = {
  body: Joi.object().keys({
    model: Joi.string().required().custom(objectId),
    cvi: Joi.string().required().custom(jsonString),
  }),
};

const getApi = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const getApiByModelId = {
  params: Joi.object().keys({
    modelId: Joi.string().custom(objectId),
  }),
};

const updateApi = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      model: Joi.string().custom(objectId),
      cvi: Joi.string().custom(jsonString),
    })
    .min(1),
};

const deleteApi = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const getVSSVersion = {
  params: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

module.exports = {
  createApi,
  getApi,
  getApiByModelId,
  updateApi,
  deleteApi,
  getVSSVersion,
};
