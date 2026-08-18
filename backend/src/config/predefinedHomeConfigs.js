// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const fs = require('fs');
const path = require('path');

const homeContent = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'default', 'home_content.json'), 'utf8')
);

/**
 * Predefined home configs used as restore defaults when no deployment snapshot exists.
 */
const PREDEFINED_HOME_CONFIGS = [
  {
    key: 'CFG_HOME_CONTENT',
    scope: 'site',
    value: homeContent,
    secret: false,
    valueType: 'array',
    category: 'home',
    description: 'Home page layout and content blocks',
  },
];

module.exports = PREDEFINED_HOME_CONFIGS;
