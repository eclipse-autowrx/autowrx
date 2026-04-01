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
const { SiteConfig, Plugin, ModelTemplate, DashboardTemplate, Model, Prototype } = require('../models');
const logger = require('../config/logger');

// Path to the mounted instance volume — configurable via INSTANCE_PATH env var
const INSTANCE_DIR = process.env.INSTANCE_PATH || path.join(__dirname, '../../instance');
const INSTANCE_MANIFEST = path.join(INSTANCE_DIR, 'manifest.json');

// Backend data directory (VSS JSON files) — same __dirname-relative base as api.service.js
const BACKEND_DATA_DIR = path.join(__dirname, '../../data');

// Static dirs served by the BE — same __dirname-relative base as app.js
const STATIC_DIR = path.join(__dirname, '../../static');
const STATIC_UPLOADS_DIR = path.join(STATIC_DIR, 'uploads');
const STATIC_IMAGES_DIR = path.join(STATIC_DIR, 'images');
const STATIC_PLUGIN_DIR = path.join(STATIC_DIR, 'plugin');
const STATIC_BUILTIN_WIDGETS_DIR = path.join(STATIC_DIR, 'builtin-widgets');
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
    contents: ['site-configs.json', 'uploads/', 'imgs/', 'global.css', 'plugin/', 'builtin-widgets/', 'vss/', 'seed/plugins.json', 'seed/model-templates.json', 'seed/dashboard-templates.json', 'seed/models.json', 'seed/prototypes.json'],
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

  // 3b. global.css — always include (empty string if not customised yet)
  if (fs.existsSync(STATIC_GLOBAL_CSS)) {
    archive.file(STATIC_GLOBAL_CSS, { name: 'global.css' });
  } else {
    archive.append('', { name: 'global.css' });
  }

  // 3c-bis. Static images (/imgs/ — logos, default model/prototype images, etc.)
  if (fs.existsSync(STATIC_IMAGES_DIR)) {
    archive.directory(STATIC_IMAGES_DIR, 'imgs');
  }

  // 3c. Plugin JS files
  if (fs.existsSync(STATIC_PLUGIN_DIR)) {
    archive.directory(STATIC_PLUGIN_DIR, 'plugin');
  }

  // 3d. Builtin widget files
  if (fs.existsSync(STATIC_BUILTIN_WIDGETS_DIR)) {
    archive.directory(STATIC_BUILTIN_WIDGETS_DIR, 'builtin-widgets');
  }

  // 3e. VSS data files (vss.json catalog + all vX.Y.json version files)
  const vssListPath = path.join(BACKEND_DATA_DIR, 'vss.json');
  if (fs.existsSync(vssListPath)) {
    archive.file(vssListPath, { name: 'vss/vss.json' });
    try {
      const vssList = JSON.parse(fs.readFileSync(vssListPath, 'utf8'));
      if (Array.isArray(vssList)) {
        for (const entry of vssList) {
          const vssFilePath = path.join(BACKEND_DATA_DIR, `${entry.name}.json`);
          if (fs.existsSync(vssFilePath)) {
            archive.file(vssFilePath, { name: `vss/${entry.name}.json` });
          }
        }
      }
    } catch (e) {
      logger.warn('[Export] Could not enumerate VSS version files:', e.message);
    }
  }

  // 4. Plugins
  const plugins = await Plugin.find({}).lean();
  const pluginsExport = plugins.map(({ name, slug, image, description, is_internal, url, config, type }) => ({
    name, slug, image, description, is_internal, url, config, type,
  }));
  archive.append(JSON.stringify(pluginsExport, null, 2), { name: 'seed/plugins.json' });

  // 5. Model templates (public + default) — preserve _id so model.model_template_id refs stay valid
  const modelTemplates = await ModelTemplate.find({ visibility: { $in: ['public', 'default'] } }).lean();
  const modelTemplatesExport = modelTemplates.map(({ _id, name, description, image, visibility, config }) => ({
    _id, name, description, image, visibility: visibility === 'default' ? 'default' : 'public', config,
  }));
  archive.append(JSON.stringify(modelTemplatesExport, null, 2), { name: 'seed/model-templates.json' });

  // 6. Dashboard templates (public) — preserve _id for stable references
  const dashboardTemplates = await DashboardTemplate.find({ visibility: { $in: ['public', 'default'] } }).lean();
  const dashboardTemplatesExport = dashboardTemplates.map(({ _id, name, description, visibility, widget_config }) => ({
    _id, name, description, visibility, widget_config,
  }));
  archive.append(JSON.stringify(dashboardTemplatesExport, null, 2), { name: 'seed/dashboard-templates.json' });

  // 7. Models
  const models = await Model.find({}).lean();
  archive.append(JSON.stringify(models, null, 2), { name: 'seed/models.json' });

  // 8. Prototypes
  const prototypes = await Prototype.find({}).lean();
  archive.append(JSON.stringify(prototypes, null, 2), { name: 'seed/prototypes.json' });

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
      ? path.join(instanceDir, 'imgs')
      : path.join(instanceDir, 'files', 'imgs'),
    pluginFiles: isNewFormat
      ? path.join(instanceDir, 'plugin')
      : path.join(instanceDir, 'files', 'plugins'),
    builtinWidgets: isNewFormat
      ? path.join(instanceDir, 'builtin-widgets')
      : null,
    vssDir: isNewFormat
      ? path.join(instanceDir, 'vss')
      : null,
    plugins: isNewFormat
      ? path.join(instanceDir, 'seed', 'plugins.json')
      : path.join(instanceDir, 'data', 'plugins.json'),
    modelTemplates: isNewFormat
      ? path.join(instanceDir, 'seed', 'model-templates.json')
      : path.join(instanceDir, 'data', 'model-templates.json'),
    dashboardTemplates: isNewFormat
      ? path.join(instanceDir, 'seed', 'dashboard-templates.json')
      : path.join(instanceDir, 'data', 'dashboard-templates.json'),
    models: isNewFormat
      ? path.join(instanceDir, 'seed', 'models.json')
      : null,
    prototypes: isNewFormat
      ? path.join(instanceDir, 'seed', 'prototypes.json')
      : null,
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
  } catch (e) {
    logger.warn('[Instance] Could not parse manifest.json — skipping instance seed.');
    return;
  }

  const label = manifest.instanceName || manifest.createdAt || 'unknown';
  logger.info(`[Instance] Found bundle: "${label}"`);

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

  // 2c. Move static images
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

  // 2e. Replace builtin widget files (new format only) — clear contents first so snapshot wins
  if (paths.builtinWidgets && fs.existsSync(paths.builtinWidgets)) {
    try {
      // Clear existing contents (keep the directory itself — it may be a mount point)
      if (fs.existsSync(STATIC_BUILTIN_WIDGETS_DIR)) {
        for (const entry of fs.readdirSync(STATIC_BUILTIN_WIDGETS_DIR, { withFileTypes: true })) {
          const p = path.join(STATIC_BUILTIN_WIDGETS_DIR, entry.name);
          if (entry.isDirectory()) {
            fs.rmSync(p, { recursive: true, force: true });
          } else {
            fs.unlinkSync(p);
          }
        }
      } else {
        fs.mkdirSync(STATIC_BUILTIN_WIDGETS_DIR, { recursive: true });
      }
      moveRecursive(paths.builtinWidgets, STATIC_BUILTIN_WIDGETS_DIR);
      fs.rmdirSync(paths.builtinWidgets);
      logger.info('[Instance] Replaced builtin widget files.');
    } catch (e) {
      logger.error('[Instance] Failed to replace builtin widget files:', e.message);
    }
  }

  // 2f. Replace VSS data files (new format only)
  // Clear all existing VSS files in data dir first, then move from snapshot
  if (paths.vssDir && fs.existsSync(paths.vssDir)) {
    try {
      if (!fs.existsSync(BACKEND_DATA_DIR)) fs.mkdirSync(BACKEND_DATA_DIR, { recursive: true });
      // Clear existing VSS files (vss.json catalog + all vX.Y.json version files)
      for (const entry of fs.readdirSync(BACKEND_DATA_DIR, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        if (entry.name === 'vss.json' || /^v\d+\.\d+.*\.json$/.test(entry.name)) {
          fs.unlinkSync(path.join(BACKEND_DATA_DIR, entry.name));
        }
      }
      // Move snapshot VSS files to data dir
      for (const entry of fs.readdirSync(paths.vssDir, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        const srcPath = path.join(paths.vssDir, entry.name);
        const destPath = path.join(BACKEND_DATA_DIR, entry.name);
        fs.copyFileSync(srcPath, destPath);
        fs.unlinkSync(srcPath);
      }
      fs.rmdirSync(paths.vssDir);
      logger.info('[Instance] Replaced VSS data files.');
    } catch (e) {
      logger.error('[Instance] Failed to replace VSS data files:', e.message);
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

  // 4. Seed model templates — filter by _id when present so model.model_template_id refs stay valid
  if (fs.existsSync(paths.modelTemplates)) {
    try {
      const templates = JSON.parse(fs.readFileSync(paths.modelTemplates, 'utf8'));
      if (Array.isArray(templates) && templates.length > 0) {
        const ops = templates.filter((t) => t.name).map((tpl) => {
          const { _id, __v, createdAt, updatedAt, ...rest } = tpl;
          const filter = _id ? { _id } : { name: tpl.name };
          return {
            updateOne: {
              filter,
              update: { $setOnInsert: { ...rest, created_by: systemUserId, updated_by: systemUserId } },
              upsert: true,
            },
          };
        });
        await ModelTemplate.bulkWrite(ops, { ordered: false });
        logger.info(`[Instance] Seeded ${templates.length} model templates.`);
      }
    } catch (e) {
      logger.error('[Instance] Failed to seed model-templates.json:', e.message);
    }
  }

  // 5. Seed dashboard templates — filter by _id when present
  if (fs.existsSync(paths.dashboardTemplates)) {
    try {
      const templates = JSON.parse(fs.readFileSync(paths.dashboardTemplates, 'utf8'));
      if (Array.isArray(templates) && templates.length > 0) {
        const ops = templates.filter((t) => t.name).map((tpl) => {
          const { _id, __v, createdAt, updatedAt, ...rest } = tpl;
          const filter = _id ? { _id } : { name: tpl.name };
          return {
            updateOne: {
              filter,
              update: { $setOnInsert: { ...rest, created_by: systemUserId, updated_by: systemUserId } },
              upsert: true,
            },
          };
        });
        await DashboardTemplate.bulkWrite(ops, { ordered: false });
        logger.info(`[Instance] Seeded ${templates.length} dashboard templates.`);
      }
    } catch (e) {
      logger.error('[Instance] Failed to seed dashboard-templates.json:', e.message);
    }
  }

  // 6. Seed models
  if (paths.models && fs.existsSync(paths.models)) {
    try {
      const records = JSON.parse(fs.readFileSync(paths.models, 'utf8'));
      if (Array.isArray(records) && records.length > 0) {
        const ops = records.map((m) => {
          const { _id, __v, createdAt, updatedAt, ...rest } = m;
          return {
            updateOne: {
              filter: { _id },
              update: { $setOnInsert: { ...rest, ...(systemUserId && { created_by: systemUserId }) } },
              upsert: true,
            },
          };
        });
        await Model.bulkWrite(ops, { ordered: false });
        logger.info(`[Instance] Seeded ${records.length} models.`);
      }
    } catch (e) {
      logger.error('[Instance] Failed to seed models.json:', e.message);
    }
  }

  // 7. Seed prototypes
  if (paths.prototypes && fs.existsSync(paths.prototypes)) {
    try {
      const records = JSON.parse(fs.readFileSync(paths.prototypes, 'utf8'));
      if (Array.isArray(records) && records.length > 0) {
        const ops = records.map((p) => {
          const { _id, __v, createdAt, updatedAt, ...rest } = p;
          return {
            updateOne: {
              filter: { _id },
              update: { $setOnInsert: { ...rest, ...(systemUserId && { created_by: systemUserId }) } },
              upsert: true,
            },
          };
        });
        await Prototype.bulkWrite(ops, { ordered: false });
        logger.info(`[Instance] Seeded ${records.length} prototypes.`);
      }
    } catch (e) {
      logger.error('[Instance] Failed to seed prototypes.json:', e.message);
    }
  }

  // Cleanup: wipe all remaining content from instance dir so it is empty after restore.
  // Static files were already moved above; JSON/manifest files are removed here.
  try {
    for (const entry of fs.readdirSync(INSTANCE_DIR, { withFileTypes: true })) {
      const p = path.join(INSTANCE_DIR, entry.name);
      if (entry.isDirectory()) {
        fs.rmSync(p, { recursive: true, force: true });
      } else {
        fs.unlinkSync(p);
      }
    }
    logger.info('[Instance] Instance directory cleared.');
  } catch (e) {
    logger.warn('[Instance] Could not fully clear instance directory:', e.message);
  }

  logger.info('[Instance] Instance bundle seed complete.');
};

module.exports = { exportSnapshot, seedFromInstanceBundle };
