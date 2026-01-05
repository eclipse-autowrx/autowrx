// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { objectId } = require('./custom.validation');

const relationshipSchema = Joi.object().keys({
  name: Joi.string().required().trim(),
  type: Joi.string().valid('one-to-one', 'one-to-many', 'many-to-many').required(),
  target_api: Joi.string().required(),
  description: Joi.string().trim().allow(''),
});

const listViewConfigSchema = Joi.object().keys({
  title: Joi.string().trim().allow('', null),
  description: Joi.string().trim().allow('', null),
  type: Joi.string().trim().allow('', null),
}).allow(null);

const createPluginAPI = {
  body: Joi.object().keys({
    code: Joi.string().required().trim().lowercase().max(100),
    name: Joi.string().required().trim().max(255),
    description: Joi.string().trim().allow(''),
    type: Joi.string().valid('tree', 'list', 'graph').required(),
    schema: Joi.string().required().trim(),
    id_format: Joi.string().trim().allow('', null),
    relationships: Joi.array().items(relationshipSchema).default([]),
    tree_config: Joi.any().allow(null),
    list_view_config: listViewConfigSchema,
    schema_definition: Joi.any(),
    version: Joi.string().default('1.0.0'),
    is_active: Joi.boolean().default(true),
  }),
};

const updatePluginAPI = {
  params: Joi.object().keys({
    pluginApiId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      code: Joi.string().trim().lowercase().max(100),
      name: Joi.string().trim().max(255),
      description: Joi.string().trim().allow(''),
      type: Joi.string().valid('tree', 'list', 'graph'),
      schema: Joi.string().trim(),
      id_format: Joi.string().trim().allow('', null),
      relationships: Joi.array().items(relationshipSchema),
      tree_config: Joi.any().allow(null),
      list_view_config: listViewConfigSchema,
      schema_definition: Joi.any(),
      version: Joi.string(),
      is_active: Joi.boolean(),
    })
    .min(1),
};

const getPluginAPI = {
  params: Joi.object().keys({
    pluginApiId: Joi.string().custom(objectId).required(),
  }),
};

const deletePluginAPI = {
  params: Joi.object().keys({
    pluginApiId: Joi.string().custom(objectId).required(),
  }),
};

const listPluginAPIs = {
  query: Joi.object().keys({
    code: Joi.string().trim().lowercase(),
    type: Joi.string().valid('tree', 'list', 'graph'),
    is_active: Joi.boolean(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

module.exports = {
  createPluginAPI,
  updatePluginAPI,
  getPluginAPI,
  deletePluginAPI,
  listPluginAPIs,
};

