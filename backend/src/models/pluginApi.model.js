// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const relationshipSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['one-to-one', 'one-to-many', 'many-to-many'],
    },
    target_api: {
      type: String, // Reference to another API code in the same API set
      required: true,
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

const pluginApiSchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      maxLength: 100,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 255,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['tree', 'list', 'graph'],
    },
    // JSON Schema definition for API items
    schema: {
      type: String,
      required: true,
      trim: true,
    },
    // For graph type: define relationships between APIs
    relationships: {
      type: [relationshipSchema],
      default: [],
    },
    // For tree type: define parent-child structure
    tree_config: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // List view configuration: defines how items are displayed in the list
    list_view_config: {
      title: {
        type: String,
        trim: true,
        default: null,
      },
      description: {
        type: String,
        trim: true,
        default: null,
      },
      type: {
        type: String,
        trim: true,
        default: null,
      },
    },
    // Schema definition (JSON Schema or custom format)
    schema_definition: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Metadata
    version: {
      type: String,
      default: '1.0.0',
    },
    is_active: {
      type: Boolean,
      default: true,
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

pluginApiSchema.plugin(toJSON);
pluginApiSchema.plugin(paginate);

// Index for faster lookups
pluginApiSchema.index({ code: 1, is_active: 1 });

/**
 * @typedef PluginAPI
 */
const PluginAPI = mongoose.model('PluginAPI', pluginApiSchema);

module.exports = PluginAPI;

