// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const axios = require('axios');
const GitCredential = require('../models/gitCredential.model');
const GitRepository = require('../models/gitRepository.model');
const ApiError = require('../utils/ApiError');

/**
 * Save or update GitHub credentials
 * @param {string} userId - User ID
 * @param {Object} githubData - GitHub user data
 * @param {string} accessToken - GitHub access token
 * @param {string} refreshToken - GitHub refresh token (optional)
 * @returns {Promise<GitCredential>}
 */
const saveGitCredentials = async (userId, githubData, accessToken, refreshToken = null) => {
  const credentialData = {
    user_id: userId,
    github_access_token: accessToken,
    github_refresh_token: refreshToken,
    github_username: githubData.login,
    github_user_id: githubData.id.toString(),
    github_avatar_url: githubData.avatar_url,
    github_email: githubData.email,
    expires_at: refreshToken ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null, // 1 year for tokens with refresh
  };

  const existing = await GitCredential.findOne({ user_id: userId });
  if (existing) {
    Object.assign(existing, credentialData);
    await existing.save();
    return existing;
  }

  return GitCredential.create(credentialData);
};

/**
 * Get GitHub credentials for a user
 * @param {string} userId - User ID
 * @returns {Promise<GitCredential>}
 */
const getGitCredentials = async (userId) => {
  const credentials = await GitCredential.findOne({ user_id: userId });
  if (!credentials) {
    throw new ApiError(httpStatus.NOT_FOUND, 'GitHub credentials not found. Please authenticate with GitHub first.');
  }
  return credentials;
};

/**
 * Delete GitHub credentials for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const deleteGitCredentials = async (userId) => {
  await GitCredential.deleteOne({ user_id: userId });
};

/**
 * Exchange GitHub OAuth code for access token
 * @param {string} code - GitHub OAuth code
 * @returns {Promise<Object>}
 */
const exchangeGithubCode = async (code) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'GitHub OAuth not configured');
  }

  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    if (response.data.error) {
      throw new ApiError(httpStatus.BAD_REQUEST, response.data.error_description || 'GitHub OAuth failed');
    }

    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to exchange GitHub code');
  }
};

/**
 * Get GitHub user info using access token
 * @param {string} accessToken - GitHub access token
 * @returns {Promise<Object>}
 */
const getGithubUser = async (accessToken) => {
  try {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return response.data;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid GitHub access token');
  }
};

/**
 * List GitHub repositories for authenticated user
 * @param {string} userId - User ID
 * @param {Object} options - Query options (page, per_page, sort, etc.)
 * @returns {Promise<Array>}
 */
const listGithubRepositories = async (userId, options = {}) => {
  const credentials = await getGitCredentials(userId);
  const { page = 1, per_page = 30, sort = 'updated', direction = 'desc' } = options;

  try {
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${credentials.github_access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      params: {
        page,
        per_page,
        sort,
        direction,
        affiliation: 'owner,collaborator',
      },
    });

    return response.data;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch GitHub repositories');
  }
};

/**
 * Create a new GitHub repository
 * @param {string} userId - User ID
 * @param {Object} repoData - Repository data
 * @returns {Promise<Object>}
 */
const createGithubRepository = async (userId, repoData) => {
  const credentials = await getGitCredentials(userId);
  const { name, description = '', private: isPrivate = false, auto_init = true } = repoData;

  try {
    const response = await axios.post(
      'https://api.github.com/user/repos',
      {
        name,
        description,
        private: isPrivate,
        auto_init: auto_init,
      },
      {
        headers: {
          Authorization: `Bearer ${credentials.github_access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response?.status === 422) {
      throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, 'Repository already exists or invalid name');
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create GitHub repository');
  }
};

/**
 * Link a GitHub repository to a prototype
 * @param {string} userId - User ID
 * @param {string} prototypeId - Prototype ID
 * @param {Object} repoInfo - GitHub repository info
 * @returns {Promise<GitRepository>}
 */
const linkRepositoryToPrototype = async (userId, prototypeId, repoInfo) => {
  const existing = await GitRepository.findOne({ user_id: userId, prototype_id: prototypeId });
  
  const repoData = {
    user_id: userId,
    prototype_id: prototypeId,
    github_repo_id: repoInfo.id.toString(),
    github_repo_name: repoInfo.name,
    github_repo_full_name: repoInfo.full_name,
    github_repo_url: repoInfo.html_url,
    github_repo_clone_url: repoInfo.clone_url,
    github_default_branch: repoInfo.default_branch || 'main',
    github_repo_private: repoInfo.private,
  };

  if (existing) {
    Object.assign(existing, repoData);
    await existing.save();
    return existing;
  }

  return GitRepository.create(repoData);
};

/**
 * Get repository linked to prototype
 * @param {string} userId - User ID
 * @param {string} prototypeId - Prototype ID
 * @returns {Promise<GitRepository>}
 */
const getLinkedRepository = async (userId, prototypeId) => {
  const repo = await GitRepository.findOne({ user_id: userId, prototype_id: prototypeId });
  if (!repo) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No repository linked to this prototype');
  }
  return repo;
};

/**
 * Get file contents from GitHub repository
 * @param {string} userId - User ID
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {string} ref - Branch/commit reference
 * @returns {Promise<Object>}
 */
const getFileContents = async (userId, owner, repo, path, ref = 'main') => {
  const credentials = await getGitCredentials(userId);

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${credentials.github_access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: { ref },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new ApiError(httpStatus.NOT_FOUND, 'File not found');
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch file contents');
  }
};

/**
 * Create or update file in GitHub repository
 * @param {string} userId - User ID
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path
 * @param {Object} fileData - File data (content, message, sha, branch)
 * @returns {Promise<Object>}
 */
const createOrUpdateFile = async (userId, owner, repo, path, fileData) => {
  const credentials = await getGitCredentials(userId);
  const { content, message, sha = null, branch = 'main' } = fileData;

  // Encode content to base64
  const encodedContent = Buffer.from(content).toString('base64');

  const body = {
    message,
    content: encodedContent,
    branch,
  };

  if (sha) {
    body.sha = sha; // Required for updates
  }

  try {
    const response = await axios.put(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${credentials.github_access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      throw new ApiError(httpStatus.CONFLICT, 'File has been modified. Please pull latest changes first.');
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to commit file');
  }
};

/**
 * Get commits for a repository
 * @param {string} userId - User ID
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
const getCommits = async (userId, owner, repo, options = {}) => {
  const credentials = await getGitCredentials(userId);
  const { sha = 'main', per_page = 30, page = 1 } = options;

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      {
        headers: {
          Authorization: `Bearer ${credentials.github_access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        params: { sha, per_page, page },
      }
    );

    return response.data;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch commits');
  }
};

/**
 * Get branches for a repository
 * @param {string} userId - User ID
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Array>}
 */
const getBranches = async (userId, owner, repo) => {
  const credentials = await getGitCredentials(userId);

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/branches`,
      {
        headers: {
          Authorization: `Bearer ${credentials.github_access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    return response.data;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch branches');
  }
};

module.exports = {
  saveGitCredentials,
  getGitCredentials,
  deleteGitCredentials,
  exchangeGithubCode,
  getGithubUser,
  listGithubRepositories,
  createGithubRepository,
  linkRepositoryToPrototype,
  getLinkedRepository,
  getFileContents,
  createOrUpdateFile,
  getCommits,
  getBranches,
};
