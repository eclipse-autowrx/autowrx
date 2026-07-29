// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Predefined auth configs used as restore defaults when no deployment snapshot exists.
 */
const PREDEFINED_AUTH_CONFIGS = [
  {
    key: 'PUBLIC_VIEWING',
    scope: 'site',
    value: true,
    secret: false,
    valueType: 'boolean',
    category: 'auth',
    description: 'Allow unauthenticated users to view models, prototypes, and other content',
  },
  {
    key: 'SELF_REGISTRATION',
    scope: 'site',
    value: true,
    secret: false,
    valueType: 'boolean',
    category: 'auth',
    description: 'Allow users to create their own accounts via the registration page',
  },
  {
    key: 'SSO_AUTO_REGISTRATION',
    scope: 'site',
    value: true,
    secret: false,
    valueType: 'boolean',
    category: 'auth',
    description: 'Automatically create accounts for users logging in via SSO (e.g., Microsoft, GitHub)',
  },
  {
    key: 'PASSWORD_MANAGEMENT',
    scope: 'site',
    value: true,
    secret: false,
    valueType: 'boolean',
    category: 'auth',
    description: 'Allow users to set and update their own passwords',
  },
];

module.exports = PREDEFINED_AUTH_CONFIGS;
