// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { apiController } = require('../../controllers');
const { apiValidation } = require('../../validations');
const config = require('../../config/config');

const router = express.Router();

router.route('/vss').get(apiController.listVSSVersions);
router.route('/vss/:name').get(validate(apiValidation.getVSSVersion), apiController.getVSSVersion);

router.route('/').post(auth(), validate(apiValidation.createApi), apiController.createApi);
router
  .route('/:id')
  .get(
    auth({
      optional: !config.strictAuth,
    }),
    validate(apiValidation.getApi),
    apiController.getApi
  )
  .patch(auth(), validate(apiValidation.updateApi), apiController.updateApi)
  .delete(auth(), validate(apiValidation.deleteApi), apiController.deleteApi);
router.route('/model_id/:modelId').get(validate(apiValidation.getApiByModelId), apiController.getApiByModelId);

module.exports = router;
