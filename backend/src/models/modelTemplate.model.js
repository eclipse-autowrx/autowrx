// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const VISIBILITY = ['public', 'private', 'editable'];

const modelTemplateSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 255 },
    description: { type: String, trim: true },
    image: { type: String },
    visibility: { type: String, enum: VISIBILITY, default: 'public', index: true },
    is_default: { type: Boolean, default: false, index: true },
    config: { type: mongoose.Schema.Types.Mixed },
    created_by: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true },
    updated_by: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

modelTemplateSchema.plugin(toJSON);
modelTemplateSchema.plugin(paginate);

const ModelTemplate = mongoose.model('ModelTemplate', modelTemplateSchema);

module.exports = ModelTemplate;


