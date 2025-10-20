// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate, captureChange } = require('./plugins');

const extendedApiSchema = mongoose.Schema(
  {
    apiName: {
      type: String,
      required: true,
    },
    model: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Model',
      required: true,
    },
    skeleton: {
      type: String,
    },
    unit: {
      type: String,
    },
    type: {
      type: String,
    },
    datatype: {
      type: String,
    },
    description: String,
    isWishlist: {
      type: Boolean,
      default: false,
    },
    min: {
      type: Number,
    },
    max: {
      type: Number,
    },
    allowed: {
      type: [mongoose.Schema.Types.Mixed],
      default: undefined,
    },
    comment: {
      type: String,
    },
    default: {
      type: mongoose.Schema.Types.Mixed,
    },
    deprecation: {
      type: String,
    },
    custom_properties: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
extendedApiSchema.plugin(toJSON);
extendedApiSchema.plugin(paginate);

extendedApiSchema.pre('save', captureChange.captureUpdates);
extendedApiSchema.post('remove', captureChange.captureRemove);

extendedApiSchema.index({ apiName: 1, model: 1 }, { unique: true });

/**
 * @typedef ExtendedApi
 */
const ExtendedApi = mongoose.model('ExtendedApi', extendedApiSchema);

module.exports = ExtendedApi;
