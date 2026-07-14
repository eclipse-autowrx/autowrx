// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { ProjectTemplate } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const DUPLICATE_NAME_MESSAGE = 'A project template with this name already exists';

const normalizeName = (name) => {
  const normalized = typeof name === 'string' ? name.trim() : '';
  if (!normalized) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Name is required');
  }
  return normalized;
};

const assertUniqueName = async (name, excludeId) => {
  const normalized = normalizeName(name);
  const filter = {
    name: { $regex: `^${escapeRegex(normalized)}$`, $options: 'i' },
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  const existing = await ProjectTemplate.findOne(filter);
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, DUPLICATE_NAME_MESSAGE);
  }
};

const create = async (body) => {
  body.name = normalizeName(body.name);
  await assertUniqueName(body.name);
  return ProjectTemplate.create(body);
};

const query = async (filter, options) => {
  return ProjectTemplate.paginate(filter, options);
};

const getById = async (id) => ProjectTemplate.findById(id);

const updateById = async (id, updateBody) => {
  const doc = await getById(id);
  if (!doc) throw new ApiError(httpStatus.NOT_FOUND, 'ProjectTemplate not found');
  if (updateBody.name) {
    updateBody.name = normalizeName(updateBody.name);
    await assertUniqueName(updateBody.name, id);
  }
  Object.assign(doc, updateBody);
  await doc.save();
  return doc;
};

const removeById = async (id) => {
  const doc = await getById(id);
  if (!doc) throw new ApiError(httpStatus.NOT_FOUND, 'ProjectTemplate not found');
  await doc.deleteOne();
  return doc;
};

/**
 * Seed predefined project templates on server startup.
 * Uses $setOnInsert so existing (admin-modified) templates are never overwritten.
 */
const seedProjectTemplates = async (predefinedTemplates, systemUserId) => {
  if (!predefinedTemplates || predefinedTemplates.length === 0) return;

  try {
    const operations = predefinedTemplates.map((tpl) => ({
      updateOne: {
        filter: { name: tpl.name },
        update: {
          $setOnInsert: {
            name: tpl.name,
            description: tpl.description || '',
            data: tpl.data,
            visibility: 'public',
            created_by: systemUserId,
            updated_by: systemUserId,
          },
        },
        upsert: true,
      },
    }));

    await ProjectTemplate.bulkWrite(operations);
    logger.info(`Seeded ${predefinedTemplates.length} project template(s)`);
  } catch (error) {
    logger.error('Failed to seed project templates:', error);
  }
};

module.exports = { create, query, getById, updateById, removeById, seedProjectTemplates };
