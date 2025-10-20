// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { default: axios } = require('axios');
const { Issue } = require('../models');
const logger = require('../config/logger');
const config = require('../config/config');

const createIssue = async (issueBody) => {
  const { githubAccessToken, title, content } = issueBody;
  try {
    const response = (
      await axios.post(
        config.githubIssueSubmitUrl,
        {
          title,
          body: content,
        },
        {
          headers: {
            Authorization: `Bearer ${githubAccessToken}`,
            Accept: 'application/vnd.github.raw+json',
          },
        }
      )
    ).data;
    const { html_url } = response;
    return Issue.create({
      extendedApi: issueBody.extendedApi,
      link: html_url,
    });
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

const queryIssues = async (filter, options) => {
  const issues = await Issue.paginate(filter, options);
  return issues;
};

const getIssueById = async (id) => {
  return Issue.findById(id);
};

const updateIssueById = async (issueId, updateBody) => {
  const issue = await getIssueById(issueId);
  if (!issue) {
    throw new Error('Issue not found');
  }
  Object.assign(issue, updateBody);
  await issue.save();
  return issue;
};

const deleteIssueById = async (issueId) => {
  const issue = await getIssueById(issueId);
  if (!issue) {
    throw new Error('Issue not found');
  }
  await issue.remove();
  return issue;
};

const getIssueByApi = async (apiId) => {
  return Issue.findOne({ extendedApi: apiId });
};

module.exports = {
  createIssue,
  queryIssues,
  getIssueById,
  updateIssueById,
  deleteIssueById,
  getIssueByApi,
};
