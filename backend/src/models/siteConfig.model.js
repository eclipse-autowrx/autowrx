// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const siteConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      maxLength: 255,
      index: true,
    },
    scope: {
      type: String,
      required: true,
      enum: ['site', 'user', 'model', 'prototype', 'api'],
      default: 'site',
      index: true,
    },
    target_id: {
      type: mongoose.SchemaTypes.ObjectId,
      required: function() {
        return this.scope !== 'site';
      },
      index: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    valueType: {
      type: String,
      required: true,
      enum: ['string', 'number', 'boolean', 'object', 'array', 'date', 'color', 'image_url'],
    },
    secret: {
      type: Boolean,
      default: false,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    category: {
      type: String,
      trim: true,
      maxLength: 100,
      default: 'general',
    },
    created_by: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    updated_by: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
siteConfigSchema.index({ key: 1, scope: 1, target_id: 1 }, { unique: true });
siteConfigSchema.index({ scope: 1, target_id: 1, secret: 1 });
siteConfigSchema.index({ category: 1, scope: 1, secret: 1 });

// add plugin that converts mongoose to json
siteConfigSchema.plugin(toJSON);
siteConfigSchema.plugin(paginate);

/**
 * @typedef SiteConfig
 */
const SiteConfig = mongoose.model('SiteConfig', siteConfigSchema);

module.exports = SiteConfig;
