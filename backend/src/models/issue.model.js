// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const issueSchema = mongoose.Schema(
  {
    extendedApi: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'ExtendedApi',
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
issueSchema.plugin(toJSON);
issueSchema.plugin(paginate);

/**
 * @typedef Issue
 */
const Issue = mongoose.model('Issue', issueSchema);

module.exports = Issue;
