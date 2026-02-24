// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const dashboardTemplateSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 255 },
    description: { type: String, trim: true },
    created_by: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true },
    updated_by: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

dashboardTemplateSchema.plugin(toJSON);
dashboardTemplateSchema.plugin(paginate);

const DashboardTemplate = mongoose.model('DashboardTemplate', dashboardTemplateSchema);

module.exports = DashboardTemplate;
