// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate, captureChange } = require('./plugins');
const { visibilityTypes } = require('../config/enums');

const tagSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const modelSchema = new mongoose.Schema(
  {
    custom_apis: {
      type: Object,
    },
    main_api: {
      type: String,
      required: true,
      trim: true,
      maxLength: 255,
    },
    model_home_image_file: {
      type: String,
    },
    detail_image_file: {
      type: String,
    },
    model_files: {
      type: Object,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 255,
    },
    visibility: {
      type: String,
      required: true,
      enums: Object.values(visibilityTypes),
    },
    state: {
      type: String,
      default: 'draft',
      trim: true,
      maxLength: 255,
    },
    vehicle_category: {
      type: String,
      required: true,
      trim: true,
      maxLength: 255,
    },
    property: {
      type: String,
    },
    created_by: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    skeleton: {
      type: String,
    },
    tags: {
      type: [tagSchema],
    },
    extend: {
      type: mongoose.SchemaTypes.Mixed,
    },
    api_version: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
modelSchema.plugin(toJSON);
modelSchema.plugin(paginate);

modelSchema.pre('save', captureChange.captureUpdates);
modelSchema.post('save', captureChange.captureCreate);
modelSchema.post('remove', captureChange.captureRemove);

/**
 * @typedef Model
 */
const Model = mongoose.model('Model', modelSchema);

module.exports = Model;
