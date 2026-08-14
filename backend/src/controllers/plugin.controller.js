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
const yauzl = require('yauzl');
const catchAsync = require('../utils/catchAsync');
const { pluginService } = require('../services');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

const PLUGIN_DIR = path.join(__dirname, '../../static/plugin');

async function ensureDir(dir) {
  // Directory paths are derived from trusted configuration and sanitized inputs (e.g. slug),
  // so using a non-literal path here is intentional.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
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
  const isAdmin =
    (Array.isArray(req.user.roles) && req.user.roles.includes('admin')) || (await pluginService.isAdminUser(req.user.id));
  const actor = {
    id: req.user.id,
    isAdmin,
  };
  const plugin = await pluginService.updatePluginById(req.params.id, body, actor);
  res.send(plugin);
});

/* eslint-disable no-await-in-loop, no-continue, no-restricted-syntax */
async function findEntryFile(rootDir, candidates = ['index.js', 'index.html']) {
  const stack = ['']; // relative paths
  while (stack.length) {
    const rel = stack.shift();
    const dir = path.join(rootDir, rel);
    let entries = [];
    try {
      // Directory paths are constructed from the plugin root and relative segments,
      // which are not influenced by user-controlled values beyond a validated slug.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    // Prefer candidate files in current directory
    for (const name of candidates) {
      const cur = path.join(dir, name);
      try {
        // File paths are resolved relative to a trusted plugin directory.
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const st = await fsp.stat(cur);
        if (st.isFile()) {
          return path.join(rel, name).replace(/\\/g, '/');
        }
      } catch (_) {
        // Ignore missing candidate files in this directory and continue search
      }
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
/* eslint-enable no-await-in-loop, no-continue, no-restricted-syntax */

/**
 * Safely extract a zip archive into a target directory.
 * Rejects path traversal (../, absolute paths) and symlink entries
 * to prevent arbitrary file write/read (CWE-22, CWE-59).
 *
 * Transactional: on any failure, the zip file descriptor and any in-flight
 * read/write streams are released, and any partially extracted content is
 * removed from targetDir. This prevents file-descriptor leaks and orphaned
 * partial directories from accumulating on disk over time. targetDir should
 * be a fresh, dedicated directory (the caller creates it immediately before
 * calling this function).
 */
async function safeExtractZip(zipPath, targetDir) {
  const resolvedTarget = path.resolve(targetDir);
  return new Promise((resolve, reject) => {
    let settled = false;
    let zipfile = null;
    let activeReadStream = null;
    let activeWriteStream = null;

    // Centralized failure path: release the zip fd and any in-flight streams,
    // then remove partially extracted content so disk does not accumulate.
    const fail = (err) => {
      if (settled) return;
      settled = true;
      if (activeReadStream) {
        activeReadStream.destroy();
      }
      if (activeWriteStream) {
        activeWriteStream.destroy();
      }
      if (zipfile) {
        try {
          zipfile.close();
        } catch (_) {
          // Already auto-closed — ignore.
        }
      }
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fsp
        .rm(resolvedTarget, { recursive: true, force: true })
        .catch(() => {})
        .finally(() => reject(err));
    };

    yauzl.open(zipPath, { lazyEntries: true, autoClose: true }, (err, zf) => {
      if (err) {
        // No zipfile handle yet, but still clean up the (empty) target dir.
        return fail(err);
      }
      zipfile = zf;

      zipfile.readEntry();
      zipfile.on('entry', (entry) => {
        // Ignore any entry emitted after a failure. When fail() destroys an
        // in-flight write stream, that stream's lingering 'close' handler can
        // still call readEntry() and emit one more entry (yauzl's fd close is
        // asynchronous). Processing it could create orphan directories racing
        // with the cleanup rm(), so drop it once we have settled.
        if (settled) return;

        // Reject absolute paths and path traversal in entry names
        if (path.isAbsolute(entry.fileName) || entry.fileName.includes('..')) {
          return fail(new ApiError(httpStatus.BAD_REQUEST, `Unsafe zip entry: ${entry.fileName}`));
        }

        const entryPath = path.resolve(resolvedTarget, entry.fileName);
        // Containment check: resolved entry must be within target directory
        if (entryPath !== resolvedTarget && !entryPath.startsWith(resolvedTarget + path.sep)) {
          return fail(new ApiError(httpStatus.BAD_REQUEST, `Unsafe zip entry: ${entry.fileName}`));
        }

        // Unix file mode: reject symlinks and non-regular files
        // eslint-disable-next-line no-bitwise
        const mode = (entry.externalFileAttributes >>> 16) & 0o170000;
        if (mode === 0o120000) {
          return fail(new ApiError(httpStatus.BAD_REQUEST, `Symlink entries are not allowed: ${entry.fileName}`));
        }

        if (/\/$/.test(entry.fileName)) {
          // Directory entry
          fsp
            .mkdir(entryPath, { recursive: true })
            .then(() => zipfile.readEntry())
            .catch(fail);
        } else {
          // File entry — ensure parent directory exists
          fsp
            .mkdir(path.dirname(entryPath), { recursive: true })
            .then(() => {
              zipfile.openReadStream(entry, (readErr, readStream) => {
                if (readErr) return fail(readErr);
                activeReadStream = readStream;
                readStream.on('error', fail);
                const writeStream = fs.createWriteStream(entryPath);
                activeWriteStream = writeStream;
                writeStream.on('error', fail);
                writeStream.on('close', () => {
                  activeReadStream = null;
                  activeWriteStream = null;
                  zipfile.readEntry();
                });
                readStream.pipe(writeStream);
              });
            })
            .catch(fail);
        }
      });
      zipfile.on('end', () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      });
      zipfile.on('error', fail);
    });
  });
}

const uploadInternalPlugin = catchAsync(async (req, res) => {
  const { slug } = req.params;
  if (!req.file) throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');

  const actor = {
    id: req.user.id,
    isAdmin:
      (Array.isArray(req.user.roles) && req.user.roles.includes('admin')) || (await pluginService.isAdminUser(req.user.id)),
  };

  // Authorization: if a plugin with this slug already exists, verify
  // ownership BEFORE extracting any files (CWE-862).
  const existing = await pluginService.getPluginBySlug(slug);
  if (existing) {
    const isOwner = String(existing.created_by) === String(actor.id);
    if (!isOwner && !actor.isAdmin) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        'This plugin name is already used by another account. Please choose a different name and upload again.',
      );
    }
  }

  // Ensure base plugin directory exists
  await ensureDir(PLUGIN_DIR);
  const pluginPath = path.join(PLUGIN_DIR, slug);

  // Defense-in-depth: verify resolved path stays within PLUGIN_DIR (CWE-22)
  const resolvedPluginPath = path.resolve(pluginPath);
  if (resolvedPluginPath !== PLUGIN_DIR && !resolvedPluginPath.startsWith(PLUGIN_DIR + path.sep)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid plugin slug');
  }

  await ensureDir(pluginPath);

  // Safely extract zip (rejects symlinks and path traversal — CWE-22, CWE-59).
  // safeExtractZip is transactional: on failure it releases the zip fd and
  // removes any partially extracted content from pluginPath.
  try {
    await safeExtractZip(req.file.path, pluginPath);
  } finally {
    // Always remove the uploaded temp file (success or failure) so multer
    // uploads don't accumulate under static/uploads over time.
    try {
      // Temp upload path is provided by the trusted multer middleware.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.unlinkSync(req.file.path);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  // Try to detect entry file (index.js preferred, fallback index.html)
  let entryRel = await findEntryFile(pluginPath, ['index.js', 'index.html']);
  if (!entryRel) {
    // If not found, fallback to index.js at root
    entryRel = 'index.js';
  }
  const safeRel = entryRel.replace(/^\/+/, '');
  const pluginUrl = `/plugin/${slug}/${safeRel}`.replace(/\\/g, '/');

  if (existing) {
    // Plugin already exists — update its URL in place
    const plugin = await pluginService.upsertPluginBySlug(slug, {
      is_internal: true,
      url: pluginUrl,
      updated_by: req.user.id,
    });
    return res.status(httpStatus.OK).send({ plugin, url: pluginUrl });
  }

  // Plugin does not exist yet (create flow) — return the URL only so the
  // caller can include it in the subsequent createPlugin call.  Creating a
  // stub record here would produce an incomplete document (missing name,
  // description, image, created_by, …).
  res.status(httpStatus.OK).send({ plugin: null, url: pluginUrl });
});

const removePlugin = catchAsync(async (req, res) => {
  const isAdmin =
    (Array.isArray(req.user.roles) && req.user.roles.includes('admin')) || (await pluginService.isAdminUser(req.user.id));
  const actor = {
    id: req.user.id,
    isAdmin,
  };
  await pluginService.deletePluginById(req.params.id, actor);
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
  // Exported for unit testing only (not used by route handlers)
  safeExtractZip,
};
