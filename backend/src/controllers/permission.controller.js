// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const permissionService = require('../services/permission.service');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');

const hasPermission = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['permissions']);
  filter.permissions = filter.permissions || '';
  const permissionQueries = filter.permissions.split(',').map((permission) => permission.split(':'));
  const results = await Promise.all(
    permissionQueries.map((query) => permissionService.hasPermission(req.user.id, query[0], query[1]))
  );
  res.json(results);
});

const getPermissions = catchAsync(async (req, res) => {
  const permissions = await permissionService.getPermissions();
  res.json(permissions);
});

const assignRoleToUser = catchAsync(async (req, res) => {
  const { user, role, ref } = req.body;
  const userRole = await permissionService.assignRoleToUser(user, role, ref);
  res.status(201).json(userRole);
});

const getUserRoles = catchAsync(async (req, res) => {
  const roles = await permissionService.getUserRoles(req.params.user);
  res.json(roles);
});

const getSelfRoles = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['ref']);
  const roles = await permissionService.getUserRoles(req.user.id, filter);
  res.json(roles);
});

const getRoleUsers = catchAsync(async (req, res) => {
  const users = await permissionService.getRoleUsers();
  res.json(users);
});

const getRoles = catchAsync(async (req, res) => {
  const roles = await permissionService.getRoles();
  res.json(roles);
});

const removeRoleFromUser = catchAsync(async (req, res) => {
  await permissionService.removeRoleFromUser(req.query.user, req.query.role);
  res.status(204).send();
});

module.exports = {
  assignRoleToUser,
  getUserRoles,
  getRoleUsers,
  getSelfRoles,
  hasPermission,
  getRoles,
  getPermissions,
  removeRoleFromUser,
};
