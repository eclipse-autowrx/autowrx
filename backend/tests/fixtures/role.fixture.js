// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { Role, UserRole } = require('../../src/models');
const initializeRoles = require('../../src/scripts/initializeRoles');

// setupTestDB wipes every collection before each test, so specs re-seed roles in their own beforeEach.
const seedRoles = () => initializeRoles();

const getRole = (ref) => Role.findOne({ ref });

// Without a ref the grant is global ('*'); with one it is scoped to that model/prototype id.
const grantRole = async (userId, roleRef, ref) => {
  const role = await getRole(roleRef);
  return UserRole.create({ user: userId, role: role._id, ...(ref && { ref: String(ref) }) });
};

module.exports = {
  seedRoles,
  getRole,
  grantRole,
};
