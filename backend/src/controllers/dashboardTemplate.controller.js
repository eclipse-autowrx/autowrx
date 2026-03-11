// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { dashboardTemplateService } = require('../services');

const list = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await dashboardTemplateService.query(filter, options);
  res.send(result);
});

const getById = catchAsync(async (req, res) => {
  const doc = await dashboardTemplateService.getById(req.params.id);
  if (!doc) return res.status(httpStatus.NOT_FOUND).send({ message: 'Not found' });
  res.send(doc);
});

const create = catchAsync(async (req, res) => {
  const body = {
    ...req.body,
    created_by: req.user.id,
    updated_by: req.user.id,
  };
  const doc = await dashboardTemplateService.create(body);
  res.status(httpStatus.CREATED).send(doc);
});

const update = catchAsync(async (req, res) => {
  const body = {
    ...req.body,
    updated_by: req.user.id,
  };
  const doc = await dashboardTemplateService.updateById(req.params.id, body);
  res.send(doc);
});

const remove = catchAsync(async (req, res) => {
  await dashboardTemplateService.removeById(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

// Admin: list all templates regardless of visibility
const listAll = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await dashboardTemplateService.query(filter, options);
  res.send(result);
});

module.exports = { list, getById, create, update, remove, listAll };
