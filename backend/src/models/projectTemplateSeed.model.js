// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');

/**
 * Remembers which predefined project templates have already been seeded, so a
 * template an admin deleted (or renamed) is not re-created on the next startup.
 */
const projectTemplateSeedSchema = mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true },
);

const ProjectTemplateSeed = mongoose.model('ProjectTemplateSeed', projectTemplateSeedSchema);

module.exports = ProjectTemplateSeed;
