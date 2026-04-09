// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getWorkspace = {
  params: Joi.object().keys({
    prototypeId: Joi.string().custom(objectId).required(),
  }),
};

const prepareWorkspace = {
  params: Joi.object().keys({
    prototypeId: Joi.string().custom(objectId).required(),
  }),
};

const getWorkspaceStatus = {
  params: Joi.object().keys({
    prototypeId: Joi.string().custom(objectId).required(),
  }),
};

const getWorkspaceTimings = {
  params: Joi.object().keys({
    prototypeId: Joi.string().custom(objectId).required(),
  }),
};

const getWorkspaceAgentLogs = {
  params: Joi.object().keys({
    workspaceAgentId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    before: Joi.number().integer(),
    after: Joi.number().integer(),
    follow: Joi.boolean(),
    no_compression: Joi.boolean(),
    format: Joi.string().valid('json', 'text'),
  }),
};

const getWorkspaceLogs = {
  params: Joi.object().keys({
    prototypeId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    before: Joi.number().integer(),
    after: Joi.number().integer(),
    follow: Joi.boolean(),
    no_compression: Joi.boolean(),
    format: Joi.string().valid('json', 'text'),
  }),
};

const triggerRun = {
  params: Joi.object().keys({
    prototypeId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    runKind: Joi.string().valid('python-main', 'c-main', 'cpp-main').optional(),
  }),
};

const getRunOutput = {
  params: Joi.object().keys({
    prototypeId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  getWorkspace,
  prepareWorkspace,
  getWorkspaceStatus,
  getWorkspaceTimings,
  getWorkspaceAgentLogs,
  getWorkspaceLogs,
  triggerRun,
  getRunOutput,
};
