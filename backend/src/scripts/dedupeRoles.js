// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/* eslint-disable no-await-in-loop, no-restricted-syntax */

/**
 * One-off cleanup for duplicate Role documents (same `ref`, different `_id`).
 *
 * For every duplicated `ref` the oldest role (lowest `_id`, the one
 * initializeRoles keeps updating) is kept. UserRole rows pointing at the
 * other copies are moved onto the kept role, or deleted when the user already
 * has the same assignment there. The duplicate roles are then removed and the
 * unique index on `ref` is built.
 *
 * Usage (from backend/):
 *   node src/scripts/dedupeRoles.js            # dry run, prints the plan
 *   node src/scripts/dedupeRoles.js --apply    # performs the cleanup
 */

const mongoose = require('mongoose');
const Role = require('../models/role.model');
const UserRole = require('../models/userRole.model');
const logger = require('../config/logger');

const findDuplicateRefs = async () =>
  Role.aggregate([
    { $match: { ref: { $type: 'string' } } },
    { $sort: { _id: 1 } },
    { $group: { _id: '$ref', ids: { $push: '$_id' }, names: { $push: '$name' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { _id: 1 } },
  ]);

/**
 * @param {{ apply?: boolean, log?: (msg: string) => void }} [options]
 * @returns {Promise<{ refs: number, rolesRemoved: number, userRolesMoved: number, userRolesDropped: number }>}
 */
const dedupeRoles = async ({ apply = false, log = (msg) => logger.info(msg) } = {}) => {
  const stats = { refs: 0, rolesRemoved: 0, userRolesMoved: 0, userRolesDropped: 0 };
  const groups = await findDuplicateRefs();

  for (const group of groups) {
    stats.refs += 1;
    const [keepId, ...dupIds] = group.ids;
    log(`ref "${group._id}": keep ${keepId} (${group.names[0]}), remove ${dupIds.join(', ')}`);

    for (const dupId of dupIds) {
      const rows = await UserRole.find({ role: dupId }).lean();
      for (const row of rows) {
        const existing = await UserRole.exists({ user: row.user, role: keepId, ref: row.ref });
        if (existing) {
          stats.userRolesDropped += 1;
          log(`  user ${row.user}: already on kept role, drop duplicate assignment ${row._id}`);
          if (apply) await UserRole.deleteOne({ _id: row._id });
        } else {
          stats.userRolesMoved += 1;
          log(`  user ${row.user}: move assignment ${row._id} to kept role`);
          if (apply) await UserRole.updateOne({ _id: row._id }, { $set: { role: keepId } });
        }
      }
      stats.rolesRemoved += 1;
      if (apply) await Role.deleteOne({ _id: dupId });
    }
  }

  if (apply) {
    await Role.syncIndexes();
  }

  log(
    `${apply ? 'Done' : 'Dry run'}: ${stats.refs} duplicated ref(s), ${stats.rolesRemoved} role(s) removed, ` +
      `${stats.userRolesMoved} assignment(s) moved, ${stats.userRolesDropped} duplicate assignment(s) dropped.`,
  );
  if (!apply && stats.refs > 0) log('Re-run with --apply to perform the cleanup.');
  return stats;
};

module.exports = dedupeRoles;

if (require.main === module) {
  // eslint-disable-next-line global-require
  const config = require('../config/config');
  const apply = process.argv.includes('--apply');
  mongoose
    .connect(config.mongoose.url, config.mongoose.options)
    .then(() => dedupeRoles({ apply }))
    .then(() => mongoose.disconnect())
    .catch(async (error) => {
      logger.error(error);
      await mongoose.disconnect();
      process.exitCode = 1;
    });
}
