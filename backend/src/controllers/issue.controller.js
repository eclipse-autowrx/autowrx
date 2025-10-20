// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { issueService, extendedApiService } = require('../services');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');

const createIssue = catchAsync(async (req, res) => {
  const { body } = req;
  const extendedApi = await extendedApiService.getExtendedApiByApiNameAndModel(body.extendedApi, body.model);
  body.extendedApi = extendedApi.id;
  const issue = await issueService.createIssue(body);
  res.status(httpStatus.CREATED).send(issue);
});

const getIssues = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['model', 'extendedApi']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await issueService.queryIssues(filter, options);
  res.send(result);
});

const getIssue = catchAsync(async (req, res) => {
  const issue = await issueService.getIssueById(req.params.issueId);
  if (!issue) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Issue not found');
  }
  res.send(issue);
});

const updateIssue = catchAsync(async (req, res) => {
  const issue = await issueService.updateIssueById(req.params.issueId, req.body);
  res.send(issue);
});

const deleteIssue = catchAsync(async (req, res) => {
  await issueService.deleteIssueById(req.params.issueId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getIssueByApi = catchAsync(async (req, res) => {
  const issue = await issueService.getIssueByApi(req.query.extendedApi);
  if (!issue) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Issue not found');
  }
  res.send(issue);
});

module.exports = {
  createIssue,
  getIssues,
  getIssue,
  updateIssue,
  deleteIssue,
  getIssueByApi,
};
