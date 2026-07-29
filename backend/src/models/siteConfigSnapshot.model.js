// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const siteConfigSnapshotSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

siteConfigSnapshotSchema.index({ key: 1, scope: 1 }, { unique: true });
siteConfigSnapshotSchema.index({ category: 1, secret: 1 });

siteConfigSnapshotSchema.plugin(toJSON);

const SiteConfigSnapshot = mongoose.model('SiteConfigSnapshot', siteConfigSnapshotSchema);

module.exports = SiteConfigSnapshot;
