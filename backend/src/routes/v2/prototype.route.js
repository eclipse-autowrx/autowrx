// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { prototypeValidation } = require('../../validations');
const { prototypeController } = require('../../controllers');
const { checkPermission } = require('../../middlewares/permission');
const { PERMISSIONS } = require('../../config/roles');
const config = require('../../config/config');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(prototypeValidation.createPrototype), prototypeController.createPrototype)
  .get(
    auth({
      optional: !config.strictAuth,
    }),
    validate(prototypeValidation.listPrototypes),
    prototypeController.listPrototypes
  );

router
  .route('/bulk')
  .post(auth(), validate(prototypeValidation.bulkCreatePrototypes), prototypeController.bulkCreatePrototypes);

router.route('/recent').get(auth(), prototypeController.listRecentPrototypes);
router.route('/popular').get(
  auth({
    optional: !config.strictAuth,
  }),
  prototypeController.listPopularPrototypes
);

router
  .route('/:id')
  .get(
    auth({
      optional: !config.strictAuth,
    }),
    validate(prototypeValidation.getPrototype),
    prototypeController.getPrototype
  )
  .patch(
    auth(),
    checkPermission(PERMISSIONS.READ_MODEL),
    validate(prototypeValidation.updatePrototype),
    prototypeController.updatePrototype
  )
  .delete(
    auth(),
    checkPermission(PERMISSIONS.READ_MODEL),
    validate(prototypeValidation.deletePrototype),
    prototypeController.deletePrototype
  );

router.route('/:id/execute-code').post(auth(), validate(prototypeValidation.executeCode), prototypeController.executeCode);

module.exports = router;
