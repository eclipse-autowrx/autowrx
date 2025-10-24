// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createSiteConfig = {
  body: Joi.object().keys({
    key: Joi.string().required().trim().max(255),
    scope: Joi.string().valid('site', 'user', 'model', 'prototype', 'api').default('site'),
    target_id: Joi.string().when('scope', {
      is: Joi.string().valid('user', 'model', 'prototype', 'api'),
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    value: Joi.any().required(),
    valueType: Joi.string().valid('string', 'number', 'boolean', 'object', 'array', 'date', 'color', 'image_url'),
    secret: Joi.boolean().default(false),
    description: Joi.string().trim().max(500).allow(''),
    category: Joi.string().trim().max(100).default('general'),
  }),
};

const getSiteConfigs = {
  query: Joi.object().keys({
    scope: Joi.string().valid('site', 'user', 'model', 'prototype', 'api').default('site'),
    target_id: Joi.string().when('scope', {
      is: Joi.string().valid('user', 'model', 'prototype', 'api'),
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    secret: Joi.boolean(),
    category: Joi.string().trim(),
    key: Joi.string().trim(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getSiteConfig = {
  params: Joi.object().keys({
    siteConfigId: Joi.string().custom(objectId),
  }),
};

const getSiteConfigByKey = {
  params: Joi.object().keys({
    key: Joi.string().required().trim(),
  }),
};

const updateSiteConfig = {
  params: Joi.object().keys({
    siteConfigId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      value: Joi.any(),
      valueType: Joi.string().valid('string', 'number', 'boolean', 'object', 'array', 'date', 'color', 'image_url'),
      secret: Joi.boolean(),
      description: Joi.string().trim().max(500).allow(''),
      category: Joi.string().trim().max(100),
    })
    .min(1),
};

const updateSiteConfigByKey = {
  params: Joi.object().keys({
    key: Joi.string().required().trim(),
  }),
  body: Joi.object()
    .keys({
      value: Joi.any(),
      valueType: Joi.string().valid('string', 'number', 'boolean', 'object', 'array', 'date', 'color', 'image_url'),
      secret: Joi.boolean(),
      description: Joi.string().trim().max(500).allow(''),
      category: Joi.string().trim().max(100),
    })
    .min(1),
};

const deleteSiteConfig = {
  params: Joi.object().keys({
    siteConfigId: Joi.string().custom(objectId),
  }),
};

const deleteSiteConfigByKey = {
  params: Joi.object().keys({
    key: Joi.string().required().trim(),
  }),
};

const getSiteConfigsByKeys = {
  body: Joi.object().keys({
    keys: Joi.array().items(Joi.string().trim()).min(1).required(),
  }),
};

const bulkUpsertSiteConfigs = {
  body: Joi.object().keys({
    configs: Joi.array()
      .items(
        Joi.object().keys({
          key: Joi.string().required().trim().max(255),
          scope: Joi.string().valid('site', 'user', 'model', 'prototype', 'api').default('site'),
          target_id: Joi.string().when('scope', {
            is: Joi.string().valid('user', 'model', 'prototype', 'api'),
            then: Joi.required(),
            otherwise: Joi.forbidden(),
          }),
          value: Joi.any().required(),
          valueType: Joi.string().valid('string', 'number', 'boolean', 'object', 'array', 'date', 'color', 'image_url'),
          secret: Joi.boolean().default(false),
          description: Joi.string().trim().max(500).allow(''),
          category: Joi.string().trim().max(100).default('general'),
        })
      )
      .min(1)
      .required(),
  }),
};

const getConfigsByScope = {
  params: Joi.object().keys({
    scope: Joi.string().valid('site', 'user', 'model', 'prototype', 'api').required(),
    target_id: Joi.string().when('scope', {
      is: Joi.string().valid('user', 'model', 'prototype', 'api'),
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
  }),
  query: Joi.object().keys({
    secret: Joi.boolean(),
    category: Joi.string().trim(),
    key: Joi.string().trim(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

module.exports = {
  createSiteConfig,
  getSiteConfigs,
  getSiteConfig,
  getSiteConfigByKey,
  updateSiteConfig,
  updateSiteConfigByKey,
  deleteSiteConfig,
  deleteSiteConfigByKey,
  getSiteConfigsByKeys,
  bulkUpsertSiteConfigs,
  getConfigsByScope,
};
