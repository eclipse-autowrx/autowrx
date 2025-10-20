// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { apiService } = require('../services');
const catchAsync = require('../utils/catchAsync');

const createApi = catchAsync(async (req, res) => {
  const newApi = await apiService.createApi({
    model: req.body.model,
    cvi: JSON.parse(req.body.cvi),
    created_by: req.user.id,
  });
  res.status(httpStatus.CREATED).send(newApi);
});

const getApi = catchAsync(async (req, res) => {
  const api = await apiService.getApi(req.params.id);
  res.send(api);
});

const getApiByModelId = catchAsync(async (req, res) => {
  const api = await apiService.getApiByModelId(req.params.modelId);
  res.send(api);
});

const updateApi = catchAsync(async (req, res) => {
  const updatedApi = await apiService.updateApi(req.params.id, req.body, req.user.id);
  res.send(updatedApi);
});

const deleteApi = catchAsync(async (req, res) => {
  await apiService.deleteApi(req.params.id, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const listVSSVersions = catchAsync(async (req, res) => {
  const versions = await apiService.listVSSVersions();
  res.send(versions);
});

const getVSSVersion = catchAsync(async (req, res) => {
  const version = await apiService.getVSSVersion(req.params.name);
  res.send(version);
});

module.exports = {
  createApi,
  getApiByModelId,
  getApi,
  updateApi,
  deleteApi,
  listVSSVersions,
  getVSSVersion,
};
