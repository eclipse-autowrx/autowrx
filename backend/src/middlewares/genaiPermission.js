// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { permissionService } = require('../services');
const { PERMISSIONS } = require('../config/roles');
const ApiError = require('../utils/ApiError');

const hasGenAIPermission = async (userId) => {
  if (!userId) {
    return false;
  }

  return permissionService.hasPermission(userId, PERMISSIONS.GENERATIVE_AI);
};

const genaiPermission = async (req, _, next) => {
  const { user } = req.body;

  if (!(await hasGenAIPermission(user || req.user?.id))) {
    return next(new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to use GenAI service'));
  }
  next();
};

module.exports = genaiPermission;
