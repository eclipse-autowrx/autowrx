// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { newEnforcer } = require('casbin');
const { default: MongooseAdapter } = require('casbin-mongoose-adapter');
const path = require('path');
const config = require('./config');
const logger = require('./logger');

/** @type import('casbin').Enforcer | null */
let rolesClient = null;

/**
 *
 * @param {import('casbin').Enforcer} enforcer
 */
async function initDefaultDataAndPolicies(enforcer) {
  if (!enforcer) {
    logger.warn('rolesClient is not initialized');
    return;
  }

  // Specify each role can do what kind of actions
  const rolesActionsMap = [
    ['owner', 'write'],
    ['owner', 'read'],
    ['writer', 'write'],
    ['writer', 'read'],
    ['reader', 'read'],
  ];

  const groupingName = 'role_act';
  const promises = rolesActionsMap.map(([role, action]) => enforcer.addNamedGroupingPolicy(groupingName, role, action));
  await Promise.all(promises);
}

const rolesClientReady = (async () => {
  const modelPath = path.join(__dirname, './rolesModel.conf');
  const adapter = await MongooseAdapter.newAdapter(config.mongoose.url);
  rolesClient = await newEnforcer(modelPath, adapter);
  await initDefaultDataAndPolicies(rolesClient);
})();

function getRolesClient() {
  return rolesClient;
}

/**
 * Close the Casbin adapter's MongoDB connection (used by tests so Jest can exit; not called at runtime).
 */
async function closeRolesClient() {
  await rolesClientReady.catch(() => {});
  const adapter = rolesClient?.getAdapter();
  if (adapter?.close) {
    await adapter.close();
  }
}

module.exports.getRolesClient = getRolesClient;
module.exports.closeRolesClient = closeRolesClient;
