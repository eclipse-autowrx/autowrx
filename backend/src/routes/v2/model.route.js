// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const validate = require('../../middlewares/validate');
const modelValidation = require('../../validations/model.validation');
const { modelController } = require('../../controllers');
const auth = require('../../middlewares/auth');
const { checkPermission } = require('../../middlewares/permission');
const { PERMISSIONS } = require('../../config/roles');
const config = require('../../config/config');
const { model } = require('mongoose');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(modelValidation.createModel), modelController.createModel)
  .get(
    auth({
      optional: !config.strictAuth,
    }),
    validate(modelValidation.listModels),
    modelController.listModels
  );

router.route('/all').get(
  auth({
    optional: !config.strictAuth,
  }),
  validate(modelValidation.listAllModels),
  modelController.listAllModels
);

router
  .route('/:id')
  .get(
    auth({
      optional: !config.strictAuth,
    }),
    validate(modelValidation.getModel),
    modelController.getModel
  )
  .patch(
    auth(),
    checkPermission(PERMISSIONS.WRITE_MODEL),
    validate(modelValidation.updateModel),
    modelController.updateModel
  )
  .delete(
    auth(),
    checkPermission(PERMISSIONS.WRITE_MODEL),
    validate(modelValidation.deleteModel),
    modelController.deleteModel
  );

router
  .route('/:id/replace-api')
  .post(auth(), checkPermission(PERMISSIONS.WRITE_MODEL), validate(modelValidation.replaceApi), modelController.replaceApi);

router.route('/:id/api').get(
  auth({
    optional: !config.strictAuth,
  }),
  validate(modelValidation.getApiByModelId),
  modelController.getComputedVSSApi
);

router.route('/:id/api/:apiName').get(auth({ optional: !config.strictAuth }), modelController.getApiDetail);

router
  .route('/:id/permissions')
  .post(
    auth(),
    checkPermission(PERMISSIONS.WRITE_MODEL),
    validate(modelValidation.addAuthorizedUser),
    modelController.addAuthorizedUser
  )
  .delete(
    auth(),
    checkPermission(PERMISSIONS.WRITE_MODEL),
    validate(modelValidation.deleteAuthorizedUser),
    modelController.deleteAuthorizedUser
  );

module.exports = router;
