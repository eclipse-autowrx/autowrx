// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const userManagementRoutes = require('./user-management');
const vehicleDataRoutes = require('./vehicle-data');
const contentRoutes = require('./content');
const systemRoutes = require('./system');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/',
    route: userManagementRoutes,
  },
  {
    path: '/',
    route: vehicleDataRoutes,
  },
  {
    path: '/',
    route: contentRoutes,
  },
  {
    path: '/',
    route: systemRoutes,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
