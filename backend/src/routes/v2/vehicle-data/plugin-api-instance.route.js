// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const validate = require('../../../middlewares/validate');
const pluginApiInstanceValidation = require('../../../validations/pluginApiInstance.validation');
const { pluginApiInstanceController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');
const { PERMISSIONS } = require('../../../config/roles');

const router = express.Router();

// All endpoints require authentication
router.use(auth());

router
  .route('/')
  .post(validate(pluginApiInstanceValidation.createPluginApiInstance), pluginApiInstanceController.createPluginApiInstance)
  .get(validate(pluginApiInstanceValidation.listPluginApiInstances), pluginApiInstanceController.getPluginApiInstances);

router
  .route('/:id')
  .get(validate(pluginApiInstanceValidation.getPluginApiInstance), pluginApiInstanceController.getPluginApiInstance)
  .patch(validate(pluginApiInstanceValidation.updatePluginApiInstance), pluginApiInstanceController.updatePluginApiInstance)
  .delete(validate(pluginApiInstanceValidation.deletePluginApiInstance), pluginApiInstanceController.deletePluginApiInstance);

router
  .route('/:id/items')
  .post(validate(pluginApiInstanceValidation.addInstanceItem), pluginApiInstanceController.addInstanceItem);

router
  .route('/:id/items/:itemId')
  .patch(validate(pluginApiInstanceValidation.updateInstanceItem), pluginApiInstanceController.updateInstanceItem)
  .delete(validate(pluginApiInstanceValidation.removeInstanceItem), pluginApiInstanceController.removeInstanceItem);

module.exports = router;

