// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { DashboardTemplate } = require('../models');
const ApiError = require('../utils/ApiError');

const create = async (body) => {
  // Ensure only one template is marked as default
  if (body.is_default) {
    await DashboardTemplate.updateMany({ is_default: true }, { is_default: false });
  }
  return DashboardTemplate.create(body);
};

const query = async (filter, options) => {
  return DashboardTemplate.paginate(filter, options);
};

const getById = async (id) => DashboardTemplate.findById(id);

const updateById = async (id, updateBody) => {
  const doc = await getById(id);
  if (!doc) throw new ApiError(httpStatus.NOT_FOUND, 'DashboardTemplate not found');
  // Ensure only one template is marked as default
  if (updateBody.is_default) {
    await DashboardTemplate.updateMany({ is_default: true, _id: { $ne: id } }, { is_default: false });
  }
  Object.assign(doc, updateBody);
  await doc.save({ validateModifiedOnly: true });
  return doc;
};

const removeById = async (id) => {
  const doc = await getById(id);
  if (!doc) throw new ApiError(httpStatus.NOT_FOUND, 'DashboardTemplate not found');
  await doc.deleteOne();
  return doc;
};

module.exports = { create, query, getById, updateById, removeById };
