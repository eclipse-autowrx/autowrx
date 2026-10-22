// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Importing src/config/rolesV2 (directly or via permission.service) opens a Casbin MongoDB connection at
// module load. That connection is never closed by the tests and keeps Jest from exiting on its own, so close
// it after each test file that loaded the module.

const mockRolesV2Path = require.resolve('../../src/config/rolesV2');

let mockLoadedRolesV2 = null;

jest.mock('../../src/config/rolesV2', () => {
  mockLoadedRolesV2 = jest.requireActual(mockRolesV2Path);
  return mockLoadedRolesV2;
});

afterAll(async () => {
  if (mockLoadedRolesV2) {
    await mockLoadedRolesV2.closeRolesClient();
    mockLoadedRolesV2 = null;
  }
});
