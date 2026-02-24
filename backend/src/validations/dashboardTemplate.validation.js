// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { objectId } = require('./custom.validation');

const list = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const get = {
  params: Joi.object().keys({ id: Joi.string().custom(objectId) }),
};

const create = {
  body: Joi.object().keys({
    name: Joi.string().required().max(255),
    description: Joi.string().allow(''),
    image: Joi.string().allow(''),
    widget_config: Joi.any(),
  }),
};

const update = {
  params: Joi.object().keys({ id: Joi.string().custom(objectId) }),
  body: Joi.object()
    .keys({
      name: Joi.string().max(255),
      description: Joi.string().allow(''),
      image: Joi.string().allow(''),
      widget_config: Joi.any(),
    })
    .min(1),
};

const remove = {
  params: Joi.object().keys({ id: Joi.string().custom(objectId) }),
};

module.exports = { list, get, create, update, remove };
