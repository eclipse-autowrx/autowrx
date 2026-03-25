// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

/**
 * Instance Snapshot Service
 *
 * Handles export and import (seed) of instance configuration bundles.
 * A snapshot captures everything an admin has customized:
 *   - Site configs (key-value)
 *   - Static images (logo, covers)
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
const INSTANCE_IMGS_DIR = path.join(INSTANCE_DIR, 'imgs');
const INSTANCE_SEED_DIR = path.join(INSTANCE_DIR, 'seed');
const INSTANCE_MANIFEST = path.join(INSTANCE_DIR, 'manifest.json');
const INSTANCE_SITE_CONFIGS = path.join(INSTANCE_DIR, 'site-configs.json');

// Static images served by the BE
const STATIC_IMGS_DIR = path.join(__dirname, '../../static/images');
const STATIC_UPLOADS_DIR = path.join(__dirname, '../../static/uploads');

/**
 * Export a full instance snapshot as a zip stream.
 * @param {import('express').Response} res - Express response (pipe zip directly)
 * @param {string} instanceName - Name for the snapshot (used in manifest)
 */
const exportSnapshot = async (res, instanceName = 'autowrx-instance') => {
  const archive = archiver('zip', { zlib: { level: 6 } });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${instanceName}-snapshot.zip"`);
  archive.pipe(res);

  // 1. Manifest
  const manifest = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    instanceName,
    contents: ['site-configs.json', 'imgs/', 'seed/plugins.json', 'seed/model-templates.json', 'seed/dashboard-templates.json'],
  };
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

  // 2. Site configs (exclude secrets)
  const siteConfigs = await SiteConfig.find({ scope: 'site', secret: false }).lean();
  const configsExport = siteConfigs.map(({ key, value, valueType, description, category, secret }) => ({
    key, value, valueType, description, category, secret,
  }));
  archive.append(JSON.stringify(configsExport, null, 2), { name: 'site-configs.json' });

  // 3. User-uploaded images only — logo and covers that admin has explicitly uploaded
  // We only backup what the user created, not baked-in defaults (/imgs/ are in the container)
  const imageKeys = ['SITE_LOGO_WIDE', 'DEFAULT_MODEL_IMAGE', 'DEFAULT_PROTOTYPE_IMAGE'];
  const imageConfigs = await SiteConfig.find({ key: { $in: imageKeys }, scope: 'site' }).lean();

  for (const cfg of imageConfigs) {
    const imgValue = cfg.value;
    if (!imgValue || typeof imgValue !== 'string') continue;

    // Only export user-uploaded files (served under /d/ from static/uploads)
    if (!imgValue.startsWith('/d/')) continue;

    const filePath = path.join(STATIC_UPLOADS_DIR, imgValue.slice(3));
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      archive.file(filePath, { name: `imgs/${cfg.key}${ext}` });
    }
  }

  // 4. Plugins
  const plugins = await Plugin.find({}).lean();
  const pluginsExport = plugins.map(({ name, slug, image, description, apis, config, tags, type }) => ({
    name, slug, image, description, apis, config, tags, type,
  }));
  archive.append(JSON.stringify(pluginsExport, null, 2), { name: 'seed/plugins.json' });

  // 5. Model templates
  const modelTemplates = await ModelTemplate.find({ visibility: { $in: ['public', 'default'] } }).lean();
  const modelTemplatesExport = modelTemplates.map(({ name, description, image, visibility, config }) => ({
    name, description, image, visibility: visibility === 'default' ? 'default' : 'public', config,
  }));
  archive.append(JSON.stringify(modelTemplatesExport, null, 2), { name: 'seed/model-templates.json' });

  // 6. Dashboard templates
  const dashboardTemplates = await DashboardTemplate.find({ visibility: 'public' }).lean();
  const dashboardTemplatesExport = dashboardTemplates.map(({ name, description, visibility, widget_config }) => ({
    name, description, visibility, widget_config,
  }));
  archive.append(JSON.stringify(dashboardTemplatesExport, null, 2), { name: 'seed/dashboard-templates.json' });

  await archive.finalize();
};

/**
 * Seed instance from /instance/ volume on server startup.
 * Reads manifest.json to confirm bundle is present, then seeds each category.
 * Uses $setOnInsert / upsert logic — never overwrites admin-customized data.
 */
const seedFromInstanceBundle = async (systemUserId) => {
  if (!fs.existsSync(INSTANCE_MANIFEST)) {
    logger.info('[Instance] No instance bundle found — skipping instance seed.');
    return;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(INSTANCE_MANIFEST, 'utf8'));
    logger.info(`[Instance] Found bundle: "${manifest.instanceName}" exported at ${manifest.exportedAt}`);
  } catch (e) {
    logger.warn('[Instance] Could not parse manifest.json — skipping instance seed.');
    return;
  }

  // 1. Seed site configs
  if (fs.existsSync(INSTANCE_SITE_CONFIGS)) {
    try {
      const configs = JSON.parse(fs.readFileSync(INSTANCE_SITE_CONFIGS, 'utf8'));
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

  // 2. Seed plugins
  const pluginsSeedPath = path.join(INSTANCE_SEED_DIR, 'plugins.json');
  if (fs.existsSync(pluginsSeedPath)) {
    try {
      const plugins = JSON.parse(fs.readFileSync(pluginsSeedPath, 'utf8'));
      if (Array.isArray(plugins) && plugins.length > 0) {
        const ops = plugins.filter(p => p.slug).map((plugin) => ({
          updateOne: {
            filter: { slug: plugin.slug },
            update: { $setOnInsert: { ...plugin, created_by: systemUserId, updated_by: systemUserId } },
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

  // 3. Seed model templates
  const modelTplPath = path.join(INSTANCE_SEED_DIR, 'model-templates.json');
  if (fs.existsSync(modelTplPath)) {
    try {
      const templates = JSON.parse(fs.readFileSync(modelTplPath, 'utf8'));
      if (Array.isArray(templates) && templates.length > 0) {
        const ops = templates.filter(t => t.name).map((tpl) => ({
          updateOne: {
            filter: { name: tpl.name },
            update: { $setOnInsert: { ...tpl, created_by: systemUserId, updated_by: systemUserId } },
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

  // 4. Seed dashboard templates
  const dashTplPath = path.join(INSTANCE_SEED_DIR, 'dashboard-templates.json');
  if (fs.existsSync(dashTplPath)) {
    try {
      const templates = JSON.parse(fs.readFileSync(dashTplPath, 'utf8'));
      if (Array.isArray(templates) && templates.length > 0) {
        const ops = templates.filter(t => t.name).map((tpl) => ({
          updateOne: {
            filter: { name: tpl.name },
            update: { $setOnInsert: { ...tpl, created_by: systemUserId, updated_by: systemUserId } },
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

  logger.info('[Instance] Instance bundle seed complete.');
};

module.exports = { exportSnapshot, seedFromInstanceBundle };
