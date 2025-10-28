// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const allRoles = {
  user: ['getUsers'],
  admin: ['getUsers', 'manageUsers'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

const PERMISSIONS = {
  // *
  UNLIMITED_MODEL: 'unlimitedModel',
  ADMIN: 'manageUsers',

  // model_id
  READ_MODEL: 'readModel',
  WRITE_MODEL: 'writeModel',


  // read assets,
  READ_ASSET: 'readAsset',
  WRITE_ASSET: 'writeAsset',

  // deploy hardware
  DEPLOY_HARDWARE: 'deployHardware',

  // learn
  LEARNING_MODE: 'learningMode',

  //  AI agent
  AI_AGENT: 'aiAgent',
};

const PERMISSIONS_DESCRIPTION = {
  [PERMISSIONS.UNLIMITED_MODEL]: 'Unlimited access',
  [PERMISSIONS.ADMIN]: 'Manage users',
  [PERMISSIONS.READ_MODEL]: 'Read model',
  [PERMISSIONS.WRITE_MODEL]: 'Write model',
  [PERMISSIONS.DEPLOY_HARDWARE]: 'Deploy hardware',
  [PERMISSIONS.LEARNING_MODE]: 'Learning Mode',
  [PERMISSIONS.AI_AGENT]: 'AI Agent',
};

// The role here is applied for the resources that the user is not the owner of
const ROLES = {
  promoted_user: {
    permissions: [PERMISSIONS.UNLIMITED_MODEL],
    ref: 'promoted_user',
    name: 'Unlimited model',
  },
  model_contributor: {
    permissions: [PERMISSIONS.READ_MODEL, PERMISSIONS.WRITE_MODEL],
    ref: 'model_contributor',
    name: 'Model contributor',
    not_feature: true,
  },
  model_member: {
    permissions: [PERMISSIONS.READ_MODEL, PERMISSIONS.WRITE_MODEL],
    ref: 'model_member',
    name: 'Model member',
    not_feature: true,
  },
  admin: {
    permissions: [
      PERMISSIONS.READ_MODEL,
      PERMISSIONS.WRITE_MODEL,
      PERMISSIONS.ADMIN,
      PERMISSIONS.UNLIMITED_MODEL,
      PERMISSIONS.READ_ASSET,
      PERMISSIONS.WRITE_ASSET,
      PERMISSIONS.DEPLOY_HARDWARE,
    ],
    ref: 'admin',
    name: 'Admin',
  },
  read_asset: {
    permissions: [PERMISSIONS.READ_ASSET],
    ref: 'read_asset',
    name: 'Read asset',
  },
  write_asset: {
    permissions: [PERMISSIONS.READ_ASSET, PERMISSIONS.WRITE_ASSET],
    ref: 'write_asset',
    name: 'Write asset',
  },
  deploy_hardware: {
    permissions: [PERMISSIONS.DEPLOY_HARDWARE],
    ref: 'deploy_hardware',
    name: 'Deploy hardware',
  },
  learning_mode: {
    permissions: [PERMISSIONS.LEARNING_MODE],
    ref: 'learning_mode',
    name: 'Learning Mode',
  },
  ai_agent: {
    permissions: [PERMISSIONS.AI_AGENT],
    ref: 'ai_agent',
    name: 'AI Agent',
  },
};

const RESOURCES = {
  MODEL: 'model',
  PROTOTYPE: 'prototype',
  ASSET: 'asset',
};

module.exports = {
  roles,
  roleRights,
  ROLES,
  PERMISSIONS,
  PERMISSIONS_DESCRIPTION,
  RESOURCES,
};
