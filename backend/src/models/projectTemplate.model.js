// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const projectTemplateSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 255 },
    description: { type: String, trim: true },
    data: { type: String, required: true },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    created_by: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true },
    updated_by: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

projectTemplateSchema.plugin(toJSON);
projectTemplateSchema.plugin(paginate);

const ProjectTemplate = mongoose.model('ProjectTemplate', projectTemplateSchema);

module.exports = ProjectTemplate;
