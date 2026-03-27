// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

const express = require('express');
const auth = require('../../middlewares/auth');
const { checkPermission } = require('../../middlewares/permission');
const { PERMISSIONS } = require('../../config/roles');
const { instanceSnapshotService } = require('../../services');

const router = express.Router();

/**
 * GET /v2/instance/export
 * Export a full instance snapshot as a zip bundle.
 * Admin only.
 */
router.get('/export', auth(), checkPermission(PERMISSIONS.ADMIN), async (req, res, next) => {
  try {
    const instanceName = req.query.name || 'autowrx-instance';
    await instanceSnapshotService.exportSnapshot(res, instanceName);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
