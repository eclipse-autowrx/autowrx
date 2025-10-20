// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createIssue = {
  body: Joi.object().keys({
    extendedApi: Joi.string().required(),
    model: Joi.string().required(),
    githubAccessToken: Joi.string().required(),
    title: Joi.string().required(),
    content: Joi.string().required(),
  }),
};

const getIssues = {
  query: Joi.object().keys({
    extendedApi: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getIssue = {
  params: Joi.object().keys({
    issueId: Joi.string().custom(objectId),
  }),
};

const updateIssue = {
  params: Joi.object().keys({
    issueId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      extendedApi: Joi.string().custom(objectId),
    })
    .min(1),
};

const deleteIssue = {
  params: Joi.object().keys({
    issueId: Joi.string().custom(objectId),
  }),
};

const getIssueByApi = {
  query: Joi.object().keys({
    extendedApi: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createIssue,
  getIssues,
  getIssue,
  updateIssue,
  deleteIssue,
  getIssueByApi,
};
