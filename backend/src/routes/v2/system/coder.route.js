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
const { checkPermission } = require('../../../middlewares/permission');
const coderController = require('../../../controllers/coder.controller');
const { coderValidation } = require('../../../validations');
const { PERMISSIONS } = require('../../../config/roles');

const router = express.Router();

router.route('/workspace/:prototypeId').get(auth(), validate(coderValidation.getWorkspace), coderController.getWorkspace);

router
  .route('/workspace/:prototypeId/prepare')
  .post(auth(), validate(coderValidation.prepareWorkspace), coderController.prepareWorkspace);

router
  .route('/workspace/:prototypeId/trigger-run')
  .post(auth(), validate(coderValidation.triggerRun), coderController.triggerRun);

router
  .route('/workspace/:prototypeId/runtime-state')
  .get(auth(), validate(coderValidation.getRuntimeState), coderController.getRuntimeState);

router
  .route('/workspaces/me')
  .get(auth(), coderController.listMyWorkspaces);

router
  .route('/workspaces/admin')
  .get(auth(), checkPermission(PERMISSIONS.ADMIN), coderController.listAdminWorkspaces);

router
  .route('/workspaces/:workspaceId/start')
  .post(auth(), validate(coderValidation.manageWorkspaceById), coderController.startMyWorkspace);

router
  .route('/workspaces/:workspaceId/stop')
  .post(auth(), validate(coderValidation.manageWorkspaceById), coderController.stopMyWorkspace);

router
  .route('/workspaces/:workspaceId')
  .delete(auth(), validate(coderValidation.manageWorkspaceById), coderController.deleteMyWorkspace);

router
  .route('/workspaces/admin/:workspaceId/start')
  .post(
    auth(),
    checkPermission(PERMISSIONS.ADMIN),
    validate(coderValidation.manageWorkspaceById),
    coderController.startAdminWorkspace,
  );

router
  .route('/workspaces/admin/:workspaceId/stop')
  .post(
    auth(),
    checkPermission(PERMISSIONS.ADMIN),
    validate(coderValidation.manageWorkspaceById),
    coderController.stopAdminWorkspace,
  );

router
  .route('/workspaces/admin/:workspaceId')
  .delete(
    auth(),
    checkPermission(PERMISSIONS.ADMIN),
    validate(coderValidation.manageWorkspaceById),
    coderController.deleteAdminWorkspace,
  );

module.exports = router;
