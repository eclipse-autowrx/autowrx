// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, permissionService } = require('../services');
const { Role } = require('../models');
const { PERMISSIONS } = require('../config/roles');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const advanced = pick(req.query, ['search', 'includeFullDetails', 'id']);

  if (advanced.includeFullDetails) {
    // Check if has permission
    if (!(await permissionService.hasPermission(req.user?.id, PERMISSIONS.ADMIN))) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }

  const result = await userService.queryUsers(filter, options, advanced);
  res.send(result);
});

const getSelf = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id, true);
  res.send(user);
});

const getUser = catchAsync(async (req, res) => {
  if (req.query.includeFullDetails) {
    // Check if has permission
    if (req.user?.id !== req.params.userId && !(await permissionService.hasPermission(req.user?.id, PERMISSIONS.ADMIN))) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }
  const user = await userService.getUserById(req.params.userId, req.query.includeFullDetails);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateSelf = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.user.id, req.body);
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getSelf,
  updateSelf,
};
