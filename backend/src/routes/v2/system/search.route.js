// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const { searchController } = require('../../../controllers');
const { searchValidation } = require('../../../validations');
const validate = require('../../../middlewares/validate');
const auth = require('../../../middlewares/auth');
const config = require('../../../config/config');

const router = express.Router();

router.get(
  '/',
  auth({
    optional: !config.strictAuth,
  }),
  validate(searchValidation.search),
  searchController.search
);

router.get(
  '/email/:email',
  auth({
    optional: !config.strictAuth,
  }),
  validate(searchValidation.searchUserByEmail),
  searchController.searchUserByEmail
);

router.get(
  '/prototypes/by-signal/:signal',
  auth({
    optional: !config.strictAuth,
  }),
  validate(searchValidation.searchPrototypesBySignal),
  searchController.searchPrototypesBySignal
);

module.exports = router;
