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
      index: true,
    },
    workspace_kind: {
      type: String,
      trim: true,
      required: true,
      enum: ['python', 'cpp', 'rust'],
      default: 'python',
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
      default: 'docker-template-python',
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
userWorkspaceSchema.index({ user_id: 1, workspace_kind: 1 }, { unique: true });

const UserWorkspace = mongoose.model('UserWorkspace', userWorkspaceSchema);

module.exports = UserWorkspace;
