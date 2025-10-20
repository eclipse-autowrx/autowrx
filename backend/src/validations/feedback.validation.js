// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createFeedback = {
  body: Joi.object().keys({
    description: Joi.string().max(2000).allow(''),
    ref: Joi.string().required().custom(objectId),
    ref_type: Joi.string().required(),
    model_id: Joi.string().custom(objectId),
    question: Joi.string().max(2000).allow(''),
    recommendation: Joi.string().max(2000).allow(''),
    score: Joi.object().keys({
      easy_to_use: Joi.number().integer().min(1).max(5),
      need_address: Joi.number().integer().min(1).max(5),
      relevance: Joi.number().integer().min(1).max(5),
    }),
    interviewee: Joi.object()
      .required()
      .keys({
        name: Joi.string().required().max(200),
        organization: Joi.string().max(200),
      }),
  }),
};

const listFeedbacks = {
  query: Joi.object().keys({
    ref: Joi.string().custom(objectId),
    ref_type: Joi.string(),
    id: Joi.string().custom(objectId),
    avg_score: Joi.number().min(1).max(5),
    model_id: Joi.string().custom(objectId),
    created_by: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    fields: Joi.string(),
  }),
};

const updateFeedback = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      description: Joi.string().max(2000).allow(''),
      ref: Joi.string().custom(objectId),
      ref_type: Joi.string(),
      model_id: Joi.string().custom(objectId),
      question: Joi.string().max(2000).allow(''),
      recommendation: Joi.string().max(2000).allow(''),
      score: Joi.object().keys({
        easy_to_use: Joi.number().integer().min(1).max(5),
        need_address: Joi.number().integer().min(1).max(5),
        relevance: Joi.number().integer().min(1).max(5),
      }),
      interviewee: Joi.object().keys({
        name: Joi.string().required().max(200),
        organization: Joi.string().max(200),
      }),
    })
    .min(1),
};

const deleteFeedback = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
};

module.exports = {
  createFeedback,
  listFeedbacks,
  updateFeedback,
  deleteFeedback,
};
