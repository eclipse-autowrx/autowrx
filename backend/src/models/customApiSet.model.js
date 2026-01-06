// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const customApiSetSchema = mongoose.Schema(
  {
    custom_api_schema: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomApiSchema',
      required: true,
    },
    custom_api_schema_code: {
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
          // Dynamic fields based on CustomApiSchema.attributes will be stored here
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
    strict: false, // Allow dynamic fields in items (name, value, etc. based on CustomApiSchema attributes)
  }
);

customApiSetSchema.plugin(toJSON);
customApiSetSchema.plugin(paginate);

// Compound indexes for efficient queries
customApiSetSchema.index({ custom_api_schema_code: 1, scope: 1 });
customApiSetSchema.index({ owner: 1, scope: 1 });
customApiSetSchema.index({ custom_api_schema: 1 });

/**
 * @typedef CustomApiSet
 */
const CustomApiSet = mongoose.model('CustomApiSet', customApiSetSchema);

module.exports = CustomApiSet;

