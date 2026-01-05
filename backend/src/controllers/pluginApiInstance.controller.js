// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { pluginApiInstanceService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');

const createPluginApiInstance = catchAsync(async (req, res) => {
  const instance = await pluginApiInstanceService.createInstance(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(instance);
});

const getPluginApiInstances = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['plugin_api_code', 'scope', 'owner', 'name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await pluginApiInstanceService.queryInstances(filter, options, req.user?.id);
  res.send(result);
});

const getPluginApiInstance = catchAsync(async (req, res) => {
  const instance = await pluginApiInstanceService.getInstanceById(req.params.id, req.user?.id);
  res.send(instance);
});

const updatePluginApiInstance = catchAsync(async (req, res) => {
  const instance = await pluginApiInstanceService.updateInstanceById(req.params.id, req.body, req.user.id);
  res.send(instance);
});

const deletePluginApiInstance = catchAsync(async (req, res) => {
  await pluginApiInstanceService.deleteInstanceById(req.params.id, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const addInstanceItem = catchAsync(async (req, res) => {
  const instance = await pluginApiInstanceService.addInstanceItem(req.params.id, req.body.item, req.user.id);
  res.send(instance);
});

const updateInstanceItem = catchAsync(async (req, res) => {
  const instance = await pluginApiInstanceService.updateInstanceItem(
    req.params.id,
    req.params.itemId,
    req.body.item,
    req.user.id
  );
  res.send(instance);
});

const removeInstanceItem = catchAsync(async (req, res) => {
  const instance = await pluginApiInstanceService.removeInstanceItem(req.params.id, req.params.itemId, req.user.id);
  res.send(instance);
});

module.exports = {
  createPluginApiInstance,
  getPluginApiInstances,
  getPluginApiInstance,
  updatePluginApiInstance,
  deletePluginApiInstance,
  addInstanceItem,
  updateInstanceItem,
  removeInstanceItem,
};

