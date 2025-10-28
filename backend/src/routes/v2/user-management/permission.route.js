// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');

const router = express.Router();
const permissionController = require('../../../controllers/permission.controller');
const validate = require('../../../middlewares/validate');
const { permissionValidation } = require('../../../validations');
const auth = require('../../../middlewares/auth');
const { PERMISSIONS } = require('../../../config/roles');
const { checkPermission } = require('../../../middlewares/permission');

router.get('/self', auth(), validate(permissionValidation.getSelfUsers), permissionController.getSelfRoles);
router.get('/', auth(), validate(permissionValidation.getPermissions), permissionController.getPermissions);
// router.get('/', auth(), validate(permissionValidation.hasPermission), permissionController.hasPermission);
router.get('/has-permission', auth(), validate(permissionValidation.hasPermission), permissionController.hasPermission);
router.get('/roles', auth(), permissionController.getRoles);
router.get('/users-by-roles', auth(), checkPermission(PERMISSIONS.ADMIN), permissionController.getRoleUsers);
router
  .route('/')
  .post(
    auth(),
    checkPermission(PERMISSIONS.ADMIN),
    validate(permissionValidation.assignRoleToUser),
    permissionController.assignRoleToUser
  )
  .delete(
    auth(),
    checkPermission(PERMISSIONS.ADMIN),
    validate(permissionValidation.removeRoleFromUser),
    permissionController.removeRoleFromUser
  );

module.exports = router;
