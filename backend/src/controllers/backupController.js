// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const backupService = require('../services/backupService');
const ApiError = require('../utils/ApiError');
const { Role, UserRole } = require('../models');

const VALID_SECTIONS = [
  'models',
  'prototypes',
  'plugins',
  'siteConfigs',
  'modelTemplates',
  'dashboardTemplates',
  'customApiSchemas',
  'customApiSets',
  'uploads',
  'imgs',
  'globalCss',
];

async function requireAdmin(userId) {
  const adminRole = await Role.findOne({ ref: 'admin' }).select('_id');
  if (!adminRole) throw new ApiError(httpStatus.FORBIDDEN, 'No admin role configured');
  const isAdmin = await UserRole.exists({ user: userId, role: adminRole._id });
  if (!isAdmin) throw new ApiError(httpStatus.FORBIDDEN, 'Admin access required');
}

/**
 * POST /v2/system/backup
 * Body: { selections: string[] }
 * Returns: ZIP file download
 */
const createBackup = catchAsync(async (req, res) => {
  await requireAdmin(req.user.id);

  const { selections } = req.body;
  if (!Array.isArray(selections) || selections.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'selections must be a non-empty array');
  }

  const invalid = selections.filter((s) => !VALID_SECTIONS.includes(s));
  if (invalid.length > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid sections: ${invalid.join(', ')}`);
  }

  const zipBuffer = await backupService.createBackup(selections);
  const filename = `autowrx-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', zipBuffer.length);
  res.send(zipBuffer);
});

/**
 * POST /v2/system/restore/upload
 * Body: multipart form with field "backup" (ZIP file)
 * Returns: { sessionId, manifest, conflicts }
 */
const uploadBackup = catchAsync(async (req, res) => {
  await requireAdmin(req.user.id);

  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No backup file uploaded');
  }

  const result = await backupService.parseAndDetectConflicts(req.file.buffer);
  res.status(httpStatus.OK).send(result);
});

/**
 * POST /v2/system/restore/apply
 * Body: { sessionId: string, resolutions: Array<{ id, resolution }> }
 * Returns: { imported, skipped, errors }
 */
const applyRestore = catchAsync(async (req, res) => {
  await requireAdmin(req.user.id);

  const { sessionId, resolutions } = req.body;
  if (!sessionId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'sessionId is required');
  }

  const result = await backupService.applyRestore(sessionId, resolutions || [], req.user.id);
  res.status(httpStatus.OK).send(result);
});

module.exports = {
  createBackup,
  uploadBackup,
  applyRestore,
};
