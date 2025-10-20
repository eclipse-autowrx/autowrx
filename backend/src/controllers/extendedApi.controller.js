// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { extendedApiService, permissionService } = require('../services');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const { PERMISSIONS } = require('../config/roles');

const createExtendedApi = catchAsync(async (req, res) => {
  if (!(await permissionService.hasPermission(req.user?.id, PERMISSIONS.WRITE_MODEL, req.body.model))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden. You do not have permission to update extended API for this model');
  }
  const extendedApi = await extendedApiService.createExtendedApi(req.body);
  res.status(httpStatus.CREATED).send(extendedApi);
});

const getExtendedApis = catchAsync(async (req, res) => {
  const { model } = req.query;
  if (!(await permissionService.canAccessModel(req.user?.id, model))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  const filter = pick(req.query, ['apiName', 'model', 'skeleton']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await extendedApiService.queryExtendedApis(filter, options);
  res.send(result);
});

const getExtendedApi = catchAsync(async (req, res) => {
  const extendedApi = await extendedApiService.getExtendedApiById(req.params.id);
  const { model } = extendedApi;
  if (!(await permissionService.canAccessModel(req.user?.id, model))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  if (!extendedApi) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ExtendedApi not found');
  }
  res.send(extendedApi);
});

const getExtendedApiByApiNameAndModel = catchAsync(async (req, res) => {
  const { apiName, model } = req.query;
  if (!(await permissionService.canAccessModel(req.user?.id, model))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  const extendedApi = await extendedApiService.getExtendedApiByApiNameAndModel(apiName, model);
  if (!extendedApi) {
    throw new ApiError(httpStatus.NOT_FOUND, 'ExtendedApi not found');
  }
  res.send(extendedApi);
});

const updateExtendedApi = catchAsync(async (req, res) => {
  const extendedApi = await extendedApiService.updateExtendedApiById(req.params.id, req.body, req.user.id);
  res.send(extendedApi);
});

const deleteExtendedApi = catchAsync(async (req, res) => {
  await extendedApiService.deleteExtendedApiById(req.params.id, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createExtendedApi,
  getExtendedApis,
  getExtendedApi,
  updateExtendedApi,
  deleteExtendedApi,
  getExtendedApiByApiNameAndModel,
};
