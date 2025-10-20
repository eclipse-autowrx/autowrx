// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createExtendedApi = {
  body: Joi.object().keys({
    apiName: Joi.string().required(),
    model: Joi.string().custom(objectId).required(),
    skeleton: Joi.string().optional(),
    type: Joi.string(),
    datatype: Joi.alternatives().conditional('type', {
      is: 'branch',
      then: Joi.string().allow(null).optional(),
      otherwise: Joi.string().required(),
    }),
    description: Joi.string().allow('').default(''),
    tags: Joi.array().items(
      Joi.object().keys({
        title: Joi.string().required(),
        description: Joi.string().allow(''),
      })
    ),
    isWishlist: Joi.boolean().default(false),
    unit: Joi.string().allow('', null),
    min: Joi.number(),
    max: Joi.number(),
    allowed: Joi.array().items(Joi.any()),
    comment: Joi.string(),
    default: Joi.any(),
    deprecation: Joi.string(),
    custom_properties: Joi.object().unknown(),
  }),
};

const getExtendedApis = {
  query: Joi.object().keys({
    apiName: Joi.string(),
    model: Joi.string().custom(objectId).required(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getExtendedApi = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const updateExtendedApi = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      apiName: Joi.string()
        .regex(/^Vehicle\./)
        .message('apiName must start with Vehicle.'),
      skeleton: Joi.string().optional(),
      type: Joi.string(),
      datatype: Joi.alternatives().conditional('type', {
        is: 'branch',
        then: Joi.string().allow(null).optional(),
        otherwise: Joi.string(),
      }),
      description: Joi.string().allow(''),
      tags: Joi.array().items(
        Joi.object().keys({
          title: Joi.string().required(),
          description: Joi.string().allow(''),
        })
      ),
      isWishlist: Joi.boolean(),
      unit: Joi.string().allow('', null),
      min: Joi.number(),
      max: Joi.number(),
      allowed: Joi.array().items(Joi.any()),
      comment: Joi.string(),
      default: Joi.any(),
      deprecation: Joi.string(),
      custom_properties: Joi.object().unknown(),
    })
    .min(1),
};

const deleteExtendedApi = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const getExtendedApiByApiNameAndModel = {
  query: Joi.object().keys({
    apiName: Joi.string().required(),
    model: Joi.string().required().custom(objectId),
  }),
};

module.exports = {
  createExtendedApi,
  getExtendedApis,
  getExtendedApi,
  updateExtendedApi,
  deleteExtendedApi,
  getExtendedApiByApiNameAndModel,
};
