// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const gitRepositorySchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    prototype_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prototype',
      index: true,
    },
    github_repo_id: {
      type: String,
      required: true,
    },
    github_repo_name: {
      type: String,
      required: true,
    },
    github_repo_full_name: {
      type: String,
      required: true,
    },
    github_repo_url: {
      type: String,
      required: true,
    },
    github_repo_clone_url: {
      type: String,
      required: true,
    },
    github_default_branch: {
      type: String,
      default: 'main',
    },
    github_repo_private: {
      type: Boolean,
      default: false,
    },
    last_commit_sha: {
      type: String,
    },
    last_sync_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
gitRepositorySchema.plugin(toJSON);
gitRepositorySchema.plugin(paginate);

// Index for quick lookup
gitRepositorySchema.index({ user_id: 1, prototype_id: 1 });
gitRepositorySchema.index({ github_repo_id: 1 });

/**
 * @typedef GitRepository
 * @property {ObjectId} user_id - User ID
 * @property {ObjectId} prototype_id - Prototype ID
 * @property {string} github_repo_id - GitHub repository ID
 * @property {string} github_repo_name - GitHub repository name
 * @property {string} github_repo_full_name - GitHub repository full name (owner/repo)
 * @property {string} github_repo_url - GitHub repository URL
 * @property {string} github_repo_clone_url - GitHub repository clone URL
 * @property {string} github_default_branch - Default branch name
 * @property {boolean} github_repo_private - Is repository private
 * @property {string} last_commit_sha - Last commit SHA
 * @property {Date} last_sync_at - Last sync timestamp
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
const GitRepository = mongoose.model('GitRepository', gitRepositorySchema);

module.exports = GitRepository;
