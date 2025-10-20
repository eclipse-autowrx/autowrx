// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { populate } = require('../models/token.model');

const createDiscussion = {
  body: Joi.object().keys({
    content: Joi.string().required().max(2000),
    ref: Joi.string().required(),
    ref_type: Joi.string().required(),
    parent: Joi.string().custom(objectId),
  }),
};

const listDiscussions = {
  query: Joi.object().keys({
    ref: Joi.string().required(),
    ref_type: Joi.string(),
    id: Joi.string().custom(objectId),
    parent: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    fields: Joi.string(),
    populate: Joi.any(),
  }),
};

const updateDiscussion = {
  params: Joi.object().keys({
    id: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      content: Joi.string().max(2000),
    })
    .min(1),
};

const deleteDiscussion = {
  params: Joi.object().keys({
    id: Joi.required().custom(objectId),
  }),
};

module.exports = {
  createDiscussion,
  listDiscussions,
  updateDiscussion,
  deleteDiscussion,
};
