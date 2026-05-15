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
const { prototypeValidation } = require('../../../validations');
const { prototypeController } = require('../../../controllers');
const { checkPermission } = require('../../../middlewares/permission');
const { PERMISSIONS } = require('../../../config/roles');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(prototypeValidation.createPrototype), prototypeController.createPrototype)
  .get(
    auth({
      optional: (req) => req.authConfig.PUBLIC_VIEWING,
    }),
    validate(prototypeValidation.listPrototypes),
    prototypeController.listPrototypes,
  );

router
  .route('/bulk')
  .post(auth(), validate(prototypeValidation.bulkCreatePrototypes), prototypeController.bulkCreatePrototypes);

router.route('/recent').get(auth(), prototypeController.listRecentPrototypes);
router.route('/popular').get(
  auth({
    optional: (req) => req.authConfig.PUBLIC_VIEWING,
  }),
  prototypeController.listPopularPrototypes,
);

router
  .route('/:id')
  .get(
    auth({
      optional: (req) => req.authConfig.PUBLIC_VIEWING,
    }),
    validate(prototypeValidation.getPrototype),
    prototypeController.getPrototype,
  )
  .patch(
    auth(),
    checkPermission(PERMISSIONS.WRITE_MODEL),
    validate(prototypeValidation.updatePrototype),
    prototypeController.updatePrototype,
  )
  .delete(
    auth(),
    checkPermission(PERMISSIONS.WRITE_MODEL),
    validate(prototypeValidation.deletePrototype),
    prototypeController.deletePrototype,
  );

router.route('/:id/execute-code').post(auth(), validate(prototypeValidation.executeCode), prototypeController.executeCode);
router
  .route('/:id/used-apis')
  .get(auth(), validate(prototypeValidation.getUsedApisFromWorkspace), prototypeController.getUsedApisFromWorkspace);

router.route('/:id/workspace-tree').get(auth(), prototypeController.getPrototypeWorkspaceTree);
router
  .route('/:id/files')
  .get(auth(), prototypeController.getPrototypeFileContent)
  .post(auth(), prototypeController.savePrototypeFileContent)
  .delete(auth(), prototypeController.deletePrototypeFileSystemItem)
  .patch(auth(), prototypeController.renamePrototypeFileSystemItem);

router.route('/:id/folders').post(auth(), prototypeController.createPrototypeFolder);

module.exports = router;
