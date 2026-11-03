// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/* eslint-disable no-await-in-loop */
const { ROLES } = require('../config/roles');
const Role = require('../models/role.model');
const logger = require('../config/logger');
const dedupeRoles = require('./dedupeRoles');

// Atomic upsert keyed on `ref`: a separate find-then-create lets two
// concurrent boots (or a boot racing a data import) insert the same role
// twice, which shows up as duplicate entries on /manage-features. With the
// unique index on `ref`, the losing upsert of a race fails with E11000; the
// role then exists, so a single retry turns it into a plain update.
const upsertRole = async (roleData) => {
  const run = () =>
    Role.findOneAndUpdate(
      { ref: roleData.ref },
      {
        name: roleData.name,
        permissions: roleData.permissions,
        not_feature: roleData.not_feature,
      },
      { upsert: true },
    );
  try {
    await run();
  } catch (error) {
    if (error.code !== 11000) throw error;
    await run();
  }
};

const initializeRoles = async () => {
  // Heal databases that already hold duplicate roles (e.g. from an older
  // backend or a data import) before upserting. Isolated so a failure here
  // never blocks role initialization.
  try {
    await dedupeRoles({ apply: true, log: (msg) => logger.info(`[roles dedupe] ${msg}`) });
  } catch (error) {
    logger.error(`Error merging duplicate roles: ${error}`);
  }

  try {
    // eslint-disable-next-line no-restricted-syntax

    for (let i = 0; i < Object.keys(ROLES).length; i += 1) {
      const role = Object.keys(ROLES)[i];
      const roleData = ROLES[role];
      await upsertRole(roleData);
    }
    logger.info('Role initialization completed.');
  } catch (error) {
    logger.error(`Error initializing roles: ${error}`);
  }
};

module.exports = initializeRoles;
