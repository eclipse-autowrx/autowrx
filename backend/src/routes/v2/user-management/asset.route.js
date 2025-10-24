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
const { assetValidation } = require('../../../validations');
const { assetController } = require('../../../controllers');
const { checkPermission } = require('../../../middlewares/permission');
const { PERMISSIONS, RESOURCES } = require('../../../config/roles');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(assetValidation.createAsset), assetController.createAsset)
  .get(auth(), validate(assetValidation.getAssets), assetController.getAssets);

router
  .route('/manage')
  .get(auth(), checkPermission(PERMISSIONS.ADMIN), validate(assetValidation.getAssets), assetController.getAllAssets);

router
  .route('/:id')
  .get(
    auth(),
    validate(assetValidation.getAsset),
    checkPermission(PERMISSIONS.READ_ASSET, RESOURCES.ASSET),
    assetController.getAsset
  )
  .patch(
    auth(),
    validate(assetValidation.updateAsset),
    checkPermission(PERMISSIONS.WRITE_ASSET, RESOURCES.ASSET),
    assetController.updateAsset
  )
  .delete(
    auth(),
    validate(assetValidation.deleteAsset),
    checkPermission(PERMISSIONS.WRITE_ASSET, RESOURCES.ASSET),
    assetController.deleteAsset
  );

router
  .route('/:id/generate-token')
  .post(
    auth(),
    validate(assetValidation.generateToken),
    checkPermission(PERMISSIONS.READ_ASSET, RESOURCES.ASSET),
    assetController.generateToken
  );

router
  .route('/:id/permissions')
  .post(
    auth(),
    validate(assetValidation.addAuthorizedUser),
    checkPermission(PERMISSIONS.WRITE_ASSET, RESOURCES.ASSET),
    assetController.addAuthorizedUser
  )
  .delete(
    auth(),
    validate(assetValidation.deleteAuthorizedUser),
    checkPermission(PERMISSIONS.WRITE_ASSET, RESOURCES.ASSET),
    assetController.deleteAuthorizedUser
  );

module.exports = router;
