// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { assetService, tokenService, permissionService } = require('../services');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');
const { PERMISSIONS, ROLES, RESOURCES } = require('../config/roles');

const createAsset = catchAsync(async (req, res) => {
  const asset = await assetService.createAsset({
    ...req.body,
    created_by: req.user.id,
  });
  res.send(asset);
});

const getAssets = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const filter = pick(req.query, ['name', 'type']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await assetService.queryAssets(filter, options, userId);
  res.send(result);
});

const getAllAssets = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'type']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await assetService.queryAssets(filter, options);
  res.send(result);
});

const getAsset = catchAsync(async (req, res) => {
  let asset = await assetService.getAssetById(req.params.id);
  if (!asset) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
  }

  if (await permissionService.hasPermission(req.user.id, PERMISSIONS.WRITE_ASSET, req.params.id, RESOURCES.ASSET)) {
    asset = asset.toJSON();

    const readAccessUsers = await permissionService.listAuthorizedUser({
      ref: req.params.id,
      role: ROLES.read_asset.ref,
    });
    asset.readAccessUsers = readAccessUsers;

    const writeAccessUsers = await permissionService.listAuthorizedUser({
      ref: req.params.id,
      role: ROLES.write_asset.ref,
    });
    asset.writeAccessUsers = writeAccessUsers;
  }

  res.send(asset);
});

const updateAsset = catchAsync(async (req, res) => {
  const asset = await assetService.updateAsset(req.params.id, req.body);
  if (!asset) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
  }
  res.status(200).send();
});

const deleteAsset = catchAsync(async (req, res) => {
  const asset = await assetService.deleteAsset(req.params.id);
  if (!asset) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
  }
  res.status(200).send();
});

const generateToken = catchAsync(async (req, res) => {
  const asset = await assetService.getAssetById(req.params.id);
  if (!asset) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
  }
  const tokens = await tokenService.generateAuthTokens(asset);
  delete tokens.refresh;
  res.send({ tokens });
});

const addAuthorizedUser = catchAsync(async (req, res) => {
  const userIds = req.body.userId.split(',');
  const promises = userIds.map((userId) => assetService.addAuthorizedUser(req.params.id, { userId, role: req.body.role }));
  await Promise.all(promises).catch((err) => {
    throw new ApiError(httpStatus.BAD_REQUEST, err.message);
  });
  res.status(httpStatus.CREATED).send();
});

const deleteAuthorizedUser = catchAsync(async (req, res) => {
  await assetService.deleteAuthorizedUser(req.params.id, {
    role: req.query.role,
    userId: req.query.userId,
  });
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createAsset,
  getAssets,
  updateAsset,
  getAsset,
  deleteAsset,
  generateToken,
  addAuthorizedUser,
  deleteAuthorizedUser,
  getAllAssets,
};
