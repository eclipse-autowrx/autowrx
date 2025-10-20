// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { permissionService } = require('../services');
const ApiError = require('../utils/ApiError');

/**
 *
 * @param {string} permission
 * @param {string} [type]
 */
function checkPermission(permission, type) {
  return async (req, res, next) => {
    const { user } = req;
    const { id: paramId, modelId: paramModelId, prototypeId: paramPrototypeId } = req.params;
    const id = paramId || paramModelId || paramPrototypeId;
    try {
      const isAuthorized = await permissionService.hasPermission(user.id, permission, id, type);
      if (!isAuthorized) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  checkPermission,
};
