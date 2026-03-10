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
const { pluginValidation } = require('../../../validations');
const { pluginController } = require('../../../controllers');
const upload = require('../../../middlewares/upload');

const router = express.Router();

// Public read endpoints
router.get('/', validate(pluginValidation.listPlugins), pluginController.listPlugins);
// Plugins created by admin users (public)
router.get('/admin', validate(pluginValidation.listPlugins), pluginController.listAdminPlugins);
router.get('/id/:id', validate(pluginValidation.getPlugin), pluginController.getPluginById);
router.get('/slug/:slug', validate(pluginValidation.getPluginBySlug), pluginController.getPluginBySlug);

// Authenticated endpoints
router.use(auth());

// Current user's plugins
router.get('/mine', validate(pluginValidation.listPlugins), pluginController.listMyPlugins);
router.post('/', validate(pluginValidation.createPlugin), pluginController.createPlugin);
router.put('/:id', validate(pluginValidation.updatePlugin), pluginController.updatePlugin);
router.delete('/:id', pluginController.removePlugin);

// Upload and extract internal plugin zip
router.post(
  '/upload/:slug',
  auth(),
  // checkPermission(PERMISSIONS.ADMIN),
  validate(pluginValidation.uploadInternal),
  upload.single('file'),
  pluginController.uploadInternalPlugin,
);

module.exports = router;
