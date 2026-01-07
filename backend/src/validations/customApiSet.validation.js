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
}).unknown(true); // Allow dynamic fields based on CustomApiSchema attributes

const createCustomApiSet = {
  body: Joi.object().keys({
    custom_api_schema: Joi.string().custom(objectId).required(),
    custom_api_schema_code: Joi.string().trim().lowercase().required(),
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

const updateCustomApiSet = {
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

const getCustomApiSet = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const deleteCustomApiSet = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const listCustomApiSets = {
  query: Joi.object().keys({
    custom_api_schema_code: Joi.string().trim().lowercase(),
    scope: Joi.string().valid('system', 'user'),
    owner: Joi.string().custom(objectId),
    name: Joi.string().trim(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const addSetItem = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      item: itemSchema.required(),
    })
    .required(),
};

const updateSetItem = {
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

const removeSetItem = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
    itemId: Joi.string().required(),
  }),
};

module.exports = {
  createCustomApiSet,
  updateCustomApiSet,
  getCustomApiSet,
  deleteCustomApiSet,
  listCustomApiSets,
  addSetItem,
  updateSetItem,
  removeSetItem,
};

