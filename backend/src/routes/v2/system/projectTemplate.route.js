// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

const express = require('express');
const auth = require('../../../middlewares/auth');
const validate = require('../../../middlewares/validate');
const { projectTemplateController } = require('../../../controllers');
const { projectTemplateValidation } = require('../../../validations');
const { checkPermission } = require('../../../middlewares/permission');
const { PERMISSIONS } = require('../../../config/roles');

const router = express.Router();

// Public read endpoints (anyone can list/get public templates)
router.route('/').get(validate(projectTemplateValidation.list), projectTemplateController.list);

router.route('/:id').get(validate(projectTemplateValidation.get), projectTemplateController.getById);

// Admin-only write endpoints
router.use(auth(), checkPermission(PERMISSIONS.ADMIN));

router.route('/').post(validate(projectTemplateValidation.create), projectTemplateController.create);

router
  .route('/:id')
  .put(validate(projectTemplateValidation.update), projectTemplateController.update)
  .delete(validate(projectTemplateValidation.remove), projectTemplateController.remove);

module.exports = router;
