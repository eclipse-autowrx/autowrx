// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const searchRoute = require('./search.route');
const changeLogRoute = require('./changeLog.route');
const fileRoute = require('./file.route');
const siteManagementRoute = require('./site-management.route');

const router = express.Router();

// System Routes
router.use('/search', searchRoute);
router.use('/change-logs', changeLogRoute);
router.use('/file', fileRoute);
router.use('/site-config', siteManagementRoute);

module.exports = router;
