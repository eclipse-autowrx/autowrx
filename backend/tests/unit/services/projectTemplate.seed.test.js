// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

jest.mock('../../../src/models', () => ({
  ProjectTemplate: { bulkWrite: jest.fn(), estimatedDocumentCount: jest.fn() },
  ProjectTemplateSeed: { find: jest.fn(), bulkWrite: jest.fn() },
}));
jest.mock('../../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

const { ProjectTemplate, ProjectTemplateSeed } = require('../../../src/models');
const { seedProjectTemplates } = require('../../../src/services/projectTemplate.service');

const TPLS = [
  { name: 'A', description: 'a', data: '{}' },
  { name: 'B', data: '{}' },
];
const seeded = (...keys) =>
  ProjectTemplateSeed.find.mockReturnValue({ lean: () => Promise.resolve(keys.map((key) => ({ key }))) });

describe('seedProjectTemplates', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    ProjectTemplate.bulkWrite.mockResolvedValue({ upsertedCount: 1 });
    ProjectTemplateSeed.bulkWrite.mockResolvedValue({});
  });

  test('fresh database: inserts every template and records it', async () => {
    seeded();
    ProjectTemplate.estimatedDocumentCount.mockResolvedValue(0);
    await seedProjectTemplates(TPLS, 'u1');
    expect(ProjectTemplate.bulkWrite.mock.calls[0][0].map((o) => o.updateOne.filter.name)).toEqual(['A', 'B']);
    expect(ProjectTemplateSeed.bulkWrite).toHaveBeenCalledTimes(1);
  });

  test('already seeded templates are not re-created (deleted stays deleted)', async () => {
    seeded('A', 'B');
    ProjectTemplate.estimatedDocumentCount.mockResolvedValue(0);
    await seedProjectTemplates(TPLS, 'u1');
    expect(ProjectTemplate.bulkWrite).not.toHaveBeenCalled();
    expect(ProjectTemplateSeed.bulkWrite).not.toHaveBeenCalled();
  });

  test('a template added in a later release is seeded once', async () => {
    seeded('A');
    ProjectTemplate.estimatedDocumentCount.mockResolvedValue(1);
    await seedProjectTemplates(TPLS, 'u1');
    expect(ProjectTemplate.bulkWrite.mock.calls[0][0].map((o) => o.updateOne.filter)).toEqual([{ name: 'B' }]);
  });

  test('legacy database: marks as seeded without inserting', async () => {
    seeded();
    ProjectTemplate.estimatedDocumentCount.mockResolvedValue(3);
    await seedProjectTemplates(TPLS, 'u1');
    expect(ProjectTemplate.bulkWrite).not.toHaveBeenCalled();
    expect(ProjectTemplateSeed.bulkWrite.mock.calls[0][0]).toHaveLength(2);
  });

  test('skips without a system user; swallows db errors', async () => {
    await seedProjectTemplates(TPLS, null);
    expect(ProjectTemplateSeed.find).not.toHaveBeenCalled();
    ProjectTemplateSeed.find.mockImplementation(() => {
      throw new Error('boom');
    });
    await expect(seedProjectTemplates(TPLS, 'u1')).resolves.toBeUndefined();
  });
});
