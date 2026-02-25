// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

const express = require('express');
const auth = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const { dashboardTemplateController } = require('../../../controllers');
const { dashboardTemplateValidation } = require('../../../validations');
const { checkPermission } = require('../../../middlewares/permission');
const { PERMISSIONS } = require('../../../config/roles');

const router = express.Router();

// Public read endpoints (anyone can list/get public templates)
router.route('/').get(validate(dashboardTemplateValidation.list), dashboardTemplateController.list);

router.route('/:id').get(validate(dashboardTemplateValidation.get), dashboardTemplateController.getById);

// Admin-only write endpoints
router.use(auth(), checkPermission(PERMISSIONS.ADMIN));

router.route('/').post(validate(dashboardTemplateValidation.create), dashboardTemplateController.create);

router
  .route('/:id')
  .put(validate(dashboardTemplateValidation.update), dashboardTemplateController.update)
  .delete(validate(dashboardTemplateValidation.remove), dashboardTemplateController.remove);

module.exports = router;
