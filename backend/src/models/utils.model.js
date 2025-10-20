// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');

const timestamp = mongoose.Schema(
  {
    _seconds: {
      type: Number,
      required: true,
    },
    _nanoseconds: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

module.exports = {
  timestamp,
};
