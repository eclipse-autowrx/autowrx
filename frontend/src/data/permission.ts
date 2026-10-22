// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// GENERATED from backend/src/config/roles.js by scripts/gen-frontend-permissions.mjs — do not edit.

export const PERMISSIONS = {
  UNLIMITED_MODEL: 'unlimitedModel',
  ADMIN: 'manageUsers',
  READ_MODEL: 'readModel',
  WRITE_MODEL: 'writeModel',
  READ_ASSET: 'readAsset',
  WRITE_ASSET: 'writeAsset',
  GENERATIVE_AI: 'generativeAI',
  DEPLOY_HARDWARE: 'deployHardware',
  LEARNING_MODE: 'learningMode',
  AI_AGENT: 'aiAgent',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const RESOURCES = {
  MODEL: 'model',
  PROTOTYPE: 'prototype',
  ASSET: 'asset',
} as const
