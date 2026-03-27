// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

/**
 * Instance Snapshot Service
 *
 * Handles export and import (seed) of instance configuration bundles.
 * A snapshot captures everything an admin has customized:
 *   - Site configs (key-value, non-secret)
 *   - Uploaded files (logos, covers, etc.)
 *   - Plugins
 *   - Model templates
 *   - Dashboard templates
 *
 * Export: admin clicks "Export Snapshot" → downloads zip bundle
 * Import: bundle placed in /instance/ volume → seeded on server startup
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { SiteConfig, Plugin, ModelTemplate, DashboardTemplate } = require('../models');
const logger = require('../config/logger');

// Path to the mounted instance volume
const INSTANCE_DIR = path.join(__dirname, '../../instance');
const INSTANCE_SEED_DIR = path.join(INSTANCE_DIR, 'seed');
const INSTANCE_MANIFEST = path.join(INSTANCE_DIR, 'manifest.json');
const INSTANCE_SITE_CONFIGS = path.join(INSTANCE_DIR, 'site-configs.json');

// Static dirs served by the BE
const STATIC_DIR = path.join(__dirname, '../../static');
const STATIC_UPLOADS_DIR = path.join(STATIC_DIR, 'uploads');
const STATIC_IMAGES_DIR = path.join(STATIC_DIR, 'images');
const STATIC_PLUGIN_DIR = path.join(STATIC_DIR, 'plugin');
const STATIC_GLOBAL_CSS = path.join(STATIC_DIR, 'global.css');

/**
 * Export a full instance snapshot as a zip stream.
 * @param {import('express').Response} res - Express response (pipe zip directly)
 * @param {string} instanceName - Name for the snapshot (used in manifest)
 */
const exportSnapshot = async (res, instanceName = 'autowrx-instance') => {
  const safeName = instanceName.replace(/[^a-zA-Z0-9\-_]/g, '-').slice(0, 80) || 'autowrx-instance';

  const archive = archiver('zip', { zlib: { level: 6 } });

  archive.on('error', (err) => {
    logger.error('[Export] Archive error:', err.message);
    if (!res.headersSent) res.status(500).json({ message: 'Export failed' });
    else res.end();
  });

  res.on('error', (err) => {
    logger.error('[Export] Response stream error:', err.message);
    archive.destroy();
  });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}-snapshot.zip"`);
  archive.pipe(res);

  // 1. Manifest
  const manifest = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    instanceName: safeName,
    contents: ['site-configs.json', 'uploads/', 'global.css', 'plugin/', 'seed/plugins.json', 'seed/model-templates.json', 'seed/dashboard-templates.json'],
  };
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

  // 2. Site configs (non-secret only)
  const siteConfigs = await SiteConfig.find({ scope: 'site', secret: false }).lean();
  const configsExport = siteConfigs.map(({ key, value, valueType, description, category, secret }) => ({
    key, value, valueType, description, category, secret,
  }));
  archive.append(JSON.stringify(configsExport, null, 2), { name: 'site-configs.json' });

  // 3. User-uploaded files (date-based directories)
  if (fs.existsSync(STATIC_UPLOADS_DIR)) {
    archive.directory(STATIC_UPLOADS_DIR, 'uploads');
  }

  // 3b. global.css
  if (fs.existsSync(STATIC_GLOBAL_CSS)) {
    archive.file(STATIC_GLOBAL_CSS, { name: 'global.css' });
  }

  // 3c. Plugin JS files
  if (fs.existsSync(STATIC_PLUGIN_DIR)) {
    archive.directory(STATIC_PLUGIN_DIR, 'plugin');
  }

  // 4. Plugins
  const plugins = await Plugin.find({}).lean();
  const pluginsExport = plugins.map(({ name, slug, image, description, apis, config, tags, type }) => ({
    name, slug, image, description, apis, config, tags, type,
  }));
  archive.append(JSON.stringify(pluginsExport, null, 2), { name: 'seed/plugins.json' });

  // 5. Model templates (public + default)
  const modelTemplates = await ModelTemplate.find({ visibility: { $in: ['public', 'default'] } }).lean();
  const modelTemplatesExport = modelTemplates.map(({ name, description, image, visibility, config }) => ({
    name, description, image, visibility: visibility === 'default' ? 'default' : 'public', config,
  }));
  archive.append(JSON.stringify(modelTemplatesExport, null, 2), { name: 'seed/model-templates.json' });

  // 6. Dashboard templates (public)
  const dashboardTemplates = await DashboardTemplate.find({ visibility: 'public' }).lean();
  const dashboardTemplatesExport = dashboardTemplates.map(({ name, description, visibility, widget_config }) => ({
    name, description, visibility, widget_config,
  }));
  archive.append(JSON.stringify(dashboardTemplatesExport, null, 2), { name: 'seed/dashboard-templates.json' });

  await archive.finalize();
};

/** Strip MongoDB internal fields that must not appear in $setOnInsert upserts. */
function stripMongoFields({ _id, __v, createdAt, updatedAt, ...rest }) {
  return rest;
}

/**
 * Resolve file paths supporting both bundle formats:
 *   new: site-configs.json / uploads/ / seed/plugins.json
 *   old: data/site-configs.json / files/uploads/ / data/plugins.json
 */
function resolvePaths(instanceDir) {
  const newSiteConfigs = path.join(instanceDir, 'site-configs.json');
  const isNewFormat = fs.existsSync(newSiteConfigs);
  return {
    isNewFormat,
    siteConfigs: isNewFormat
      ? newSiteConfigs
      : path.join(instanceDir, 'data', 'site-configs.json'),
    uploads: isNewFormat
      ? path.join(instanceDir, 'uploads')
      : path.join(instanceDir, 'files', 'uploads'),
    globalCss: isNewFormat
      ? path.join(instanceDir, 'global.css')
      : path.join(instanceDir, 'files', 'global.css'),
    imgs: isNewFormat
      ? null
      : path.join(instanceDir, 'files', 'imgs'),
    pluginFiles: isNewFormat
      ? path.join(instanceDir, 'plugin')
      : path.join(instanceDir, 'files', 'plugins'),
    plugins: isNewFormat
      ? path.join(instanceDir, 'seed', 'plugins.json')
      : path.join(instanceDir, 'data', 'plugins.json'),
    modelTemplates: isNewFormat
      ? path.join(instanceDir, 'seed', 'model-templates.json')
      : path.join(instanceDir, 'data', 'model-templates.json'),
    dashboardTemplates: isNewFormat
      ? path.join(instanceDir, 'seed', 'dashboard-templates.json')
      : path.join(instanceDir, 'data', 'dashboard-templates.json'),
  };
}

/**
 * Seed instance from /instance/ volume on server startup.
 * Reads manifest.json to confirm bundle is present, then seeds each category.
 * Supports both the new snapshot format and the legacy backup format.
 * Uses $setOnInsert / upsert logic — never overwrites admin-customized data.
 * @param {string|null} systemUserId - ID of the first admin user (for created_by/updated_by)
 */
const seedFromInstanceBundle = async (systemUserId) => {
  if (!fs.existsSync(INSTANCE_MANIFEST)) {
    logger.info('[Instance] No instance bundle found — skipping instance seed.');
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(INSTANCE_MANIFEST, 'utf8'));
    const label = manifest.instanceName || manifest.createdAt || 'unknown';
    logger.info(`[Instance] Found bundle: "${label}"`);
  } catch (e) {
    logger.warn('[Instance] Could not parse manifest.json — skipping instance seed.');
    return;
  }

  const paths = resolvePaths(INSTANCE_DIR);
  logger.info(`[Instance] Detected ${paths.isNewFormat ? 'new snapshot' : 'legacy backup'} format.`);

  // 1. Seed site configs
  if (fs.existsSync(paths.siteConfigs)) {
    try {
      const configs = JSON.parse(fs.readFileSync(paths.siteConfigs, 'utf8'));
      if (Array.isArray(configs) && configs.length > 0) {
        const ops = configs.map((cfg) => ({
          updateOne: {
            filter: { key: cfg.key, scope: 'site' },
            update: {
              $setOnInsert: {
                key: cfg.key,
                scope: 'site',
                value: cfg.value,
                valueType: cfg.valueType || 'string',
                secret: cfg.secret || false,
                description: cfg.description || '',
                category: cfg.category || 'general',
                ...(systemUserId && { created_by: systemUserId, updated_by: systemUserId }),
              },
            },
            upsert: true,
          },
        }));
        await SiteConfig.bulkWrite(ops, { ordered: false });
        logger.info(`[Instance] Seeded ${configs.length} site configs.`);
      }
    } catch (e) {
      logger.error('[Instance] Failed to seed site-configs.json:', e.message);
    }
  }

  // Helper: move files from src → dest (copy new files, then remove src)
  const moveRecursive = (src, dest) => {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        moveRecursive(srcPath, destPath);
        fs.rmdirSync(srcPath);
      } else {
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
        fs.unlinkSync(srcPath);
      }
    }
  };

  // 2. Move uploaded files (date-based directories)
  if (fs.existsSync(paths.uploads)) {
    try {
      moveRecursive(paths.uploads, STATIC_UPLOADS_DIR);
      fs.rmdirSync(paths.uploads);
      logger.info('[Instance] Moved uploaded files.');
    } catch (e) {
      logger.error('[Instance] Failed to move uploads:', e.message);
    }
  }

  // 2b. Move global.css (legacy only)
  if (paths.globalCss && fs.existsSync(paths.globalCss)) {
    try {
      fs.copyFileSync(paths.globalCss, STATIC_GLOBAL_CSS);
      fs.unlinkSync(paths.globalCss);
      logger.info('[Instance] Moved global.css.');
    } catch (e) {
      logger.error('[Instance] Failed to move global.css:', e.message);
    }
  }

  // 2c. Move static images (legacy only)
  if (paths.imgs && fs.existsSync(paths.imgs)) {
    try {
      moveRecursive(paths.imgs, STATIC_IMAGES_DIR);
      fs.rmdirSync(paths.imgs);
      logger.info('[Instance] Moved static images.');
    } catch (e) {
      logger.error('[Instance] Failed to move static images:', e.message);
    }
  }

  // 2d. Move plugin files (legacy only)
  if (paths.pluginFiles && fs.existsSync(paths.pluginFiles)) {
    try {
      moveRecursive(paths.pluginFiles, STATIC_PLUGIN_DIR);
      fs.rmdirSync(paths.pluginFiles);
      logger.info('[Instance] Moved plugin files.');
    } catch (e) {
      logger.error('[Instance] Failed to move plugin files:', e.message);
    }
  }

  // 3. Seed plugins
  if (fs.existsSync(paths.plugins)) {
    try {
      const plugins = JSON.parse(fs.readFileSync(paths.plugins, 'utf8'));
      if (Array.isArray(plugins) && plugins.length > 0) {
        const ops = plugins.filter((p) => p.slug).map((plugin) => ({
          updateOne: {
            filter: { slug: plugin.slug },
            update: { $setOnInsert: { ...stripMongoFields(plugin), created_by: systemUserId, updated_by: systemUserId } },
            upsert: true,
          },
        }));
        await Plugin.bulkWrite(ops, { ordered: false });
        logger.info(`[Instance] Seeded ${plugins.length} plugins.`);
      }
    } catch (e) {
      logger.error('[Instance] Failed to seed plugins.json:', e.message);
    }
  }

  // 4. Seed model templates
  if (fs.existsSync(paths.modelTemplates)) {
    try {
      const templates = JSON.parse(fs.readFileSync(paths.modelTemplates, 'utf8'));
      if (Array.isArray(templates) && templates.length > 0) {
        const ops = templates.filter((t) => t.name).map((tpl) => ({
          updateOne: {
            filter: { name: tpl.name },
            update: { $setOnInsert: { ...stripMongoFields(tpl), created_by: systemUserId, updated_by: systemUserId } },
            upsert: true,
          },
        }));
        await ModelTemplate.bulkWrite(ops, { ordered: false });
        logger.info(`[Instance] Seeded ${templates.length} model templates.`);
      }
    } catch (e) {
      logger.error('[Instance] Failed to seed model-templates.json:', e.message);
    }
  }

  // 5. Seed dashboard templates
  if (fs.existsSync(paths.dashboardTemplates)) {
    try {
      const templates = JSON.parse(fs.readFileSync(paths.dashboardTemplates, 'utf8'));
      if (Array.isArray(templates) && templates.length > 0) {
        const ops = templates.filter((t) => t.name).map((tpl) => ({
          updateOne: {
            filter: { name: tpl.name },
            update: { $setOnInsert: { ...stripMongoFields(tpl), created_by: systemUserId, updated_by: systemUserId } },
            upsert: true,
          },
        }));
        await DashboardTemplate.bulkWrite(ops, { ordered: false });
        logger.info(`[Instance] Seeded ${templates.length} dashboard templates.`);
      }
    } catch (e) {
      logger.error('[Instance] Failed to seed dashboard-templates.json:', e.message);
    }
  }

  // Cleanup: remove bundle data from instance dir so it is not re-applied on next restart.
  // Static files were already moved above. Remove JSON seed files and the manifest.
  try {
    const removeIfExists = (p) => { if (fs.existsSync(p)) fs.unlinkSync(p); };
    const removeDirIfEmpty = (p) => { try { fs.rmdirSync(p); } catch (_) {} };

    removeIfExists(paths.siteConfigs);
    removeIfExists(paths.plugins);
    removeIfExists(paths.modelTemplates);
    removeIfExists(paths.dashboardTemplates);
    removeIfExists(INSTANCE_MANIFEST);

    // Remove now-empty seed/ or data/ subdirectories
    removeDirIfEmpty(path.join(INSTANCE_DIR, 'seed'));
    removeDirIfEmpty(path.join(INSTANCE_DIR, 'data'));
    removeDirIfEmpty(path.join(INSTANCE_DIR, 'files'));

    logger.info('[Instance] Bundle data cleaned up from instance directory.');
  } catch (e) {
    logger.warn('[Instance] Could not fully clean up instance directory:', e.message);
  }

  logger.info('[Instance] Instance bundle seed complete.');
};

module.exports = { exportSnapshot, seedFromInstanceBundle };
