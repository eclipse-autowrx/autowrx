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
const coderController = require('../../../controllers/coder.controller');
const { coderValidation } = require('../../../validations');

const router = express.Router();

router.route('/workspace/:prototypeId').get(auth(), validate(coderValidation.getWorkspace), coderController.getWorkspace);

router
  .route('/workspace/:prototypeId/prepare')
  .post(auth(), validate(coderValidation.prepareWorkspace), coderController.prepareWorkspace);

router
  .route('/workspace/:prototypeId/trigger-run')
  .post(auth(), validate(coderValidation.triggerRun), coderController.triggerRun);

router
  .route('/workspace/:prototypeId/run-output')
  .get(auth(), validate(coderValidation.getRunOutput), coderController.getRunOutput);

module.exports = router;
