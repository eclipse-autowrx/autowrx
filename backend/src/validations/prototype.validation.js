// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { stateTypes } = require('../config/enums');
const { objectId, jsonString, slug } = require('./custom.validation');

const bodyValidation = Joi.object().keys({
  extend: Joi.any(),
  requirements_data: Joi.any(),
  flow: Joi.any(),
  state: Joi.string().allow(...Object.values(stateTypes)),
  apis: Joi.object().keys({
    VSC: Joi.array().items(Joi.string()),
    VSS: Joi.array().items(Joi.string()),
  }),
  code: Joi.string().allow(''),
  complexity_level: Joi.number().min(1).max(5),
  customer_journey: Joi.string().allow(''),
  description: Joi.object().keys({
    problem: Joi.string().allow('').max(4095),
    says_who: Joi.string().allow('').max(4095),
    solution: Joi.string().allow('').max(4095),
    status: Joi.string().allow('').max(255),
    text: Joi.string().allow(''),
  }),
  image_file: Joi.string().allow(''),
  journey_image_file: Joi.string().allow(''),
  analysis_image_file: Joi.string().allow(''),
  model_id: Joi.string().required().custom(objectId),
  name: Joi.string().required().max(255),
  portfolio: Joi.object().keys({
    effort_estimation: Joi.number(),
    needs_addressed: Joi.number(),
    relevance: Joi.number(),
  }),
  skeleton: Joi.string().custom(jsonString),
  tags: Joi.array().items(
    Joi.object().keys({
      title: Joi.string().required(),
      description: Joi.string().allow(''),
    })
  ),
  widget_config: Joi.string().custom(jsonString),
  autorun: Joi.boolean(),
  related_ea_components: Joi.string().allow(''),
  partner_logo: Joi.string().allow(''),
  language: Joi.string().default('python'),
  requirements: Joi.string().allow(''),
  editors_choice: Joi.boolean(),
});

const createPrototype = {
  body: bodyValidation,
};

const bulkCreatePrototypes = {
  body: Joi.array().items(bodyValidation).min(1),
};

const listPrototypes = {
  query: Joi.object().keys({
    state: Joi.string(),
    model_id: Joi.string().custom(objectId),
    name: Joi.string(),
    complexity_level: Joi.number().min(1).max(5),
    autorun: Joi.boolean(),
    created_by: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    fields: Joi.string(),
    // populate: Joi.string(),
  }),
};

const getPrototype = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
};

const updatePrototype = {
  body: Joi.object().keys({
    flow: Joi.any(),
    extend: Joi.any(),
    requirements_data: Joi.any(),
    state: Joi.string().allow(...Object.values(stateTypes)),
    apis: Joi.object().keys({
      VSC: Joi.array().items(Joi.string()),
      VSS: Joi.array().items(Joi.string()),
    }),
    code: Joi.string().allow(''),
    complexity_level: Joi.number().min(1).max(5),
    customer_journey: Joi.string().allow(''),
    description: Joi.object().keys({
      problem: Joi.string().allow('').max(4095),
      says_who: Joi.string().allow('').max(4095),
      solution: Joi.string().allow('').max(4095),
      status: Joi.string().allow('').max(255),
      text: Joi.string().allow(''),
    }),
    image_file: Joi.string().allow(''),
    journey_image_file: Joi.string().allow(''),
    analysis_image_file: Joi.string().allow(''),
    name: Joi.string().max(255),
    portfolio: Joi.object().keys({
      effort_estimation: Joi.number(),
      needs_addressed: Joi.number(),
      relevance: Joi.number(),
    }),
    skeleton: Joi.string().custom(jsonString),
    tags: Joi.array().items(
      Joi.object().keys({
        title: Joi.string().required(),
        description: Joi.string().allow(''),
      })
    ),
    widget_config: Joi.string().custom(jsonString),
    autorun: Joi.boolean(),
    related_ea_components: Joi.string().allow(''),
    partner_logo: Joi.string().allow(''),
    requirements: Joi.string().allow(''),
    language: Joi.string(),
    editors_choice: Joi.boolean(),
    // rated_by: Joi.object().pattern(
    //   /^[0-9a-fA-F]{24}$/,
    //   Joi.object()
    //     .required()
    //     .keys({
    //       rating: Joi.number().min(1).max(5),
    //     })
    // ),
  }),
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

// const getRecentPrototypes = {
//   query: Joi.object().keys({
//     userId: Joi.string().required(),
//   }),
// };

const deletePrototype = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

const executeCode = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
};

module.exports = {
  listPrototypes,
  createPrototype,
  getPrototype,
  updatePrototype,
  deletePrototype,
  executeCode,
  bulkCreatePrototypes,
};
