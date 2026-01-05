// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const validate = require('../../../middlewares/validate');
const pluginApiValidation = require('../../../validations/pluginApi.validation');
const { pluginApiController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');
const { PERMISSIONS } = require('../../../config/roles');

const router = express.Router();

// Public read endpoints
router
  .route('/')
  .get(validate(pluginApiValidation.listPluginAPIs), pluginApiController.getPluginAPIs);

router
  .route('/:pluginApiId')
  .get(validate(pluginApiValidation.getPluginAPI), pluginApiController.getPluginAPI);

// Admin-only write endpoints
router.use(auth(), checkPermission(PERMISSIONS.ADMIN));

router
  .route('/')
  .post(validate(pluginApiValidation.createPluginAPI), pluginApiController.createPluginAPI);

router
  .route('/:pluginApiId')
  .patch(validate(pluginApiValidation.updatePluginAPI), pluginApiController.updatePluginAPI)
  .delete(validate(pluginApiValidation.deletePluginAPI), pluginApiController.deletePluginAPI);

module.exports = router;

