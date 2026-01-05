// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { objectId } = require('./custom.validation');

const itemRelationshipSchema = Joi.object().keys({
  relationship_name: Joi.string().required(),
  target_item_id: Joi.string().required(),
});

const itemSchema = Joi.object().keys({
  id: Joi.string().required(),
  path: Joi.string().trim().allow(''),
  parent_id: Joi.string().allow(null, ''),
  relationships: Joi.array().items(itemRelationshipSchema).default([]),
}).unknown(true); // Allow dynamic fields based on PluginAPI attributes

const createPluginApiInstance = {
  body: Joi.object().keys({
    plugin_api: Joi.string().custom(objectId).required(),
    plugin_api_code: Joi.string().trim().lowercase().required(),
    scope: Joi.string().valid('system', 'user').required(),
    name: Joi.string().required().trim().max(255),
    description: Joi.string().trim().allow(''),
    avatar: Joi.string().trim().allow(''),
    provider_url: Joi.string().uri().trim().allow(''),
    data: Joi.object()
      .keys({
        items: Joi.array().items(itemSchema).default([]),
        metadata: Joi.any().default({}),
      })
      .required(),
  }),
};

const updatePluginApiInstance = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim().max(255),
      description: Joi.string().trim().allow(''),
      avatar: Joi.string().trim().allow(''),
      provider_url: Joi.string().uri().trim().allow(''),
      data: Joi.object().keys({
        items: Joi.array().items(itemSchema),
        metadata: Joi.any(),
      }),
    })
    .min(1),
};

const getPluginApiInstance = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const deletePluginApiInstance = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const listPluginApiInstances = {
  query: Joi.object().keys({
    plugin_api_code: Joi.string().trim().lowercase(),
    scope: Joi.string().valid('system', 'user'),
    owner: Joi.string().custom(objectId),
    name: Joi.string().trim(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const addInstanceItem = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      item: itemSchema.required(),
    })
    .required(),
};

const updateInstanceItem = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
    itemId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      item: itemSchema.required(),
    })
    .required(),
};

const removeInstanceItem = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
    itemId: Joi.string().required(),
  }),
};

module.exports = {
  createPluginApiInstance,
  updatePluginApiInstance,
  getPluginApiInstance,
  deletePluginApiInstance,
  listPluginApiInstances,
  addInstanceItem,
  updateInstanceItem,
  removeInstanceItem,
};

