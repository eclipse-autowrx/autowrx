// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { customApiSchemaService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');

const createCustomApiSchema = catchAsync(async (req, res) => {
  const customApiSchema = await customApiSchemaService.createCustomApiSchema(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(customApiSchema);
});

const getCustomApiSchemas = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['code', 'type', 'is_active']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await customApiSchemaService.queryCustomApiSchemas(filter, options);
  res.send(result);
});

const getCustomApiSchema = catchAsync(async (req, res) => {
  const customApiSchema = await customApiSchemaService.getCustomApiSchemaById(req.params.customApiSchemaId);
  res.send(customApiSchema);
});

const updateCustomApiSchema = catchAsync(async (req, res) => {
  const customApiSchema = await customApiSchemaService.updateCustomApiSchemaById(req.params.customApiSchemaId, req.body, req.user.id);
  res.send(customApiSchema);
});

const deleteCustomApiSchema = catchAsync(async (req, res) => {
  await customApiSchemaService.deleteCustomApiSchemaById(req.params.customApiSchemaId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createCustomApiSchema,
  getCustomApiSchemas,
  getCustomApiSchema,
  updateCustomApiSchema,
  deleteCustomApiSchema,
};

