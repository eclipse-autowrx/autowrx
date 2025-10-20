// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { newEnforcer, Enforcer } = require('casbin');
const { default: MongooseAdapter } = require('casbin-mongoose-adapter');
const path = require('path');
const config = require('./config');
const logger = require('./logger');

/** @type Enforcer | null */
let rolesClient = null;

(async () => {
  const modelPath = path.join(__dirname, './rolesModel.conf');
  const adapter = await MongooseAdapter.newAdapter(config.mongoose.url);
  rolesClient = await newEnforcer(modelPath, adapter);
  await initDefaultDataAndPolicies(rolesClient);
})();

/**
 *
 * @param {Enforcer} rolesClient
 */
async function initDefaultDataAndPolicies(rolesClient) {
  if (!rolesClient) {
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
  const promises = rolesActionsMap.map(([role, action]) => rolesClient.addNamedGroupingPolicy(groupingName, role, action));
  await Promise.all(promises);
}

function getRolesClient() {
  return rolesClient;
}

module.exports.getRolesClient = getRolesClient;
