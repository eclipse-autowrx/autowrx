// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const axios = require('axios');
const { HttpProxyAgent } = require('http-proxy-agent'); // ⬅️ Add destructuring
const { HttpsProxyAgent } = require('https-proxy-agent'); // ⬅️ Add destructuring
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

// Get proxy configuration from environment
const PROXY_URL = process.env.PROXY_URL || 'http://rb-proxy-apac.bosch.com:8080';

/**
 * Get appropriate proxy agent based on URL protocol
 */
function getProxyAgents() {
  if (!PROXY_URL) {
    return {};
  }

  const agentOptions = {
    rejectUnauthorized: false,
  };

  const httpAgent = new HttpProxyAgent(PROXY_URL, agentOptions);
  const httpsAgent = new HttpsProxyAgent(PROXY_URL, agentOptions);

  return {
    httpAgent,
    httpsAgent,
  };
}

/**
 * Parse GitHub URL to extract repository information
 */
const parseGitHubUrl = (url) => {
  try {
    // Handle different GitHub URL formats with safe regex patterns
    const githubDomain = 'github\\.com';
    const userRepo = '([^/]+)\\/([^/]+?)';
    const optionalGit = '(?:\\.git)?';
    const optionalPath = '(?:\\/(?:tree|blob)\\/([^/]+)(?:\\/.*?)?)?\\/?$';

    const patterns = [
      // https://github.com/owner/repo
      new RegExp(`^https:\\/\\/${githubDomain}\\/${userRepo}${optionalGit}${optionalPath}`),
      // github.com/owner/repo (with optional protocol)
      new RegExp(`^(?:https?:\\/\\/)?${githubDomain}\\/${userRepo}${optionalGit}${optionalPath}`),
    ];

    // Use traditional for loop instead of for...of
    for (let i = 0; i < patterns.length; i += 1) {
      const match = url.match(patterns[i]);
      if (match) {
        const [, owner, repo, branch, path] = match;
        return {
          owner,
          repo,
          branch: branch || 'main',
          path: path || '',
        };
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Download GitHub repository as ZIP
 */
const downloadGitHubRepo = catchAsync(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'GitHub repository URL is required');
  }

  const repoInfo = parseGitHubUrl(url);
  if (!repoInfo) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid GitHub repository URL format');
  }

  try {
    const branch = repoInfo.branch || 'main';
    const zipUrl = `https://github.com/${repoInfo.owner}/${repoInfo.repo}/archive/refs/heads/${branch}.zip`;

    console.log('=== GitHub Download Debug ===');
    console.log('Request URL:', url);
    console.log('Zip URL:', zipUrl);
    console.log('PROXY_URL:', PROXY_URL);
    console.log('Environment:', process.env.NODE_ENV);

    // Get proxy agents for axios
    const { httpAgent, httpsAgent } = getProxyAgents();

    const response = await axios.get(zipUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'AutoWRX-Platform/1.0',
      },
      httpAgent,
      httpsAgent,
      proxy: false, // Disable axios default proxy handling
    });

    console.log('Download successful, size:', response.data.length);

    if (!response) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Repository not found or not accessible');
    }

    // Set response headers for ZIP download
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${repoInfo.repo}-${branch}.zip"`,
      'Content-Length': response.data.length,
      'X-Used-Branch': branch,
      'X-Repo-Info': JSON.stringify({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        branch,
        path: repoInfo.path,
      }),
    });

    res.status(httpStatus.OK).send(response.data);
  } catch (error) {
    console.error('Download error:', error.message);
    console.error('Error code:', error.code);

    if (error.response && error.response.status === 404) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Repository not found or not accessible');
    }
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new ApiError(httpStatus.REQUEST_TIMEOUT, 'Request timeout while downloading repository');
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to download repository: ${error.message}`);
  }
});

/**
 * Get repository information from GitHub API
 */
const getRepoInfo = catchAsync(async (req, res) => {
  const { owner, repo } = req.params;

  if (!owner || !repo) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Repository owner and name are required');
  }

  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    // Get proxy agents
    const { httpAgent, httpsAgent } = getProxyAgents();

    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'AutoWRX-Platform/1.0',
      },
      timeout: 10000,
      httpAgent,
      httpsAgent,
      proxy: false, // Disable axios default proxy handling
    });

    const repoData = {
      name: response.data.name,
      description: response.data.description,
      language: response.data.language,
      defaultBranch: response.data.default_branch,
      isPrivate: response.data.private,
      stars: response.data.stargazers_count,
      forks: response.data.forks_count,
      size: response.data.size,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };

    res.status(httpStatus.OK).json(repoData);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Repository not found or not accessible');
    }
    // For network errors (DNS, timeout, etc.), return a more helpful message
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        'Cannot access GitHub API. This may be due to network restrictions, firewall, or lack of internet connectivity. Please check your network connection or contact your administrator.',
      );
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to fetch repository information: ${error.message}`);
  }
});

module.exports = {
  downloadGitHubRepo,
  getRepoInfo,
};
