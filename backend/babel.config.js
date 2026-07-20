// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Babel config used only by Jest. The backend runs Node directly (no build
// step); this exists so Jest can transpile ESM-only dependencies such as
// @paralleldrive/cuid2 when running the test suite.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
