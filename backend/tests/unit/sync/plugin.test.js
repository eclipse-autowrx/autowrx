// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

jest.mock('../../../src/config/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));

const mockHandlerSync = jest.fn();

jest.mock('../../../sync-handlers/default.handler.js', () => ({
  name: 'mock-handler',
  sync: (...args) => mockHandlerSync(...args),
}));

// Writes the change log to the database, which these tests do not have.
jest.mock('../../../src/models/plugins/captureChange.plugin', () => ({
  captureUpdates: (next) => next(),
  captureCreate: () => {},
  captureRemove: () => {},
}));

const mongoose = require('mongoose');
// Compile the models before anything else, as the startup scripts do.
const { Api, ExtendedApi, Model } = require('../../../src/models');

const modelId = new mongoose.Types.ObjectId();
const userId = new mongoose.Types.ObjectId();

const cases = [
  [
    'Model',
    Model,
    {
      _id: modelId,
      name: 'Car',
      main_api: 'Vehicle',
      vehicle_category: 'Passenger cars',
      visibility: 'private',
      created_by: userId,
    },
    { name: 'Truck' },
  ],
  [
    'ExtendedApi',
    ExtendedApi,
    { apiName: 'Vehicle.Speed', model: modelId, skeleton: '', type: 'sensor', datatype: 'float' },
    { description: 'Updated' },
  ],
  ['Api', Api, { model: modelId, cvi: { Vehicle: {} }, created_by: userId }, { cvi: { Vehicle: { a: 1 } } }],
];

const event = () => {
  const [{ action, resourceType, modelId: id }] = mockHandlerSync.mock.calls[0];
  return { action, resourceType, modelId: id };
};

describe.each(cases)('%s sync hooks', (resourceType, MongooseModel, body, change) => {
  beforeEach(() => {
    mockHandlerSync.mockReset().mockResolvedValue(undefined);
    jest.spyOn(MongooseModel.collection, 'insertOne').mockResolvedValue({ acknowledged: true });
    jest
      .spyOn(MongooseModel.collection, 'updateOne')
      .mockResolvedValue({ acknowledged: true, matchedCount: 1, modifiedCount: 1 });
    jest.spyOn(MongooseModel.collection, 'deleteOne').mockResolvedValue({ acknowledged: true, deletedCount: 1 });
  });

  afterEach(() => jest.restoreAllMocks());

  const expected = (action) => ({ action, resourceType, modelId: String(modelId) });

  it('syncs a created document', async () => {
    await new MongooseModel(body).save();

    expect(mockHandlerSync).toHaveBeenCalledTimes(1);
    expect(event()).toEqual(expected('CREATE'));
  });

  it('syncs an updated document', async () => {
    const doc = MongooseModel.hydrate({ _id: modelId, ...body });
    doc.set(change);
    await doc.save();

    expect(mockHandlerSync).toHaveBeenCalledTimes(1);
    expect(event()).toEqual(expected('UPDATE'));
  });

  it('syncs a deleted document', async () => {
    await MongooseModel.hydrate({ _id: modelId, ...body }).deleteOne();

    expect(mockHandlerSync).toHaveBeenCalledTimes(1);
    expect(event()).toEqual(expected('DELETE'));
  });

  it('does not fail the write when the sync fails', async () => {
    mockHandlerSync.mockRejectedValue(new Error('GenAI is down'));

    await expect(new MongooseModel(body).save()).resolves.toBeTruthy();
  });
});
