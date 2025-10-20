// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const discussionSchema = mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      maxLength: 2000,
    },
    created_by: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    ref: {
      type: String,
      required: true,
    },
    ref_type: {
      type: String,
      required: true,
    },
    parent: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Discussion',
    },
  },
  { timestamps: true }
);

// add plugin that converts mongoose to json
discussionSchema.plugin(toJSON);
discussionSchema.plugin(paginate);

/**
 * @typedef {Object} Discussion
 * @property {string} content - The content of the discussion
 * @property {ObjectId} created_by - The user who created the discussion
 * @property {ObjectId} ref - Reference ID to the associated entity
 * @property {string} ref_type - Type of the referenced entity
 * @property {ObjectId} [parent] - Parent discussion ID, if any
 * @property {Date} createdAt - The date when the discussion was created
 * @property {Date} updatedAt - The date when the discussion was last updated
 */
const Discussion = mongoose.model('Discussion', discussionSchema);

module.exports = Discussion;
