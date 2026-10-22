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

const router = express.Router();

router.get(
  '/',
  auth({
    optional: (req) => req.authConfig.PUBLIC_VIEWING,
  }),
  validate(searchValidation.search),
  searchController.search,
);

router.get(
  '/email/:email',
  auth({
    optional: (req) => req.authConfig.PUBLIC_VIEWING,
  }),
  validate(searchValidation.searchUserByEmail),
  searchController.searchUserByEmail,
);

router.get(
  '/prototypes/by-signal/:signal',
  auth({
    optional: (req) => req.authConfig.PUBLIC_VIEWING,
  }),
  validate(searchValidation.searchPrototypesBySignal),
  searchController.searchPrototypesBySignal,
);

module.exports = router;
