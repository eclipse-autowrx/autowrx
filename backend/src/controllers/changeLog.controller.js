// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { changeLogService } = require('../services');
const pick = require('../utils/pick');

const listChangeLogs = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['ref_type', 'ref', 'created_by', 'action']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const changeLogs = await changeLogService.listChangeLogs(filter, options);
  res.status(httpStatus.OK).json(changeLogs);
});

module.exports.listChangeLogs = listChangeLogs;
