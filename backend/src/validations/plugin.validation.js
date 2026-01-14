// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { objectId, slug } = require('./custom.validation');

const createPlugin = {
  body: Joi.object().keys({
    name: Joi.string().required().max(255),
    image: Joi.string().allow(''),
    description: Joi.string().allow(''),
    is_internal: Joi.boolean().required(),
    url: Joi.string().uri().when('is_internal', { is: true, then: Joi.string().allow(''), otherwise: Joi.required() }),
    config: Joi.any(),
    type: Joi.string().valid('prototype_function', 'deploy').allow(null, ''),
  }),
};

const listPlugins = {
  query: Joi.object().keys({
    name: Joi.string(),
    slug: Joi.string(),
    is_internal: Joi.boolean(),
    type: Joi.string().valid('prototype_function', 'deploy'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    fields: Joi.string(),
  }),
};

const getPlugin = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const getPluginBySlug = {
  params: Joi.object().keys({
    slug: Joi.string().required(),
  }),
};

const updatePlugin = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().max(255),
      slug: Joi.forbidden(),
      image: Joi.string().allow(''),
      description: Joi.string().allow(''),
      is_internal: Joi.boolean(),
      url: Joi.string().allow(''),
      config: Joi.any(),
      type: Joi.string().valid('prototype_function', 'deploy').allow(null, ''),
    })
    .min(1),
};

const uploadInternal = {
  params: Joi.object().keys({
    slug: Joi.string().required(),
  }),
};

module.exports = {
  createPlugin,
  listPlugins,
  getPlugin,
  getPluginBySlug,
  updatePlugin,
  uploadInternal,
};


