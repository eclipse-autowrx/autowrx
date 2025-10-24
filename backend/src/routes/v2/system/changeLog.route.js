// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const config = require('../../../config/config');
const { PERMISSIONS } = require('../../../config/roles');
const { changeLogController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');
const router = require('express').Router();

router.route('/').get(
  auth({
    optional: !config.strictAuth,
  }),
  checkPermission(PERMISSIONS.ADMIN),
  changeLogController.listChangeLogs
);

module.exports = router;
