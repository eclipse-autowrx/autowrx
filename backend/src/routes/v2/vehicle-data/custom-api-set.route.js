// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const validate = require('../../../middlewares/validate');
const customApiSetValidation = require('../../../validations/customApiSet.validation');
const { customApiSetController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');
const { PERMISSIONS } = require('../../../config/roles');

const router = express.Router();

// All endpoints require authentication
router.use(auth());

router
  .route('/')
  .post(validate(customApiSetValidation.createCustomApiSet), customApiSetController.createCustomApiSet)
  .get(validate(customApiSetValidation.listCustomApiSets), customApiSetController.getCustomApiSets);

router
  .route('/:id')
  .get(validate(customApiSetValidation.getCustomApiSet), customApiSetController.getCustomApiSet)
  .patch(validate(customApiSetValidation.updateCustomApiSet), customApiSetController.updateCustomApiSet)
  .delete(validate(customApiSetValidation.deleteCustomApiSet), customApiSetController.deleteCustomApiSet);

router
  .route('/:id/items')
  .post(validate(customApiSetValidation.addSetItem), customApiSetController.addSetItem);

router
  .route('/:id/items/:itemId')
  .patch(validate(customApiSetValidation.updateSetItem), customApiSetController.updateSetItem)
  .delete(validate(customApiSetValidation.removeSetItem), customApiSetController.removeSetItem);

module.exports = router;

