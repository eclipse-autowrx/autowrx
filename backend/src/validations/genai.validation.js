// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { SUPPORTED_SERVICES } = require('../services/serviceToken.service');
const { objectId } = require('./custom.validation');

const MAX_PROMPT_LENGTH = 20000;

const getServiceToken = {
  query: Joi.object().keys({
    service: Joi.string()
      .required()
      .valid(...SUPPORTED_SERVICES),
  }),
};

const generate = {
  body: Joi.object().keys({
    source: Joi.string().valid('sdv-copilot', 'asset', 'marketplace').required(),
    assetId: Joi.alternatives().conditional('source', {
      is: 'asset',
      then: Joi.string().custom(objectId).required(),
      otherwise: Joi.forbidden(),
    }),
    addonId: Joi.alternatives().conditional('source', {
      is: 'marketplace',
      then: Joi.string().max(200).required(),
      otherwise: Joi.forbidden(),
    }),
    type: Joi.string().valid('GenAI_Python', 'GenAI_Dashboard', 'GenAI_Widget').required(),
    prompt: Joi.string().trim().min(1).max(MAX_PROMPT_LENGTH).required(),
    systemMessage: Joi.string().allow('').max(MAX_PROMPT_LENGTH),
    modelId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  getServiceToken,
  generate,
};
