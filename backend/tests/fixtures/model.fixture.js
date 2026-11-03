// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { faker } = require('@faker-js/faker');
const { Model } = require('../../src/models');

const insertModel = async ({ created_by, visibility = 'private', ...rest }) =>
  Model.create({
    name: faker.vehicle.model(),
    main_api: 'Vehicle',
    vehicle_category: 'Car',
    visibility,
    created_by,
    ...rest,
  });

module.exports = {
  insertModel,
};
