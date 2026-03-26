// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/* eslint-disable no-await-in-loop, no-restricted-syntax */

const AdmZip = require('adm-zip');
const path = require('path');
const fsp = require('fs/promises');
const fs = require('fs');
const crypto = require('crypto');
const {
  Model,
  Prototype,
  Plugin,
  SiteConfig,
  ModelTemplate,
  DashboardTemplate,
  CustomApiSchema,
  CustomApiSet,
} = require('../models');

const PLUGIN_DIR = path.join(__dirname, '../../static/plugin');
const UPLOADS_DIR = path.join(__dirname, '../../static/uploads');
const IMAGES_DIR = path.join(__dirname, '../../static/images');
const GLOBAL_CSS_PATH = path.join(__dirname, '../../static/global.css');
const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

// In-memory restore sessions: sessionId -> { manifest, data, zipEntries, expiresAt }
const restoreSessions = new Map();

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of restoreSessions) {
    if (session.expiresAt < now) restoreSessions.delete(id);
  }
}

// ---------- BACKUP ----------

/** Count files recursively in a directory */
async function countFiles(dirPath) {
  let count = 0;
  let entries;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    entries = await fsp.readdir(dirPath, { withFileTypes: true });
  } catch (_) {
    return 0;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += await countFiles(path.join(dirPath, entry.name));
    } else {
      count += 1;
    }
  }
  return count;
}

async function addDirToZip(zip, dirPath, zipPrefix) {
  let entries;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    entries = await fsp.readdir(dirPath, { withFileTypes: true });
  } catch (_) {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const zipEntryName = `${zipPrefix}/${entry.name}`;
    if (entry.isDirectory()) {
      await addDirToZip(zip, fullPath, zipEntryName);
    } else {
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const buf = await fsp.readFile(fullPath);
        zip.addFile(zipEntryName, buf);
      } catch (_) {
        // skip unreadable files
      }
    }
  }
}

/**
 * Create a ZIP buffer containing the requested data sections.
 * @param {string[]} selections - array of section names
 * @returns {Promise<Buffer>}
 */
async function createBackup(selections) {
  const zip = new AdmZip();
  const manifest = {
    version: '1.0',
    createdAt: new Date().toISOString(),
    sections: selections,
    counts: {},
  };

  if (selections.includes('models')) {
    const records = await Model.find({}).lean();
    zip.addFile('data/models.json', Buffer.from(JSON.stringify(records, null, 2)));
    manifest.counts.models = records.length;
  }

  if (selections.includes('prototypes')) {
    const records = await Prototype.find({}).lean();
    zip.addFile('data/prototypes.json', Buffer.from(JSON.stringify(records, null, 2)));
    manifest.counts.prototypes = records.length;
  }

  if (selections.includes('plugins')) {
    const records = await Plugin.find({}).lean();
    zip.addFile('data/plugins.json', Buffer.from(JSON.stringify(records, null, 2)));
    manifest.counts.plugins = records.length;

    // Include extracted internal plugin files
    for (const plugin of records) {
      if (plugin.is_internal && plugin.slug) {
        const pluginPath = path.join(PLUGIN_DIR, plugin.slug);
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        if (fs.existsSync(pluginPath)) {
          await addDirToZip(zip, pluginPath, `files/plugins/${plugin.slug}`);
        }
      }
    }
  }

  if (selections.includes('siteConfigs')) {
    const records = await SiteConfig.find({ scope: 'site' }).lean();
    zip.addFile('data/site-configs.json', Buffer.from(JSON.stringify(records, null, 2)));
    manifest.counts.siteConfigs = records.length;
  }

  if (selections.includes('modelTemplates')) {
    const records = await ModelTemplate.find({}).lean();
    zip.addFile('data/model-templates.json', Buffer.from(JSON.stringify(records, null, 2)));
    manifest.counts.modelTemplates = records.length;
  }

  if (selections.includes('dashboardTemplates')) {
    const records = await DashboardTemplate.find({}).lean();
    zip.addFile('data/dashboard-templates.json', Buffer.from(JSON.stringify(records, null, 2)));
    manifest.counts.dashboardTemplates = records.length;
  }

  if (selections.includes('customApiSchemas')) {
    const records = await CustomApiSchema.find({}).lean();
    zip.addFile('data/custom-api-schemas.json', Buffer.from(JSON.stringify(records, null, 2)));
    manifest.counts.customApiSchemas = records.length;
  }

  if (selections.includes('customApiSets')) {
    const records = await CustomApiSet.find({}).lean();
    zip.addFile('data/custom-api-sets.json', Buffer.from(JSON.stringify(records, null, 2)));
    manifest.counts.customApiSets = records.length;
  }

  // Asset files — served at /d/ (date-based uploads) and /imgs/
  if (selections.includes('uploads')) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(UPLOADS_DIR)) {
      await addDirToZip(zip, UPLOADS_DIR, 'files/uploads');
      manifest.counts.uploads = await countFiles(UPLOADS_DIR);
    } else {
      manifest.counts.uploads = 0;
    }
  }

  if (selections.includes('imgs')) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(IMAGES_DIR)) {
      await addDirToZip(zip, IMAGES_DIR, 'files/imgs');
      manifest.counts.imgs = await countFiles(IMAGES_DIR);
    } else {
      manifest.counts.imgs = 0;
    }
  }

  if (selections.includes('globalCss')) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const cssContent = await fsp.readFile(GLOBAL_CSS_PATH);
      zip.addFile('files/global.css', cssContent);
      manifest.counts.globalCss = 1;
    } catch (_) {
      manifest.counts.globalCss = 0;
    }
  }

  zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));
  return zip.toBuffer();
}

// ---------- RESTORE — PARSE & CONFLICT DETECTION ----------

/**
 * Detect which files in a ZIP prefix already exist on disk.
 * Returns ConflictItem[] with id = the zip entry name (used as key).
 */
function detectFileConflicts(zip, zipPrefix, destDir) {
  const conflicts = [];
  const entries = zip.getEntries().filter((e) => !e.isDirectory && e.entryName.startsWith(`${zipPrefix}/`));
  for (const entry of entries) {
    const relPath = entry.entryName.slice(zipPrefix.length + 1); // e.g. "2024-01-15/file.jpg" or "logo.png"
    if (!relPath) continue;
    const destPath = path.join(destDir, relPath);
    if (!destPath.startsWith(destDir)) continue;
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(destPath)) {
      conflicts.push({
        id: entry.entryName,        // unique key: full zip path
        name: relPath,              // display: relative path
        description: `Already exists on disk`,
        existingId: destPath,
        resolution: 'skip',
      });
    }
  }
  return conflicts;
}

function readJsonEntry(zip, entryName) {
  try {
    const text = zip.readAsText(entryName);
    if (!text) return [];
    return JSON.parse(text);
  } catch (_) {
    return [];
  }
}

async function detectConflictsForSection(records, findExisting, toConflict) {
  const conflicts = [];
  for (const record of records) {
    const existing = await findExisting(record);
    if (existing) {
      conflicts.push({
        ...toConflict(record),
        existingId: String(existing._id),
        resolution: 'skip',
      });
    }
  }
  return conflicts;
}

/**
 * Parse backup zip, detect conflicts, store session.
 * @param {Buffer} zipBuffer
 * @returns {{ sessionId, manifest, conflicts }}
 */
async function parseAndDetectConflicts(zipBuffer) {
  let zip;
  try {
    zip = new AdmZip(zipBuffer);
  } catch (_) {
    throw new Error('Invalid backup file: cannot read ZIP');
  }

  let manifest;
  try {
    manifest = JSON.parse(zip.readAsText('manifest.json'));
  } catch (_) {
    throw new Error('Invalid backup file: missing or corrupt manifest.json');
  }

  if (!manifest.version || !Array.isArray(manifest.sections)) {
    throw new Error('Invalid backup manifest format');
  }

  const { sections } = manifest;
  const data = {};
  const conflicts = {};

  if (sections.includes('models')) {
    data.models = readJsonEntry(zip, 'data/models.json');
    conflicts.models = await detectConflictsForSection(
      data.models,
      (r) => Model.findOne({ name: r.name, main_api: r.main_api }),
      (r) => ({ id: String(r._id), name: r.name, description: `API: ${r.main_api}` }),
    );
  }

  if (sections.includes('prototypes')) {
    data.prototypes = readJsonEntry(zip, 'data/prototypes.json');
    conflicts.prototypes = await detectConflictsForSection(
      data.prototypes,
      (r) => Prototype.findOne({ name: r.name, model_id: r.model_id }),
      (r) => ({ id: String(r._id), name: r.name, description: `Model: ${r.model_id}` }),
    );
  }

  if (sections.includes('plugins')) {
    data.plugins = readJsonEntry(zip, 'data/plugins.json');
    conflicts.plugins = await detectConflictsForSection(
      data.plugins,
      (r) => Plugin.findOne({ slug: r.slug }),
      (r) => ({ id: String(r._id), name: r.name, description: `Slug: ${r.slug}` }),
    );
  }

  if (sections.includes('siteConfigs')) {
    data.siteConfigs = readJsonEntry(zip, 'data/site-configs.json');
    conflicts.siteConfigs = await detectConflictsForSection(
      data.siteConfigs,
      (r) => SiteConfig.findOne({ key: r.key, scope: r.scope }),
      (r) => ({ id: String(r._id), name: r.key, description: `Scope: ${r.scope}` }),
    );
  }

  if (sections.includes('modelTemplates')) {
    data.modelTemplates = readJsonEntry(zip, 'data/model-templates.json');
    conflicts.modelTemplates = await detectConflictsForSection(
      data.modelTemplates,
      (r) => ModelTemplate.findOne({ name: r.name }),
      (r) => ({ id: String(r._id), name: r.name, description: r.description || '' }),
    );
  }

  if (sections.includes('dashboardTemplates')) {
    data.dashboardTemplates = readJsonEntry(zip, 'data/dashboard-templates.json');
    conflicts.dashboardTemplates = await detectConflictsForSection(
      data.dashboardTemplates,
      (r) => DashboardTemplate.findOne({ name: r.name }),
      (r) => ({ id: String(r._id), name: r.name, description: r.description || '' }),
    );
  }

  if (sections.includes('customApiSchemas')) {
    data.customApiSchemas = readJsonEntry(zip, 'data/custom-api-schemas.json');
    conflicts.customApiSchemas = await detectConflictsForSection(
      data.customApiSchemas,
      (r) => CustomApiSchema.findOne({ code: r.code }),
      (r) => ({ id: String(r._id), name: r.name, description: `Code: ${r.code}` }),
    );
  }

  if (sections.includes('customApiSets')) {
    data.customApiSets = readJsonEntry(zip, 'data/custom-api-sets.json');
    conflicts.customApiSets = await detectConflictsForSection(
      data.customApiSets,
      (r) => CustomApiSet.findOne({ name: r.name, custom_api_schema_code: r.custom_api_schema_code, scope: r.scope }),
      (r) => ({ id: String(r._id), name: r.name, description: `Schema: ${r.custom_api_schema_code}` }),
    );
  }

  // Asset sections: detect per-file conflicts (file already exists on disk)
  if (sections.includes('uploads')) {
    conflicts.uploads = detectFileConflicts(zip, 'files/uploads', UPLOADS_DIR);
  }

  if (sections.includes('imgs')) {
    conflicts.imgs = detectFileConflicts(zip, 'files/imgs', IMAGES_DIR);
  }

  if (sections.includes('globalCss')) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (zip.getEntry('files/global.css') && fs.existsSync(GLOBAL_CSS_PATH)) {
      conflicts.globalCss = [{
        id: 'files/global.css',
        name: 'global.css',
        description: 'Custom CSS file already exists',
        existingId: GLOBAL_CSS_PATH,
        resolution: 'skip',
      }];
    } else {
      conflicts.globalCss = [];
    }
  }

  cleanupExpiredSessions();
  const sessionId = crypto.randomUUID();
  restoreSessions.set(sessionId, {
    manifest,
    data,
    zip,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  return { sessionId, manifest, conflicts };
}

// ---------- RESTORE — APPLY ----------

function buildResolutionMap(resolutions) {
  const map = {};
  if (Array.isArray(resolutions)) {
    for (const r of resolutions) {
      map[r.id] = r.resolution; // 'skip' | 'replace'
    }
  }
  return map;
}

async function importRecords({ records, resMap, conflictsForSection, Model: M, results, section, userId }) {
  results.imported[section] = 0;
  results.skipped[section] = 0;

  // Build set of conflicting IDs for quick lookup
  const conflictIds = new Set((conflictsForSection || []).map((c) => c.id));

  // eslint-disable-next-line no-console
  console.log(`[restore] ${section}: ${records.length} records, ${conflictIds.size} conflicts`);

  for (const record of records) {
    const id = String(record._id);
    try {
      if (conflictIds.has(id)) {
        const resolution = resMap[id] || 'skip';
        if (resolution === 'replace') {
          const conflict = (conflictsForSection || []).find((c) => c.id === id);
          if (conflict) {
            // Preserve existing ownership — strip created_by/updated_by so we don't overwrite with stale user IDs
            const { _id, __v, createdAt, created_by, updated_by, ...rest } = record;
            await M.findByIdAndUpdate(conflict.existingId, { $set: rest });
            results.imported[section]++;
          }
        } else {
          results.skipped[section]++;
        }
      } else {
        // New record — upsert by _id (handles same-DB re-import without duplicate key)
        // Re-assign created_by to the restoring admin so the records are visible to current users
        const { _id: docId, __v, ...rest } = record;
        if (userId) rest.created_by = userId;
        await M.findByIdAndUpdate(docId, { $set: rest }, { upsert: true, new: true });
        results.imported[section]++;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[restore] ${section} id=${id} error:`, err.message);
      results.errors.push({ type: section, id, error: err.message });
    }
  }
  // eslint-disable-next-line no-console
  console.log(`[restore] ${section}: imported=${results.imported[section]}, skipped=${results.skipped[section]}, errors so far=${results.errors.length}`);
}

async function extractPluginFiles(zip, slug) {
  const prefix = `files/plugins/${slug}/`;
  const entries = zip.getEntries().filter((e) => e.entryName.startsWith(prefix) && !e.isDirectory);
  if (!entries.length) return;

  const pluginDir = path.join(PLUGIN_DIR, slug);
  await fsp.mkdir(pluginDir, { recursive: true });

  for (const entry of entries) {
    const relPath = entry.entryName.slice(prefix.length);
    if (!relPath) continue;
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const destPath = path.join(pluginDir, relPath);
    // Prevent path traversal
    if (!destPath.startsWith(pluginDir)) continue;
    await fsp.mkdir(path.dirname(destPath), { recursive: true });
    await fsp.writeFile(destPath, entry.getData());
  }
}

/**
 * Extract asset files from zip into destDir, respecting skip/replace resolutions.
 * Conflict id = entry.entryName (full zip path).
 */
async function restoreAssetFiles(zip, zipPrefix, destDir, fileConflicts, resMap, results, section) {
  results.imported[section] = 0;
  results.skipped[section] = 0;

  const conflictMap = new Map(fileConflicts.map((c) => [c.id, c]));
  const entries = zip.getEntries().filter((e) => !e.isDirectory && e.entryName.startsWith(`${zipPrefix}/`));

  for (const entry of entries) {
    const relPath = entry.entryName.slice(zipPrefix.length + 1);
    if (!relPath) continue;

    const destPath = path.join(destDir, relPath);
    // Prevent path traversal
    if (!destPath.startsWith(destDir)) continue;

    try {
      if (conflictMap.has(entry.entryName)) {
        const resolution = resMap[entry.entryName] || 'skip';
        if (resolution === 'replace') {
          await fsp.writeFile(destPath, entry.getData());
          results.imported[section]++;
        } else {
          results.skipped[section]++;
        }
      } else {
        // File doesn't exist — create it
        await fsp.mkdir(path.dirname(destPath), { recursive: true });
        await fsp.writeFile(destPath, entry.getData());
        results.imported[section]++;
      }
    } catch (err) {
      results.errors.push({ type: section, id: entry.entryName, error: err.message });
    }
  }
}

/**
 * Apply restore using stored session + admin resolutions.
 * @param {string} sessionId
 * @param {Array<{id: string, resolution: 'skip'|'replace'}>} resolutions
 * @param {string} userId - admin user id for created_by/updated_by on new records
 * @returns {{ imported, skipped, errors }}
 */
async function applyRestore(sessionId, resolutions, userId) {
  // eslint-disable-next-line no-console
  console.log(`[restore] applyRestore called: sessionId=${sessionId}, resolutions=${resolutions?.length ?? 0}, activeSessions=${restoreSessions.size}`);
  const session = restoreSessions.get(sessionId);
  if (!session) {
    // eslint-disable-next-line no-console
    console.error(`[restore] Session not found. Active sessions: [${[...restoreSessions.keys()].join(', ')}]`);
    throw new Error('Restore session not found or expired. Please re-upload the backup file.');
  }
  if (session.expiresAt < Date.now()) {
    restoreSessions.delete(sessionId);
    throw new Error('Restore session expired. Please re-upload the backup file.');
  }
  // eslint-disable-next-line no-console
  console.log(`[restore] Session found. Sections: ${session.manifest.sections.join(', ')}`);

  const { data, manifest: { sections }, zip } = session;
  const resMap = buildResolutionMap(resolutions);
  const results = { imported: {}, skipped: {}, errors: [] };

  // Re-detect conflicts to get the conflict list (needed for replace logic)
  const conflicts = {};
  if (sections.includes('models') && data.models) {
    conflicts.models = await detectConflictsForSection(
      data.models,
      (r) => Model.findOne({ name: r.name, main_api: r.main_api }),
      (r) => ({ id: String(r._id), name: r.name, description: `API: ${r.main_api}` }),
    );
  }
  if (sections.includes('prototypes') && data.prototypes) {
    conflicts.prototypes = await detectConflictsForSection(
      data.prototypes,
      (r) => Prototype.findOne({ name: r.name, model_id: r.model_id }),
      (r) => ({ id: String(r._id), name: r.name, description: '' }),
    );
  }
  if (sections.includes('plugins') && data.plugins) {
    conflicts.plugins = await detectConflictsForSection(
      data.plugins,
      (r) => Plugin.findOne({ slug: r.slug }),
      (r) => ({ id: String(r._id), name: r.name, description: `Slug: ${r.slug}` }),
    );
  }
  if (sections.includes('siteConfigs') && data.siteConfigs) {
    conflicts.siteConfigs = await detectConflictsForSection(
      data.siteConfigs,
      (r) => SiteConfig.findOne({ key: r.key, scope: r.scope }),
      (r) => ({ id: String(r._id), name: r.key, description: '' }),
    );
  }
  if (sections.includes('modelTemplates') && data.modelTemplates) {
    conflicts.modelTemplates = await detectConflictsForSection(
      data.modelTemplates,
      (r) => ModelTemplate.findOne({ name: r.name }),
      (r) => ({ id: String(r._id), name: r.name, description: '' }),
    );
  }
  if (sections.includes('dashboardTemplates') && data.dashboardTemplates) {
    conflicts.dashboardTemplates = await detectConflictsForSection(
      data.dashboardTemplates,
      (r) => DashboardTemplate.findOne({ name: r.name }),
      (r) => ({ id: String(r._id), name: r.name, description: '' }),
    );
  }
  if (sections.includes('customApiSchemas') && data.customApiSchemas) {
    conflicts.customApiSchemas = await detectConflictsForSection(
      data.customApiSchemas,
      (r) => CustomApiSchema.findOne({ code: r.code }),
      (r) => ({ id: String(r._id), name: r.name, description: '' }),
    );
  }
  if (sections.includes('customApiSets') && data.customApiSets) {
    conflicts.customApiSets = await detectConflictsForSection(
      data.customApiSets,
      (r) => CustomApiSet.findOne({ name: r.name, custom_api_schema_code: r.custom_api_schema_code, scope: r.scope }),
      (r) => ({ id: String(r._id), name: r.name, description: '' }),
    );
  }

  // Import order: schemas before sets, models before prototypes
  if (sections.includes('customApiSchemas') && data.customApiSchemas) {
    await importRecords({
      records: data.customApiSchemas,
      resMap,
      conflictsForSection: conflicts.customApiSchemas,
      Model: CustomApiSchema,
      results,
      section: 'customApiSchemas',
      userId,
    });
  }

  if (sections.includes('customApiSets') && data.customApiSets) {
    await importRecords({
      records: data.customApiSets,
      resMap,
      conflictsForSection: conflicts.customApiSets,
      Model: CustomApiSet,
      results,
      section: 'customApiSets',
      userId,
    });
  }

  if (sections.includes('models') && data.models) {
    await importRecords({
      records: data.models,
      resMap,
      conflictsForSection: conflicts.models,
      Model,
      results,
      section: 'models',
      userId,
    });
  }

  if (sections.includes('prototypes') && data.prototypes) {
    await importRecords({
      records: data.prototypes,
      resMap,
      conflictsForSection: conflicts.prototypes,
      Model: Prototype,
      results,
      section: 'prototypes',
      userId,
    });
  }

  if (sections.includes('plugins') && data.plugins) {
    const conflictIds = new Set((conflicts.plugins || []).map((c) => c.id));
    results.imported.plugins = 0;
    results.skipped.plugins = 0;

    for (const plugin of data.plugins) {
      const id = String(plugin._id);
      try {
        if (conflictIds.has(id)) {
          const resolution = resMap[id] || 'skip';
          if (resolution === 'replace') {
            const conflict = (conflicts.plugins || []).find((c) => c.id === id);
            if (conflict) {
              // Preserve existing ownership on conflict-replace
              const { _id, __v, createdAt, created_by, updated_by, ...rest } = plugin;
              await Plugin.findByIdAndUpdate(conflict.existingId, { $set: rest });
              if (plugin.is_internal && plugin.slug) {
                await extractPluginFiles(zip, plugin.slug);
              }
              results.imported.plugins++;
            }
          } else {
            results.skipped.plugins++;
          }
        } else {
          // New plugin — upsert by _id, re-assign ownership to the restoring admin
          const { _id: pluginId, __v, ...pluginRest } = plugin;
          if (userId) {
            pluginRest.created_by = userId;
            pluginRest.updated_by = userId;
          }
          await Plugin.findByIdAndUpdate(pluginId, { $set: pluginRest }, { upsert: true, new: true });
          if (plugin.is_internal && plugin.slug) {
            await extractPluginFiles(zip, plugin.slug);
          }
          results.imported.plugins++;
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[restore] plugins id=${id} error:`, err.message);
        results.errors.push({ type: 'plugins', id, error: err.message });
      }
    }
  }

  if (sections.includes('siteConfigs') && data.siteConfigs) {
    await importRecords({
      records: data.siteConfigs,
      resMap,
      conflictsForSection: conflicts.siteConfigs,
      Model: SiteConfig,
      results,
      section: 'siteConfigs',
      userId,
    });
  }

  if (sections.includes('modelTemplates') && data.modelTemplates) {
    await importRecords({
      records: data.modelTemplates,
      resMap,
      conflictsForSection: conflicts.modelTemplates,
      Model: ModelTemplate,
      results,
      section: 'modelTemplates',
      userId,
    });
  }

  if (sections.includes('dashboardTemplates') && data.dashboardTemplates) {
    await importRecords({
      records: data.dashboardTemplates,
      resMap,
      conflictsForSection: conflicts.dashboardTemplates,
      Model: DashboardTemplate,
      results,
      section: 'dashboardTemplates',
      userId,
    });
  }

  // Asset file restoration — re-detect conflicts at apply time for accuracy
  if (sections.includes('uploads')) {
    const uploadConflicts = detectFileConflicts(zip, 'files/uploads', UPLOADS_DIR);
    await restoreAssetFiles(zip, 'files/uploads', UPLOADS_DIR, uploadConflicts, resMap, results, 'uploads');
  }

  if (sections.includes('imgs')) {
    const imgConflicts = detectFileConflicts(zip, 'files/imgs', IMAGES_DIR);
    await restoreAssetFiles(zip, 'files/imgs', IMAGES_DIR, imgConflicts, resMap, results, 'imgs');
  }

  if (sections.includes('globalCss')) {
    results.imported.globalCss = 0;
    results.skipped.globalCss = 0;
    const entry = zip.getEntry('files/global.css');
    if (entry) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const alreadyExists = fs.existsSync(GLOBAL_CSS_PATH);
      const resolution = alreadyExists ? (resMap['files/global.css'] || 'skip') : 'replace';
      if (resolution === 'replace') {
        try {
          await fsp.writeFile(GLOBAL_CSS_PATH, entry.getData());
          results.imported.globalCss = 1;
        } catch (err) {
          results.errors.push({ type: 'globalCss', id: 'files/global.css', error: err.message });
        }
      } else {
        results.skipped.globalCss = 1;
      }
    }
  }

  restoreSessions.delete(sessionId);
  // eslint-disable-next-line no-console
  console.log(`[restore] Done. errors=${results.errors.length}`, results.errors.slice(0, 5));
  return results;
}

module.exports = {
  createBackup,
  parseAndDetectConflicts,
  applyRestore,
};
