// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');

const listTagCategories = {
  query: Joi.object().keys({
    tenantId: Joi.string().required(),
  }),
};

const createTag = {
  body: Joi.object().keys({
    newTag: Joi.object().required(),
    newTagCategory: Joi.object().required(),
    id: Joi.string().required(),
    tenantId: Joi.string().required(),
  }),
};

const updateTagCategory = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    tags: Joi.object(),
  }),
};

const createTagCategory = {
  body: Joi.object().keys({
    id: Joi.string().required(),
    name: Joi.string(),
    color: Joi.string(),
    tags: Joi.object(),
    tenant_id: Joi.string().required(),
  }),
};

module.exports = {
  listTagCategories,
  createTag,
  updateTagCategory,
  createTagCategory,
};
