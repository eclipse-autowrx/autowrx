// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { customApiSetService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');

const createCustomApiSet = catchAsync(async (req, res) => {
  const set = await customApiSetService.createSet(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(set);
});

const getCustomApiSets = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['custom_api_schema_code', 'scope', 'owner', 'name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await customApiSetService.querySets(filter, options, req.user?.id);
  res.send(result);
});

const getCustomApiSet = catchAsync(async (req, res) => {
  const set = await customApiSetService.getSetById(req.params.id, req.user?.id);
  res.send(set);
});

const updateCustomApiSet = catchAsync(async (req, res) => {
  const set = await customApiSetService.updateSetById(req.params.id, req.body, req.user.id);
  res.send(set);
});

const deleteCustomApiSet = catchAsync(async (req, res) => {
  await customApiSetService.deleteSetById(req.params.id, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const addSetItem = catchAsync(async (req, res) => {
  const set = await customApiSetService.addSetItem(req.params.id, req.body.item, req.user.id);
  res.send(set);
});

const updateSetItem = catchAsync(async (req, res) => {
  const set = await customApiSetService.updateSetItem(
    req.params.id,
    req.params.itemId,
    req.body.item,
    req.user.id
  );
  res.send(set);
});

const removeSetItem = catchAsync(async (req, res) => {
  const set = await customApiSetService.removeSetItem(req.params.id, req.params.itemId, req.user.id);
  res.send(set);
});

module.exports = {
  createCustomApiSet,
  getCustomApiSets,
  getCustomApiSet,
  updateCustomApiSet,
  deleteCustomApiSet,
  addSetItem,
  updateSetItem,
  removeSetItem,
};

