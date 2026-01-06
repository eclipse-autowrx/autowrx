// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const prototypeRoute = require('./prototype.route');
const modelRoute = require('./model.route');
const apiRoute = require('./api.route');
const extendedApiRoute = require('./extendedApi.route');
const customApiSetRoute = require('./custom-api-set.route');

const router = express.Router();

// Vehicle Data Routes
router.use('/prototypes', prototypeRoute);
router.use('/models', modelRoute);
router.use('/apis', apiRoute);
router.use('/extendedApis', extendedApiRoute);
router.use('/custom-api-sets', customApiSetRoute);

module.exports = router;
