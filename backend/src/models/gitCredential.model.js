// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const gitCredentialSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    github_access_token: {
      type: String,
      required: true,
      private: true, // will not be included in JSON responses
    },
    github_refresh_token: {
      type: String,
      private: true,
    },
    github_username: {
      type: String,
      required: true,
    },
    github_user_id: {
      type: String,
      required: true,
    },
    github_avatar_url: {
      type: String,
    },
    github_email: {
      type: String,
    },
    expires_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
gitCredentialSchema.plugin(toJSON);
gitCredentialSchema.plugin(paginate);

// Index for quick lookup by user_id
gitCredentialSchema.index({ user_id: 1 });

/**
 * @typedef GitCredential
 * @property {ObjectId} user_id - User ID
 * @property {string} github_access_token - GitHub access token
 * @property {string} github_refresh_token - GitHub refresh token
 * @property {string} github_username - GitHub username
 * @property {string} github_user_id - GitHub user ID
 * @property {string} github_avatar_url - GitHub avatar URL
 * @property {string} github_email - GitHub email
 * @property {Date} expires_at - Token expiration date
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */
const GitCredential = mongoose.model('GitCredential', gitCredentialSchema);

module.exports = GitCredential;
