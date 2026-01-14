// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const pluginSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 255,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
      unique: true,
    },
    image: {
      type: String,
    },
    description: {
      type: String,
    },
    is_internal: {
      type: Boolean,
      default: false,
      required: true,
    },
    url: {
      type: String,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
    },
    type: {
      type: String,
      enum: ['prototype_function', 'deploy'],
      default: 'prototype_function',
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

pluginSchema.plugin(toJSON);
pluginSchema.plugin(paginate);

/**
 * @typedef Plugin
 */
const Plugin = mongoose.model('Plugin', pluginSchema);

module.exports = Plugin;


