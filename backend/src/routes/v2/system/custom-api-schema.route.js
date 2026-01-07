// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const validate = require('../../../middlewares/validate');
const customApiSchemaValidation = require('../../../validations/customApiSchema.validation');
const { customApiSchemaController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');
const { PERMISSIONS } = require('../../../config/roles');

const router = express.Router();

// Public read endpoints
router
  .route('/')
  .get(validate(customApiSchemaValidation.listCustomApiSchemas), customApiSchemaController.getCustomApiSchemas);

router
  .route('/:customApiSchemaId')
  .get(validate(customApiSchemaValidation.getCustomApiSchema), customApiSchemaController.getCustomApiSchema);

// Admin-only write endpoints
router.use(auth(), checkPermission(PERMISSIONS.ADMIN));

router
  .route('/')
  .post(validate(customApiSchemaValidation.createCustomApiSchema), customApiSchemaController.createCustomApiSchema);

router
  .route('/:customApiSchemaId')
  .patch(validate(customApiSchemaValidation.updateCustomApiSchema), customApiSchemaController.updateCustomApiSchema)
  .delete(validate(customApiSchemaValidation.deleteCustomApiSchema), customApiSchemaController.deleteCustomApiSchema);

module.exports = router;

