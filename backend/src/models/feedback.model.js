// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const scoreSchema = mongoose.Schema(
  {
    easy_to_use: {
      type: Number,
      min: 1,
      max: 5,
    },
    need_address: {
      type: Number,
      min: 1,
      max: 5,
    },
    relevance: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    _id: false,
  }
);

const interviewSchema = mongoose.Schema(
  {
    name: {
      type: String,
      maxLength: 200,
    },
    organization: {
      type: String,
      maxLength: 200,
    },
  },
  {
    _id: false,
  }
);

const feedbackSchema = mongoose.Schema(
  {
    avg_score: {
      type: Number,
      min: 1,
      max: 5,
    },
    description: {
      type: String,
      maxLength: 2000,
    },
    created_by: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    ref: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
    },
    ref_type: {
      type: String,
      required: true,
    },
    model_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Model',
    },
    question: {
      type: String,
      maxLength: 2000,
    },
    recommendation: {
      type: String,
      maxLength: 2000,
    },
    score: {
      type: scoreSchema,
    },
    interviewee: interviewSchema,
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
feedbackSchema.plugin(toJSON);
feedbackSchema.plugin(paginate);

/**
 * @typedef {Object} Score
 * @property {number} [easy_to_use]
 * @property {number} [need_address]
 * @property {number} [relevance]
 */

/**
 * @typedef {Object} Interviewee
 * @property {string} [name]
 * @property {string} [organization]
 */

/**
 * @typedef {Object} Feedback
 * @property {number} [avg_score]
 * @property {string} [description]
 * @property {ObjectId} created_by
 * @property {ObjectId} ref
 * @property {string} ref_type
 * @property {ObjectId} [model_id]
 * @property {string} [question]
 * @property {recommendation} [recommendation]
 * @property {Score} [score]
 * @property {Interviewee} [interviewee]
 */
const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
