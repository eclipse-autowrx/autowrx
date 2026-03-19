// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { Plugin, Role, UserRole } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create plugin
 * @param {Object} body
 * @returns {Promise<Plugin>}
 */
const slugify = (name) =>
  name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const ensureUniqueSlug = async (base) => {
  const candidate = base || 'plugin';
  let suffix = 0;
  // Try base, base-1, base-2, ... until unique
  // Guard to avoid infinite loop
  while (suffix < 10000) {
    const test = suffix === 0 ? candidate : `${candidate}-${suffix}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await Plugin.exists({ slug: test });
    if (!exists) return test;
    suffix += 1;
  }
  // Fallback with timestamp
  return `${candidate}-${Date.now()}`;
};

const createPlugin = async (body) => {
  const base = slugify(body.name || '');
  const slug = await ensureUniqueSlug(base);
  return Plugin.create({ ...body, slug });
};

/**
 * Query plugins with pagination
 * @param {Object} filter
 * @param {Object} options
 */
const queryPlugins = async (filter = {}, options = {}) => {
  const mongoFilter = { ...filter };

  // For backward compatibility: if type is 'prototype_function' or not specified,
  // also include plugins with null/undefined type (legacy plugins)
  if (filter.type === 'prototype_function' || !filter.type) {
    // Include both 'prototype_function' and null/undefined types
    mongoFilter.$or = [{ type: 'prototype_function' }, { type: null }, { type: { $exists: false } }];
    delete mongoFilter.type;
  }

  return Plugin.paginate(mongoFilter, options);
};

/**
 * Query plugins created by admin users
 * Publicly readable; admin users are determined via Role/UserRole with ref "admin"
 * @param {Object} filter
 * @param {Object} options
 */
const queryAdminPlugins = async (filter = {}, options = {}) => {
  // Find admin role
  const adminRole = await Role.findOne({ ref: 'admin' });
  if (!adminRole) {
    // No admin role configured => no admin plugins
    return Plugin.paginate({ _id: null }, options);
  }

  // Get all user ids that have the admin role
  const adminUserIds = await UserRole.find({ role: adminRole._id }).distinct('user');
  if (!adminUserIds.length) {
    // No admin users => no plugins
    return Plugin.paginate({ _id: null }, options);
  }

  const extendedFilter = {
    ...filter,
    created_by: { $in: adminUserIds },
  };
  return queryPlugins(extendedFilter, options);
};

/** Get plugin by id */
const getPluginById = async (id) => Plugin.findById(id);

/** Get plugin by slug */
const getPluginBySlug = async (slug) => Plugin.findOne({ slug });

/** Update plugin by id with ownership validation */
const updatePluginById = async (id, updateBody, actor) => {
  const plugin = await getPluginById(id);
  if (!plugin) throw new ApiError(httpStatus.NOT_FOUND, 'Plugin not found');

  if (!actor || !actor.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Missing user context');
  }

  const isOwner = String(plugin.created_by) === String(actor.id);
  const isAdmin = !!actor.isAdmin;

  if (!isOwner && !isAdmin) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You cannot modify this plugin because it belongs to another account.');
  }

  Object.assign(plugin, updateBody);
  await plugin.save();
  return plugin;
};

/** Upsert plugin by slug */
const upsertPluginBySlug = async (slug, updateBody) => {
  const plugin = await Plugin.findOneAndUpdate({ slug }, { $set: updateBody }, { upsert: true, new: true });
  return plugin;
};

/** Delete plugin by id with ownership validation */
const deletePluginById = async (id, actor) => {
  const plugin = await getPluginById(id);
  if (!plugin) throw new ApiError(httpStatus.NOT_FOUND, 'Plugin not found');

  if (!actor || !actor.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Missing user context');
  }

  const isOwner = String(plugin.created_by) === String(actor.id);
  const isAdmin = !!actor.isAdmin;

  if (!isOwner && !isAdmin) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You cannot delete this plugin because it belongs to another account.');
  }

  await plugin.deleteOne();
  return true;
};

module.exports = {
  createPlugin,
  queryPlugins,
  queryAdminPlugins,
  getPluginById,
  getPluginBySlug,
  updatePluginById,
  upsertPluginBySlug,
  deletePluginById,
};
