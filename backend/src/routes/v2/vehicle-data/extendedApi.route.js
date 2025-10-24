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
const extendedApiValidation = require('../../../validations/extendedApi.validation');
const extendedApiController = require('../../../controllers/extendedApi.controller');
const config = require('../../../config/config');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(extendedApiValidation.createExtendedApi), extendedApiController.createExtendedApi)
  .get(
    auth({
      optional: !config.strictAuth,
    }),
    validate(extendedApiValidation.getExtendedApis),
    extendedApiController.getExtendedApis
  );

router.route('/by-api-and-model').get(
  auth({
    optional: !config.strictAuth,
  }),
  validate(extendedApiValidation.getExtendedApiByApiNameAndModel),
  extendedApiController.getExtendedApiByApiNameAndModel
);

router
  .route('/:id')
  .get(
    auth({
      optional: !config.strictAuth,
    }),
    validate(extendedApiValidation.getExtendedApi),
    extendedApiController.getExtendedApi
  )
  .patch(auth(), validate(extendedApiValidation.updateExtendedApi), extendedApiController.updateExtendedApi)
  .delete(auth(), validate(extendedApiValidation.deleteExtendedApi), extendedApiController.deleteExtendedApi);

module.exports = router;
