// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const pluginApiInstanceSchema = mongoose.Schema(
  {
    plugin_api: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PluginAPI',
      required: true,
    },
    plugin_api_code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    scope: {
      type: String,
      required: true,
      enum: ['system', 'user'],
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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
    avatar: {
      type: String,
      trim: true,
    },
    provider_url: {
      type: String,
      trim: true,
    },
    // For tree type: hierarchical structure
    // For list type: flat array
    // For graph type: nodes + edges
    data: {
      items: [
        {
          id: {
            type: String,
            required: true,
          },
          path: {
            type: String,
            trim: true,
          },
          parent_id: {
            type: String,
            default: null,
          },
          relationships: [
            {
              relationship_name: {
                type: String,
                required: true,
              },
              target_item_id: {
                type: String,
                required: true,
              },
            },
          ],
          // Dynamic fields based on PluginAPI.attributes will be stored here
        },
      ],
      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
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
    strict: false, // Allow dynamic fields in items (name, value, etc. based on PluginAPI attributes)
  }
);

pluginApiInstanceSchema.plugin(toJSON);
pluginApiInstanceSchema.plugin(paginate);

// Compound indexes for efficient queries
pluginApiInstanceSchema.index({ plugin_api_code: 1, scope: 1 });
pluginApiInstanceSchema.index({ owner: 1, scope: 1 });
pluginApiInstanceSchema.index({ plugin_api: 1 });

/**
 * @typedef PluginApiInstance
 */
const PluginApiInstance = mongoose.model('PluginApiInstance', pluginApiInstanceSchema);

module.exports = PluginApiInstance;

