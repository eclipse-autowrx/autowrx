#!/usr/bin/env node
// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * AutoWRX Backup CLI
 *
 * Usage:
 *   node scripts/backup-cli.js backup [--output <path>] [--sections <list>]
 *   node scripts/backup-cli.js restore <file> [--replace-all | --skip-all]
 *
 * Examples:
 *   node scripts/backup-cli.js backup --output /backups/latest.zip
 *   node scripts/backup-cli.js restore /backups/latest.zip --replace-all
 *   node scripts/backup-cli.js backup --sections models,plugins,siteConfigs
 */

/* eslint-disable no-console, no-await-in-loop */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load .env from backend root
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = require('../src/config/config');
const backupService = require('../src/services/backupService');
const initializeRoles = require('../src/scripts/initializeRoles');
const assignAdmins = require('../src/scripts/assignAdmins');
const { userService } = require('../src/services');

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

function printHelp() {
  console.log(`
AutoWRX Backup CLI
==================

Usage:
  node scripts/backup-cli.js <command> [options]

Commands:
  backup
    --output  <path>    Output ZIP file path (default: ./backup-<timestamp>.zip)
    --sections <list>   Comma-separated sections to include (default: all)
                        Available sections: ${VALID_SECTIONS.join(', ')}

  restore <file>
    --replace-all       Replace all conflicting items with backup data
    --skip-all          Skip all conflicting items, keep existing (default)

Examples:
  node scripts/backup-cli.js backup
  node scripts/backup-cli.js backup --output /usr/src/playground-be/backups/latest.zip
  node scripts/backup-cli.js backup --sections models,plugins,siteConfigs
  node scripts/backup-cli.js restore /usr/src/playground-be/backups/latest.zip --replace-all
  node scripts/backup-cli.js restore /usr/src/playground-be/backups/latest.zip --skip-all

Docker usage (run inside container):
  docker exec <container> node scripts/backup-cli.js backup --output /usr/src/playground-be/backups/latest.zip
  docker exec <container> node scripts/backup-cli.js restore /usr/src/playground-be/backups/restore.zip --replace-all
`);
}

function argValue(args, flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}

async function connect() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);
  console.log('[backup-cli] Connected to MongoDB');
}

async function runBackup(args) {
  const outputArg = argValue(args, '--output');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = outputArg || path.join(process.cwd(), `backup-${timestamp}.zip`);

  const sectionsArg = argValue(args, '--sections');
  const sections = sectionsArg ? sectionsArg.split(',').map((s) => s.trim()) : VALID_SECTIONS;

  const invalid = sections.filter((s) => !VALID_SECTIONS.includes(s));
  if (invalid.length > 0) {
    console.error(`[backup-cli] Invalid sections: ${invalid.join(', ')}`);
    console.error(`[backup-cli] Valid sections: ${VALID_SECTIONS.join(', ')}`);
    process.exit(1);
  }

  console.log(`[backup-cli] Creating backup for sections: ${sections.join(', ')}`);
  const buffer = await backupService.createBackup(sections);

  const resolvedPath = path.resolve(outputPath);
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(resolvedPath, buffer);
  const sizeMB = (buffer.length / 1024 / 1024).toFixed(2);
  console.log(`[backup-cli] Backup saved to: ${resolvedPath} (${sizeMB} MB)`);
}

async function getAdminUserId() {
  await initializeRoles();
  await assignAdmins();
  const adminEmails = config.adminEmails;
  if (!adminEmails || !adminEmails.length) return null;
  const user = await userService.getUserByEmail(adminEmails[0]);
  return user ? String(user.id || user._id) : null;
}

async function runRestore(args, userId) {
  const filePath = args[0];
  if (!filePath) {
    console.error('[backup-cli] Error: backup file path is required');
    console.error('[backup-cli] Usage: node scripts/backup-cli.js restore <file> [--replace-all | --skip-all]');
    process.exit(1);
  }

  const resolvedFile = path.resolve(filePath);
  if (!fs.existsSync(resolvedFile)) {
    console.error(`[backup-cli] Error: file not found: ${resolvedFile}`);
    process.exit(1);
  }

  const replaceAll = args.includes('--replace-all');

  console.log(`[backup-cli] Analyzing backup: ${resolvedFile}`);
  const buf = fs.readFileSync(resolvedFile);
  const { sessionId, manifest, conflicts } = await backupService.parseAndDetectConflicts(buf);

  console.log(`[backup-cli] Backup created:  ${manifest.createdAt}`);
  console.log(`[backup-cli] Sections:        ${manifest.sections.join(', ')}`);
  const totalRecords = Object.values(manifest.counts).reduce((a, b) => a + b, 0);
  console.log(`[backup-cli] Total records:   ${totalRecords}`);

  const totalConflicts = Object.values(conflicts).reduce(
    (sum, items) => sum + (items?.length ?? 0),
    0,
  );
  console.log(`[backup-cli] Conflicts found: ${totalConflicts}`);

  if (totalConflicts > 0) {
    if (replaceAll) {
      console.log('[backup-cli] Resolution:      replace all conflicts');
    } else {
      console.log('[backup-cli] Resolution:      skip all conflicts (use --replace-all to override)');
    }
  }

  // Build resolutions list from all conflict sections
  const resolutions = [];
  for (const items of Object.values(conflicts)) {
    for (const item of items ?? []) {
      resolutions.push({ id: item.id, resolution: replaceAll ? 'replace' : 'skip' });
    }
  }

  console.log('[backup-cli] Applying restore...');
  const result = await backupService.applyRestore(sessionId, resolutions, userId);

  console.log('\n[backup-cli] === Restore Results ===');
  let totalImported = 0;
  let totalSkipped = 0;
  for (const [section, count] of Object.entries(result.imported)) {
    if (count > 0) {
      console.log(`[backup-cli]   Imported  ${section}: ${count}`);
      totalImported += count;
    }
  }
  for (const [section, count] of Object.entries(result.skipped)) {
    if (count > 0) {
      console.log(`[backup-cli]   Skipped   ${section}: ${count}`);
      totalSkipped += count;
    }
  }
  if (result.errors.length > 0) {
    console.error(`[backup-cli]   Errors: ${result.errors.length}`);
    for (const err of result.errors) {
      console.error(`[backup-cli]     [${err.type}] ${err.error}`);
    }
  }
  console.log(`[backup-cli] Done: ${totalImported} imported, ${totalSkipped} skipped, ${result.errors.length} errors`);
}

async function main() {
  const [, , command, ...args] = process.argv;

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    process.exit(0);
  }

  await connect();

  try {
    if (command === 'backup') {
      await runBackup(args);
    } else if (command === 'restore') {
      const userId = await getAdminUserId();
      console.log(`[backup-cli] Restore owner: ${userId || '(none — created_by kept from backup)'}`);
      await runRestore(args, userId);
    } else {
      console.error(`[backup-cli] Unknown command: ${command}`);
      console.error('[backup-cli] Run with --help for usage');
      process.exit(1);
    }
  } finally {
    await mongoose.disconnect();
    console.log('[backup-cli] Disconnected from MongoDB');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('[backup-cli] Fatal error:', err.message);
  process.exit(1);
});
