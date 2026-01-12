// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const Joi = require('joi');
const { objectId } = require('./custom.validation');

const githubOAuthCallback = {
  body: Joi.object().keys({
    code: Joi.string().required(),
    userId: Joi.string().custom(objectId),
  }),
};

const createRepository = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().allow(''),
    private: Joi.boolean(),
    auto_init: Joi.boolean(),
  }),
};

const linkRepository = {
  body: Joi.object().keys({
    prototype_id: Joi.string().custom(objectId).required(),
    repo_id: Joi.string().required(),
    repo_name: Joi.string().required(),
    repo_full_name: Joi.string().required(),
    repo_url: Joi.string().required(),
    clone_url: Joi.string().required(),
    default_branch: Joi.string(),
    is_private: Joi.boolean(),
  }),
};

const getFileContents = {
  params: Joi.object().keys({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
  }),
  query: Joi.object().keys({
    path: Joi.string().required(),
    ref: Joi.string(),
  }),
};

const commitFile = {
  params: Joi.object().keys({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
  }),
  body: Joi.object().keys({
    path: Joi.string().required(),
    content: Joi.string().required(),
    message: Joi.string().required(),
    sha: Joi.string().allow('', null),
    branch: Joi.string(),
  }),
};

const commitMultipleFiles = {
  params: Joi.object().keys({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
  }),
  body: Joi.object().keys({
    branch: Joi.string().default('main'),
    message: Joi.string().required().min(1),
    files: Joi.array()
      .items(
        Joi.object().keys({
          path: Joi.string().required(),
          content: Joi.string().required(),
        })
      )
      .required()
      .min(1),
  }),
};

const getCommits = {
  params: Joi.object().keys({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
  }),
  query: Joi.object().keys({
    sha: Joi.string(),
    per_page: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1),
  }),
};

const getBranches = {
  params: Joi.object().keys({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
  }),
};

const getLinkedRepo = {
  params: Joi.object().keys({
    prototypeId: Joi.string().custom(objectId).required(),
  }),
};

const listRepos = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    per_page: Joi.number().integer().min(1).max(100),
    sort: Joi.string().valid('created', 'updated', 'pushed', 'full_name'),
    direction: Joi.string().valid('asc', 'desc'),
  }),
};

const createBranch = {
  params: Joi.object().keys({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
  }),
  body: Joi.object().keys({
    branchName: Joi.string().pattern(/^[a-zA-Z0-9._/-]+$/).required(),
    baseBranch: Joi.string().default('main'),
  }),
};

module.exports = {
  githubOAuthCallback,
  createRepository,
  linkRepository,
  getFileContents,
  commitFile,
  commitMultipleFiles,
  getCommits,
  getBranches,
  createBranch,
  getLinkedRepo,
  listRepos,
};
