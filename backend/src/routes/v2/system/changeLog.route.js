// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const router = require('express').Router();
const { PERMISSIONS } = require('../../../config/roles');
const { changeLogController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');

router.route('/').get(
  auth({
    optional: (req) => req.authConfig.PUBLIC_VIEWING,
  }),
  checkPermission(PERMISSIONS.ADMIN),
  changeLogController.listChangeLogs,
);

module.exports = router;
