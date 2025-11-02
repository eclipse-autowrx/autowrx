// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { visibilityTypes } = require('../config/enums');
const { jsonString, slug, objectId } = require('./custom.validation');

const createModel = {
  body: Joi.object().keys({
    extend: Joi.any(),
    custom_apis: Joi.string().custom(jsonString),
    api_version: Joi.string(),
    api_data_url: Joi.string(),
    cvi: Joi.string().custom(jsonString),
    extended_apis: Joi.array().items(Joi.any()),
    main_api: Joi.string().required().max(255),
    model_home_image_file: Joi.string()
      .allow('')
      .default('/images/default-model-image.png'),
    detail_image_file: Joi.string().allow(''),
    model_files: Joi.object(),
    name: Joi.string().required().max(255),
    visibility: Joi.string()
      .valid(...Object.values(visibilityTypes))
      .default('private'),
    vehicle_category: Joi.string().default('Passenger cars').max(255),
    property: Joi.string().custom(jsonString),
    skeleton: Joi.string().custom(jsonString),
    tags: Joi.array().items(
      Joi.object().keys({
        title: Joi.string().required(),
        description: Joi.string().allow(''),
      })
    ),
    state: Joi.string().max(255).default('draft'),
    model_template_id: Joi.string().custom(objectId).allow(null),
    custom_template: Joi.any(),
  }),
};

const listAllModels = {
  query: Joi.object().keys({
    fields: Joi.string().allow(''),
  }),
};

const listModels = {
  query: Joi.object().keys({
    name: Joi.string(),
    visibility: Joi.string().valid(...Object.values(visibilityTypes)),
    tenant_id: Joi.string(),
    vehicle_category: Joi.string(),
    main_api: Joi.string(),
    fields: Joi.string(),
    id: Joi.string().custom(objectId),
    created_by: Joi.string().custom(objectId),
    is_contributor: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const updateModel = {
  body: Joi.object()
    .keys({
      extend: Joi.any(),
      custom_apis: Joi.string().custom(jsonString),
      api_version: Joi.string(),
      cvi: Joi.string().custom(jsonString),
      main_api: Joi.string().max(255),
      model_home_image_file: Joi.string().allow(''),
      detail_image_file: Joi.string().allow(''),
      model_files: Joi.object(),
      name: Joi.string().max(255),
      visibility: Joi.string().valid(...Object.values(visibilityTypes)),
      vehicle_category: Joi.string().max(255),
      property: Joi.string().custom(jsonString),
      skeleton: Joi.string().custom(jsonString),
      tags: Joi.array().items(
        Joi.object().keys({
          title: Joi.string().required(),
          description: Joi.string().allow(''),
        })
      ),
      state: Joi.string().max(255),
      model_template_id: Joi.string().custom(objectId).allow(null),
      custom_template: Joi.any(),
    })
    .min(1),
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const getModel = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const deleteModel = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const addAuthorizedUser = {
  body: Joi.object().keys({
    userId: Joi.string().required(),
    role: Joi.string().valid('model_contributor', 'model_member'),
  }),
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const deleteAuthorizedUser = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    userId: Joi.string().custom(objectId),
    role: Joi.string().valid('model_contributor', 'model_member'),
  }),
};

const getApiByModelId = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const replaceApi = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    api_data_url: Joi.string().required(),
  }),
};

module.exports = {
  createModel,
  listModels,
  updateModel,
  getModel,
  deleteModel,
  addAuthorizedUser,
  deleteAuthorizedUser,
  getApiByModelId,
  replaceApi,
  listAllModels,
};
