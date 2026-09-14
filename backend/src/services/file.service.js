// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const axios = require('axios');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const logger = require('../config/logger');
const config = require('../config/config');
const fs = require('fs');

/**
 *
 * @param {File} file
 * @returns {Promise<{url: string}>}
 */
const upload = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    // Use the backend's own upload endpoint
    return (await axios.post(`http://localhost:${config.port}/v2/system/file/upload/store-be`, formData)).data;
  } catch (error) {
    logger.error(`Failed to upload file ${error}`);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to upload file');
  }
};

/**
 *
 * @param {string} url
 * @returns {string}
 */
const resolveUrl = (url) => {
  if (!url.startsWith('/')) {
    return url;
  }

  // The backend serves its own uploads, so just use localhost and the backend port
  // This converts relative paths like "/d/..." to full URLs that can be fetched
  return `http://localhost:${config.port}${url}`;
};

/**
 * @param {string} url
 * @param {'File' | 'Buffer' | 'Uint8Array'} [encoding]
 * @returns {Promise<File>}
 */
const getFileFromURL = async (url, encoding = 'File') => {
  try {
    const response = await fetch(url);
    if (encoding === 'File') {
      const blob = await response.blob();
      const file = new File([blob], 'avatar.jpg', { type: blob.type });
      return file;
    }
    if (encoding === 'Buffer') {
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    }
    if (encoding === 'Uint8Array') {
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    }
    throw new Error('Invalid file format');
  } catch (error) {
    logger.info(`Failed to get file from URL ${url}`);
  }
};

const downloadFile = async (url, filePath) => {
  try {
    if (!url) {
      throw new Error('URL is required');
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    // Ensure directory exists
    const dir = require('path').dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    logger.debug(`Downloaded file to ${filePath}`);
  } catch (error) {
    logger.error(`Failed to download file from ${url} to ${filePath}: ${error.message}`);
    throw error; // Re-throw so caller knows it failed
  }
};

/**
 *
 * @param {File} file1
 * @param {File} file2
 */
const compareImages = async (file1, file2) => {};

module.exports.upload = upload;
module.exports.resolveUrl = resolveUrl;
module.exports.getFileFromURL = getFileFromURL;
module.exports.downloadFile = downloadFile;
