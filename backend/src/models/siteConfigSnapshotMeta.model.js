// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const siteConfigSnapshotMetaSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: 'meta',
    },
    lastSyncedSeedRunAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

siteConfigSnapshotMetaSchema.plugin(toJSON);

const SiteConfigSnapshotMeta = mongoose.model(
  'SiteConfigSnapshotMeta',
  siteConfigSnapshotMetaSchema
);

module.exports = SiteConfigSnapshotMeta;
