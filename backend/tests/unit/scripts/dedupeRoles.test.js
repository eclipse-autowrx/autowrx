// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const setupTestDB = require('../../utils/setupTestDB');
const logger = require('../../../src/config/logger');
const Role = require('../../../src/models/role.model');
const UserRole = require('../../../src/models/userRole.model');
const dedupeRoles = require('../../../src/scripts/dedupeRoles');
const initializeRoles = require('../../../src/scripts/initializeRoles');

setupTestDB();

const oid = () => new mongoose.Types.ObjectId();
const silent = () => {};

// Seed duplicates through the raw collection, bypassing the unique index the
// model now declares (that is how they got into real databases).
const seedDuplicates = async () => {
  await Role.init().catch(() => {});
  await Role.collection.dropIndexes().catch(() => {});
  const adminA = oid();
  const adminB = oid();
  const memberA = oid();
  const memberB = oid();
  await Role.collection.insertMany([
    { _id: adminA, ref: 'admin', name: 'Admin', permissions: ['a'] },
    { _id: memberA, ref: 'model_member', name: 'Model reader', permissions: ['r'] },
    { _id: adminB, ref: 'admin', name: 'Admin', permissions: ['a'] },
    { _id: memberB, ref: 'model_member', name: 'Model member', permissions: ['r'] },
  ]);
  return { adminA, adminB, memberA, memberB };
};

describe('dedupeRoles', () => {
  test('dry run reports duplicates without changing anything', async () => {
    const { adminB } = await seedDuplicates();
    await UserRole.collection.insertOne({ user: oid(), role: adminB });

    const stats = await dedupeRoles({ log: silent });

    expect(stats).toEqual({ refs: 2, rolesRemoved: 2, userRolesMoved: 1, userRolesDropped: 0 });
    expect(await Role.countDocuments()).toBe(4);
    expect(await UserRole.countDocuments({ role: adminB })).toBe(1);
  });

  test('apply keeps the oldest role per ref and repoints assignments', async () => {
    const { adminA, adminB, memberA } = await seedDuplicates();
    const onlyOnB = oid();
    const onBoth = oid();
    await UserRole.collection.insertMany([
      { user: onlyOnB, role: adminB },
      { user: onBoth, role: adminA },
      { user: onBoth, role: adminB },
    ]);

    const stats = await dedupeRoles({ apply: true, log: silent });

    expect(stats).toEqual({ refs: 2, rolesRemoved: 2, userRolesMoved: 1, userRolesDropped: 1 });
    const remaining = await Role.find().sort({ _id: 1 }).lean();
    expect(remaining.map((r) => String(r._id))).toEqual([String(adminA), String(memberA)]);
    expect(await UserRole.countDocuments({ role: adminB })).toBe(0);
    expect(await UserRole.countDocuments({ role: adminA })).toBe(2);
    expect(await UserRole.exists({ user: onlyOnB, role: adminA })).toBeTruthy();

    const indexes = await Role.collection.indexes();
    expect(indexes.find((i) => i.key.ref === 1)).toMatchObject({ unique: true });
  });

  test('is a no-op when there are no duplicates', async () => {
    await initializeRoles();
    const before = await Role.countDocuments();

    const stats = await dedupeRoles({ apply: true, log: silent });

    expect(stats.refs).toBe(0);
    expect(await Role.countDocuments()).toBe(before);
  });
});

describe('initializeRoles', () => {
  test('heals existing duplicates on boot and keeps user assignments', async () => {
    const { adminA, adminB } = await seedDuplicates();
    const user = oid();
    await UserRole.collection.insertOne({ user, role: adminB });

    await initializeRoles();

    expect(await Role.countDocuments({ ref: 'admin' })).toBe(1);
    expect(await Role.countDocuments({ ref: 'model_member' })).toBe(1);
    expect(await UserRole.exists({ user, role: adminA })).toBeTruthy();
    // The kept copy is brought up to date with the current role definitions.
    const member = await Role.findOne({ ref: 'model_member' }).lean();
    expect(member.name).toBe('Model reader');
    const indexes = await Role.collection.indexes();
    expect(indexes.find((i) => i.key.ref === 1)).toMatchObject({ unique: true });
  });

  test('concurrent runs do not create duplicate roles', async () => {
    await Role.syncIndexes();
    const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
    await Promise.all([initializeRoles(), initializeRoles(), initializeRoles()]);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();

    const dupes = await Role.aggregate([{ $group: { _id: '$ref', n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]);
    expect(dupes).toEqual([]);
  });
});
