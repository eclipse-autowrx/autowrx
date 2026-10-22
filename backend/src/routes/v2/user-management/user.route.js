// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const auth = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const userValidation = require('../../../validations/user.validation');
const userController = require('../../../controllers/user.controller');

const { checkPermission } = require('../../../middlewares/permission');
const { PERMISSIONS } = require('../../../config/roles');

const router = express.Router();

router
  .route('/')
  .post(auth(), checkPermission(PERMISSIONS.ADMIN), validate(userValidation.createUser), userController.createUser)
  .get(
    auth({
      optional: (req) => req.authConfig.PUBLIC_VIEWING,
    }),
    validate(userValidation.getUsers),
    userController.getUsers,
  );

router
  .route('/self')
  .get(auth(), userController.getSelf)
  .patch(
    auth(),
    validate(userValidation.updateSelfUser),
    (req, res, next) => {
      // Check if password management is enabled when user tries to update password
      if (req.body.password && !req.authConfig.PASSWORD_MANAGEMENT) {
        const ApiError = require('../../../utils/ApiError');
        const httpStatus = require('http-status');
        return next(new ApiError(httpStatus.FORBIDDEN, 'Password management is disabled. Contact administrator.'));
      }
      next();
    },
    userController.updateSelf,
  );

router
  .route('/:userId')
  .get(
    auth({
      optional: (req) => req.authConfig.PUBLIC_VIEWING,
    }),
    validate(userValidation.getUser),
    userController.getUser,
  )
  .patch(auth(), checkPermission(PERMISSIONS.ADMIN), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth(), checkPermission(PERMISSIONS.ADMIN), validate(userValidation.deleteUser), userController.deleteUser);

module.exports = router;
