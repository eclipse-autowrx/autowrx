// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');
const catchAsync = require('../utils/catchAsync');
const { pluginService } = require('../services');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

const PLUGIN_DIR = path.join(__dirname, '../../static/plugin');

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

const listPlugins = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['type', 'slug', 'name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'fields']);
  const result = await pluginService.queryPlugins(filter, options);
  res.send(result);
});

// List plugins created by admin users (public)
const listAdminPlugins = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['type', 'slug', 'name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'fields']);
  const result = await pluginService.queryAdminPlugins(filter, options);
  res.send(result);
});

// List plugins created by the current user
const listMyPlugins = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['type', 'slug', 'name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'fields']);
  const result = await pluginService.queryPlugins({ ...filter, created_by: req.user.id }, options);
  res.send(result);
});

const getPluginById = catchAsync(async (req, res) => {
  const plugin = await pluginService.getPluginById(req.params.id);
  if (!plugin) throw new ApiError(httpStatus.NOT_FOUND, 'Plugin not found');
  res.send(plugin);
});

const getPluginBySlug = catchAsync(async (req, res) => {
  const plugin = await pluginService.getPluginBySlug(req.params.slug);
  if (!plugin) throw new ApiError(httpStatus.NOT_FOUND, 'Plugin not found');
  res.send(plugin);
});

const createPlugin = catchAsync(async (req, res) => {
  const body = {
    ...req.body,
    created_by: req.user.id,
    updated_by: req.user.id,
  };
  const plugin = await pluginService.createPlugin(body);
  res.status(httpStatus.CREATED).send(plugin);
});

const updatePlugin = catchAsync(async (req, res) => {
  const body = {
    ...req.body,
    updated_by: req.user.id,
  };
  const plugin = await pluginService.updatePluginById(req.params.id, body);
  res.send(plugin);
});

async function findEntryFile(rootDir, candidates = ['index.js', 'index.html']) {
  const stack = ['']; // relative paths
  while (stack.length) {
    const rel = stack.shift();
    const dir = path.join(rootDir, rel);
    let entries = [];
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    // Prefer candidate files in current directory
    for (const name of candidates) {
      const cur = path.join(dir, name);
      try {
        const st = await fsp.stat(cur);
        if (st.isFile()) {
          return path.join(rel, name).replace(/\\/g, '/');
        }
      } catch (_) {}
    }
    // Breadth-first: enqueue subdirectories
    for (const entry of entries) {
      if (entry.isDirectory()) {
        stack.push(path.join(rel, entry.name));
      }
    }
  }
  return null;
}

const uploadInternalPlugin = catchAsync(async (req, res) => {
  const { slug } = req.params;
  if (!req.file) throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');

  // Ensure base plugin directory exists
  await ensureDir(PLUGIN_DIR);
  const pluginPath = path.join(PLUGIN_DIR, slug);
  await ensureDir(pluginPath);

  // Extract zip to target dir using system unzip (no extra npm deps)
  await new Promise((resolve, reject) => {
    const unzip = spawn('unzip', ['-o', req.file.path, '-d', pluginPath]);
    unzip.on('error', reject);
    unzip.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`unzip exited with code ${code}`));
    });
  });

  // Remove uploaded temp file
  try {
    fs.unlinkSync(req.file.path);
  } catch (e) {}

  // Try to detect entry file (index.js preferred, fallback index.html)
  let entryRel = await findEntryFile(pluginPath, ['index.js', 'index.html']);
  if (!entryRel) {
    // If not found, fallback to index.js at root
    entryRel = 'index.js';
  }
  const safeRel = entryRel.replace(/^\/+/, '');
  const pluginUrl = `/plugin/${slug}/${safeRel}`.replace(/\\/g, '/');

  const plugin = await pluginService.upsertPluginBySlug(slug, {
    is_internal: true,
    url: pluginUrl,
    updated_by: req.user.id,
  });

  res.status(httpStatus.OK).send({ plugin, url: pluginUrl });
});

const removePlugin = catchAsync(async (req, res) => {
  await pluginService.deletePluginById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  listPlugins,
  listAdminPlugins,
  listMyPlugins,
  getPluginById,
  getPluginBySlug,
  createPlugin,
  updatePlugin,
  uploadInternalPlugin,
  removePlugin,
};
