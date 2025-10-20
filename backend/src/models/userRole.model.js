// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  ref: { type: mongoose.Schema.Types.ObjectId },
});

userRoleSchema.index({ user: 1, role: 1, ref: 1, refType: 1 }, { unique: true });

userRoleSchema.statics.checkExist = async function (user, role, ref, refType) {
  return this.findOne({ user, role, ref, refType });
};

module.exports = mongoose.model('UserRole', userRoleSchema);
