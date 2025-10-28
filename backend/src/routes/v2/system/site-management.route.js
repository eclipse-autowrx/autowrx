// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const validate = require('../../../middlewares/validate');
const siteConfigValidation = require('../../../validations/siteConfig.validation');
const siteConfigController = require('../../../controllers/siteConfig.controller');
const config = require('../../../config/config');
const auth = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');
const { PERMISSIONS } = require('../../../config/roles');

const router = express.Router();

// Public routes (no authentication required)
router.get('/public', siteConfigController.getPublicSiteConfigs);
router.get('/public/:key', siteConfigController.getSiteConfigValue);

// Scoped public routes
router.get('/public/:scope/:target_id', siteConfigController.getPublicConfigsByScope);
router.get('/public/:scope/:target_id/:key', siteConfigController.getPublicConfigValueByScope);

// Admin-only routes (require authentication and admin permission)
router.use(auth(), checkPermission(PERMISSIONS.ADMIN));

// CRUD operations for site configs
router
  .route('/')
  .post(
    validate(siteConfigValidation.createSiteConfig),
    siteConfigController.createSiteConfig
  )
  .get(
    validate(siteConfigValidation.getSiteConfigs),
    siteConfigController.getSiteConfigs
  );

// Get all site configs (including secret ones) - admin only
router.get('/all', siteConfigController.getAllSiteConfigs);

// Scoped admin routes
router.get('/:scope/:target_id', siteConfigController.getConfigsByScope);
router.get('/:scope/:target_id/all', siteConfigController.getAllConfigsByScope);

// Get multiple configs by keys
router.post('/by-keys', 
  validate(siteConfigValidation.getSiteConfigsByKeys),
  siteConfigController.getSiteConfigsByKeys
);

// Bulk upsert configs
router.post('/bulk-upsert',
  validate(siteConfigValidation.bulkUpsertSiteConfigs),
  siteConfigController.bulkUpsertSiteConfigs
);

// Global CSS admin endpoints
router.get('/global-css', siteConfigController.getGlobalCss);
router.put('/global-css', siteConfigController.updateGlobalCss);

// Individual config operations by ID
router
  .route('/:siteConfigId')
  .get(
    validate(siteConfigValidation.getSiteConfig),
    siteConfigController.getSiteConfig
  )
  .patch(
    validate(siteConfigValidation.updateSiteConfig),
    siteConfigController.updateSiteConfig
  )
  .delete(
    validate(siteConfigValidation.deleteSiteConfig),
    siteConfigController.deleteSiteConfig
  );

// Individual config operations by key
router
  .route('/key/:key')
  .get(
    validate(siteConfigValidation.getSiteConfigByKey),
    siteConfigController.getSiteConfigByKey
  )
  .patch(
    validate(siteConfigValidation.updateSiteConfigByKey),
    siteConfigController.updateSiteConfigByKey
  )
  .delete(
    validate(siteConfigValidation.deleteSiteConfigByKey),
    siteConfigController.deleteSiteConfigByKey
  );

module.exports = router;
