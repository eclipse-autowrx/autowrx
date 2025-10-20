// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const { searchService } = require('../services');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');

const search = catchAsync(async (req, res) => {
  const { q } = req.query;
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await searchService.search(q, options, req.user?.id);
  res.send(result);
});

const searchUserByEmail = catchAsync(async (req, res) => {
  const { email } = req.params;
  const result = await searchService.searchUserByEmail(email);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(result);
});

const searchPrototypesBySignal = catchAsync(async (req, res) => {
  const { signal } = req.params;
  const prototypes = await searchService.searchPrototypesBySignal(signal);
  res.send(
    prototypes.map((prototype) => {
      const json = prototype.toJSON();
      return {
        id: json.id,
        name: json.name,
        image_file: json.image_file,
        model: {
          id: json.model_id?.id,
          name: json.model_id?.name,
        },
      };
    })
  );
});

module.exports = { search, searchUserByEmail, searchPrototypesBySignal };
