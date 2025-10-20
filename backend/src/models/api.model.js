// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const apiSchema = mongoose.Schema(
  {
    model: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Model',
      required: true,
    },
    cvi: {
      type: Object,
      required: true,
    },
    created_by: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
apiSchema.plugin(toJSON);
apiSchema.plugin(paginate);

/**
 * @typedef Api
 */
const Api = mongoose.model('Api', apiSchema);

module.exports = Api;
