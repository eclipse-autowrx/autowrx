// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Client = require('mongodb').MongoClient;

const connect = async (url) => {
  const client = new Client(url, { useUnifiedTopology: true });
  await client.connect();
  return client.db();
};

const main = async () => {
  db = await connect('mongodb://etas-prod-playground-db:27017/playground-be');
  const models = await db
    .collection('models')
    .find({
      custom_apis: {
        $exists: true,
      },
    })
    .toArray();

  await db.collection('models').updateMany({ api_version: { $exists: false } }, { $set: { api_version: 'v4.1' } });

  const before = await db.collection('extendedapis').count();
  console.log('Before:', before);
  const promises = [];

  models.forEach(async (model) => {
    const custom_apis = model.custom_apis;
    custom_apis.forEach(async (custom_api) => {
      const newData = {
        apiName: custom_api.name,
        model: model._id,
        skeleton: custom_api.skeleton || '{}',
        tags: custom_api.tags || [],
        type: custom_api.type || 'branch',
        datatype: custom_api.datatype || (custom_api.type !== 'branch' ? 'string' : null),
        description: custom_api.description || '',
        isWishlist: true
      };
      promises.push(db.collection('extendedapis').insertOne(newData));
    });
  });

  await Promise.allSettled(promises).catch((err) => console.error(err));
  const after = await db.collection('extendedapis').count();
  console.log('after:', after);
};

main();
