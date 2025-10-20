// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { prototypeService, permissionService } = require('../services');
const pick = require('../utils/pick');
const { PERMISSIONS } = require('../config/roles');
const ApiError = require('../utils/ApiError');
const FeedbackPrototypeDecorator = require('../decorators/FeedbackPrototypeDecorator');
const FeedbackPrototypeListDecorator = require('../decorators/FeedbackPrototypeListDecorator');

const createPrototype = catchAsync(async (req, res) => {
  if (!(await permissionService.hasPermission(req.user.id, PERMISSIONS.READ_MODEL, req.body.model_id))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  const prototypeId = await prototypeService.createPrototype(req.user.id, req.body);
  res.status(201).send(prototypeId);
});

const bulkCreatePrototypes = catchAsync(async (req, res) => {
  const modelIds = new Set(req.body.map((prototype) => prototype.model_id));
  if (modelIds.size !== 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'All prototypes must belong to the same model');
  }

  if (!(await permissionService.hasPermission(req.user.id, PERMISSIONS.READ_MODEL, modelIds.values().next().value))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  const prototypeIds = await prototypeService.bulkCreatePrototypes(req.user.id, req.body);
  res.status(201).send(prototypeIds);
});

const listPrototypes = catchAsync(async (req, res) => {
  const readableModelIds = await permissionService.listReadableModelIds(req.user?.id);

  const filter = pick(req.query, ['state', 'model_id', 'name', 'complexity_level', 'autorun', 'created_by']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'fields']);

  // Check if user has permission to view the model
  if (readableModelIds !== '*') {
    if (!filter.model_id) {
      filter.model_id = { $in: readableModelIds };
    } else if (!readableModelIds.includes(filter.model_id)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }

  const prototypes = await prototypeService.queryPrototypes(filter, {
    ...options,
    populate: ['created_by', 'name image_file'],
  });

  prototypes.results = await new FeedbackPrototypeListDecorator(prototypes.results).getPrototypeList();

  res.send(prototypes);
});

const getPrototype = catchAsync(async (req, res) => {
  const prototype = await prototypeService.getPrototypeById(req.params.id, req.user?.id);
  const finalResult = await new FeedbackPrototypeDecorator(prototype).getPrototype();
  res.send(finalResult);
});

const updatePrototype = catchAsync(async (req, res) => {
  const prototype = await prototypeService.updatePrototypeById(req.params.id, req.body, req.user.id);
  res.send(prototype);
});

const deletePrototype = catchAsync(async (req, res) => {
  await prototypeService.deletePrototypeById(req.params.id, req.user.id);
  res.status(204).send();
});

const listRecentPrototypes = catchAsync(async (req, res) => {
  const prototypes = await prototypeService.listRecentPrototypes(req.user.id);
  res.send(prototypes);
});

const executeCode = catchAsync(async (req, res) => {
  // Check if user has permission to view the prototype
  await prototypeService.getPrototypeById(req.params.id, req.user?.id);
  await prototypeService.executeCode(req.params.id, req.body);
  res.send('OK');
});

const listPopularPrototypes = catchAsync(async (req, res) => {
  const prototypes = await prototypeService.listPopularPrototypes(req.user?.id);
  res.send(prototypes);
});

module.exports = {
  createPrototype,
  listPrototypes,
  getPrototype,
  updatePrototype,
  deletePrototype,
  listRecentPrototypes,
  listPopularPrototypes,
  executeCode,
  bulkCreatePrototypes,
};
