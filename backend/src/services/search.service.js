// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/* eslint-disable security/detect-non-literal-regexp */
const mongoose = require('mongoose');
const { modelService } = require('.');
const { Prototype, User } = require('../models');

const search = async (query, options, userId) => {
  const accessibleModels = await modelService.getAccessibleModels(userId);

  const models = await modelService.queryModels(
    { $or: [{ name: new RegExp(query, 'i') }, { description: new RegExp(query, 'i') }] },
    {},
    {},
    userId
  );
  const prototypes = await Prototype.paginate(
    {
      $and: [
        { $or: [{ name: new RegExp(query, 'i') }, { description: new RegExp(query, 'i') }] },
        {
          model_id: { $in: accessibleModels.map((model) => new mongoose.Types.ObjectId(model._id || model.id)) },
        },
      ],
    },
    {
      ...options,
      // Default sort by editors_choice and createdAt
      sortBy: options?.sortBy
        ? ['editors_choice:desc,createdAt:asc', options.sortBy].join(',')
        : 'editors_choice:desc,createdAt:asc',
    }
  );

  return {
    prototypes: prototypes.results,
    models: models.results,
    page: prototypes.page,
    limit: prototypes.limit,
    totalPages: Math.max(prototypes.totalPages, models.totalPages),
    totalResults: prototypes.totalResults + models.totalResults,
  };
};

const searchUserByEmail = async (email) => {
  return User.findOne({
    email,
  }).select('email name image_file');
};

/**
 *
 * @param {string} signal
 */
const searchPrototypesBySignal = async (signal) => {
  const prototypes = await Prototype.find()
    .select('model_id code name image_file')
    .sort('-editors_choice createdAt')
    .populate('model_id');
  return prototypes.filter((prototype) => prototype.code?.includes(signal));
};

module.exports = { search, searchUserByEmail, searchPrototypesBySignal };
