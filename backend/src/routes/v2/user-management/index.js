// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const userRoute = require('./user.route');
const authRoute = require('./auth.route');
const assetRoute = require('./asset.route');
const permissionRoute = require('./permission.route');

const router = express.Router();

// User Management Routes
router.use('/users', userRoute);
router.use('/auth', authRoute);
router.use('/assets', assetRoute);
router.use('/permissions', permissionRoute);

module.exports = router;
