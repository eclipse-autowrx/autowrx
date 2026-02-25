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
const pluginRoute = require('./plugin.route');
const modelTemplateRoute = require('./modelTemplate.route');
const dashboardTemplateRoute = require('./dashboardTemplate.route');
const customApiSchemaRoute = require('./custom-api-schema.route');

const router = express.Router();

// System Routes
router.use('/search', searchRoute);
router.use('/change-logs', changeLogRoute);
router.use('/file', fileRoute);
router.use('/site-config', siteManagementRoute);
router.use('/plugin', pluginRoute);
router.use('/model-template', modelTemplateRoute);
router.use('/dashboard-template', dashboardTemplateRoute);
router.use('/custom-api-schema', customApiSchemaRoute);
// Backward/compat path to match docs and frontend
router.use('/system/plugin', pluginRoute);
router.use('/system/model-template', modelTemplateRoute);
router.use('/system/dashboard-template', dashboardTemplateRoute);
router.use('/system/site-management', siteManagementRoute);
router.use('/system/custom-api-schema', customApiSchemaRoute);

module.exports = router;
