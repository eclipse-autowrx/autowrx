// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const multer = require('multer');
const auth = require('../../../middlewares/auth');
const backupController = require('../../../controllers/backupController');

const router = express.Router();

// Use memory storage so we get the buffer directly (no temp file needed for restore upload)
const memUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit for backup files
});

// All backup/restore endpoints require authentication (admin check is done inside controllers)
router.use(auth());

// Download a backup ZIP
router.post('/', backupController.createBackup);

// Upload a backup ZIP for analysis (returns conflict report + sessionId)
router.post('/restore/upload', memUpload.single('backup'), backupController.uploadBackup);

// Apply restore with conflict resolutions
router.post('/restore/apply', backupController.applyRestore);

module.exports = router;
