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

// GET endpoints allow optional authentication based on PUBLIC_VIEWING config
// POST, PATCH, DELETE endpoints require authentication
router
  .route('/')
  .post(auth(), validate(customApiSetValidation.createCustomApiSet), customApiSetController.createCustomApiSet)
  .get(
    auth({ optional: (req) => req.authConfig.PUBLIC_VIEWING }),
    validate(customApiSetValidation.listCustomApiSets),
    customApiSetController.getCustomApiSets
  );

router
  .route('/:id')
  .get(
    auth({ optional: (req) => req.authConfig.PUBLIC_VIEWING }),
    validate(customApiSetValidation.getCustomApiSet),
    customApiSetController.getCustomApiSet
  )
  .patch(auth(), validate(customApiSetValidation.updateCustomApiSet), customApiSetController.updateCustomApiSet)
  .delete(auth(), validate(customApiSetValidation.deleteCustomApiSet), customApiSetController.deleteCustomApiSet);

router
  .route('/:id/items')
  .post(auth(), validate(customApiSetValidation.addSetItem), customApiSetController.addSetItem);

router
  .route('/:id/items/:itemId')
  .patch(auth(), validate(customApiSetValidation.updateSetItem), customApiSetController.updateSetItem)
  .delete(auth(), validate(customApiSetValidation.removeSetItem), customApiSetController.removeSetItem);

module.exports = router;

