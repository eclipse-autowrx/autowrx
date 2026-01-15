// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { gitService } = require('../services');

/**
 * Handle GitHub OAuth callback
 */
const githubOAuthCallback = catchAsync(async (req, res) => {
  const { code, userId } = req.body;

  // Get userId from either authenticated user or request body (popup flow)
  const targetUserId = req.user?.id || userId;

  if (!targetUserId) {
    return res.status(httpStatus.UNAUTHORIZED).send({
      message: 'User not authenticated. Please provide userId.',
    });
  }

  // Exchange code for access token
  const tokenData = await gitService.exchangeGithubCode(code);

  // Get GitHub user info
  const githubUser = await gitService.getGithubUser(tokenData.access_token);

  // Save credentials
  await gitService.saveGitCredentials(
    targetUserId,
    githubUser,
    tokenData.access_token,
    tokenData.refresh_token
  );

  res.status(httpStatus.OK).send({
    message: 'GitHub authentication successful',
    user: {
      username: githubUser.login,
      avatar_url: githubUser.avatar_url,
      email: githubUser.email,
    },
  });
});

/**
 * Get current GitHub authentication status
 */
const getAuthStatus = catchAsync(async (req, res) => {
  const userId = req.user.id;

  try {
    const credentials = await gitService.getGitCredentials(userId);
    res.status(httpStatus.OK).send({
      authenticated: true,
      username: credentials.github_username,
      avatar_url: credentials.github_avatar_url,
      email: credentials.github_email,
    });
  } catch (error) {
    res.status(httpStatus.OK).send({
      authenticated: false,
    });
  }
});

/**
 * Disconnect GitHub account
 */
const disconnectGithub = catchAsync(async (req, res) => {
  const userId = req.user.id;
  await gitService.deleteGitCredentials(userId);

  res.status(httpStatus.OK).send({
    message: 'GitHub account disconnected successfully',
  });
});

/**
 * List GitHub repositories
 */
const listRepositories = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const repositories = await gitService.listGithubRepositories(userId, req.query);

  res.status(httpStatus.OK).send(repositories);
});

/**
 * Create a new GitHub repository
 */
const createRepository = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const repository = await gitService.createGithubRepository(userId, req.body);

  res.status(httpStatus.CREATED).send(repository);
});

/**
 * Link repository to prototype
 */
const linkRepository = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { prototype_id, repo_id, repo_name, repo_full_name, repo_url, clone_url, default_branch, is_private } = req.body;

  const repoInfo = {
    id: repo_id,
    name: repo_name,
    full_name: repo_full_name,
    html_url: repo_url,
    clone_url: clone_url,
    default_branch: default_branch || 'main',
    private: is_private || false,
  };

  const linkedRepo = await gitService.linkRepositoryToPrototype(userId, prototype_id, repoInfo);

  res.status(httpStatus.OK).send(linkedRepo);
});

/**
 * Get linked repository for prototype
 */
const getLinkedRepository = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { prototypeId } = req.params;

  const repository = await gitService.getLinkedRepository(userId, prototypeId);

  res.status(httpStatus.OK).send(repository);
});

/**
 * Get file contents from repository
 */
const getFileContents = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { owner, repo } = req.params;
  const { path, ref } = req.query;

  const contents = await gitService.getFileContents(userId, owner, repo, path, ref);

  res.status(httpStatus.OK).send(contents);
});

/**
 * Commit file to repository
 */
const commitFile = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { owner, repo } = req.params;
  const fileData = req.body;

  const result = await gitService.createOrUpdateFile(userId, owner, repo, fileData.path, fileData);

  res.status(httpStatus.OK).send(result);
});

/**
 * Commit multiple files atomically to repository
 */
const commitMultipleFiles = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { owner, repo } = req.params;
  const { branch, files, message } = req.body;

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'Files array is required and must contain at least one file',
    });
  }

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(httpStatus.BAD_REQUEST).send({
      message: 'Commit message is required',
    });
  }

  const result = await gitService.commitMultipleFiles(userId, owner, repo, branch || 'main', files, message);

  res.status(httpStatus.OK).send(result);
});

/**
 * Get commits for repository
 */
const getCommits = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { owner, repo } = req.params;

  const commits = await gitService.getCommits(userId, owner, repo, req.query);

  res.status(httpStatus.OK).send(commits);
});

/**
 * Get branches for repository
 */
const getBranches = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { owner, repo } = req.params;

  const branches = await gitService.getBranches(userId, owner, repo);

  res.status(httpStatus.OK).send(branches);
});

/**
 * Create a new branch
 */
const createBranch = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { owner, repo } = req.params;
  const { branchName, baseBranch = 'main' } = req.body;

  const result = await gitService.createBranch(userId, owner, repo, branchName, baseBranch);

  res.status(httpStatus.CREATED).send(result);
});

/**
 * Scan GitHub repository and return content
 */
const scanRepository = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { owner, repo } = req.params;
  const { ref } = req.query;

  const content = await gitService.scanRepository(userId, owner, repo, ref);

  res.status(httpStatus.OK).send(content);
});

module.exports = {
  githubOAuthCallback,
  getAuthStatus,
  disconnectGithub,
  listRepositories,
  createRepository,
  linkRepository,
  getLinkedRepository,
  getFileContents,
  commitFile,
  commitMultipleFiles,
  createBranch,
  getCommits,
  getBranches,
  scanRepository,
};
