// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const userWorkspaceSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    coder_user_id: {
      type: String,
      trim: true,
    },
    workspace_id: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    workspace_name: {
      type: String,
      trim: true,
    },
    template_name: {
      type: String,
      trim: true,
      default: 'docker-template',
    },
    prototypes_host_path: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
      default: 'active',
      enum: ['active', 'stale'],
    },
  },
  { timestamps: true }
);

userWorkspaceSchema.plugin(toJSON);

const UserWorkspace = mongoose.model('UserWorkspace', userWorkspaceSchema);

module.exports = UserWorkspace;
