// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { ModelTemplate } = require('../models');
const ApiError = require('../utils/ApiError');

let legacyDefaultMigrationPromise;

const migrateLegacyDefaultVisibility = async () => {
  if (!legacyDefaultMigrationPromise) {
    legacyDefaultMigrationPromise = ModelTemplate.updateMany(
      { visibility: 'default' },
      { $set: { is_default: true, visibility: 'public' } },
    ).catch((error) => {
      legacyDefaultMigrationPromise = undefined;
      throw error;
    });
  }
  return legacyDefaultMigrationPromise;
};

const clearOtherDefaults = async (excludeId) => {
  const filter = { is_default: true };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  await ModelTemplate.updateMany(filter, { is_default: false });
};

const create = async (body) => {
  await migrateLegacyDefaultVisibility();
  if (body.is_default) {
    await clearOtherDefaults();
  }
  return ModelTemplate.create(body);
};

const query = async (filter, options) => {
  await migrateLegacyDefaultVisibility();
  return ModelTemplate.paginate(filter, options);
};

const getById = async (id) => {
  await migrateLegacyDefaultVisibility();
  return ModelTemplate.findById(id);
};

const updateById = async (id, updateBody) => {
  await migrateLegacyDefaultVisibility();
  const doc = await ModelTemplate.findById(id);
  if (!doc) throw new ApiError(httpStatus.NOT_FOUND, 'ModelTemplate not found');
  if (updateBody.is_default) {
    await clearOtherDefaults(id);
  }
  Object.assign(doc, updateBody);
  await doc.save();
  return doc;
};

const removeById = async (id) => {
  const doc = await getById(id);
  if (!doc) throw new ApiError(httpStatus.NOT_FOUND, 'ModelTemplate not found');
  await doc.deleteOne();
  return doc;
};

module.exports = { create, query, getById, updateById, removeById };
