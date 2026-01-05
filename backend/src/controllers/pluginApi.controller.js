// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { pluginApiService } = require('../services');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');

const createPluginAPI = catchAsync(async (req, res) => {
  const pluginAPI = await pluginApiService.createPluginAPI(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(pluginAPI);
});

const getPluginAPIs = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['code', 'type', 'is_active']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await pluginApiService.queryPluginAPIs(filter, options);
  res.send(result);
});

const getPluginAPI = catchAsync(async (req, res) => {
  const pluginAPI = await pluginApiService.getPluginAPIById(req.params.pluginApiId);
  res.send(pluginAPI);
});

const updatePluginAPI = catchAsync(async (req, res) => {
  const pluginAPI = await pluginApiService.updatePluginAPIById(req.params.pluginApiId, req.body, req.user.id);
  res.send(pluginAPI);
});

const deletePluginAPI = catchAsync(async (req, res) => {
  await pluginApiService.deletePluginAPIById(req.params.pluginApiId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createPluginAPI,
  getPluginAPIs,
  getPluginAPI,
  updatePluginAPI,
  deletePluginAPI,
};

