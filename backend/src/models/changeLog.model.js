// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const changeLogSchema = new mongoose.Schema(
  {
    created_by: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
    },
    ref_type: {
      type: String,
      required: true,
    },
    ref: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
    },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE'],
      required: true,
    },
    changes: {
      type: mongoose.SchemaTypes.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef {mongoose.Document & {
 *  created_by: mongoose.Types.ObjectId,
 *  description?: string,
 *  ref_type: string,
 *  ref: mongoose.Types.ObjectId
 *  action: 'CREATE' | 'UPDATE' | 'DELETE',
 *  changes?: mongoose.Schema.Types.Mixed
 * }} CodeChangeDocument
 */

changeLogSchema.plugin(toJSON);
changeLogSchema.plugin(paginate);
changeLogSchema.index({ ref: 1 });

const ChangeLog = mongoose.model('ChangeLog', changeLogSchema);

module.exports = ChangeLog;
