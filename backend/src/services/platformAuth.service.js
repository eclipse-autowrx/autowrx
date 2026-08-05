// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
const userService = require('./user.service');
const logger = require('../config/logger');

const IDENTITY_FIELDS = ['id', 'email', 'firstname', 'lastname', 'name'];

/**
 * @param {string} email
 * @returns {string}
 */
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '(missing)';
  const [local, domain] = email.split('@');
  const maskedLocal = local.length <= 1 ? '*' : `${local[0]}***`;
  return `${maskedLocal}@${domain}`;
};

/**
 * @param {import('express').Request} req
 * @param {Record<string, string>} headerMap
 * @returns {Record<string, { header: string, present: boolean }>}
 */
const describeHeaderPresence = (req, headerMap) => {
  return Object.fromEntries(
    Object.entries(headerMap).map(([field, headerName]) => [
      field,
      { header: headerName, present: Boolean(req.get(headerName)) },
    ])
  );
};

/**
 * @param {import('express').Request} req
 * @param {Record<string, string>} headerMap
 * @returns {{ id?: string, email?: string, firstname?: string, lastname?: string, name?: string }}
 */
const extractIdentity = (req, headerMap) => {
  const identity = {};
  for (const field of IDENTITY_FIELDS) {
    const headerName = headerMap[field];
    if (headerName) {
      const value = req.get(headerName);
      if (value) {
        identity[field] = value;
      }
    }
  }
  return identity;
};

/**
 * @param {{ firstname?: string, lastname?: string, name?: string }} identity
 * @returns {string}
 */
const resolveDisplayName = (identity) => {
  const { firstname, lastname, name } = identity;
  if (firstname || lastname) {
    return `${firstname || ''} ${lastname || ''}`.trim();
  }
  if (name) {
    return name.trim();
  }
  return 'Anonymous';
};

/**
 * @param {import('express').Request} req
 * @returns {Promise<import('../models/user.model').User>}
 */
const resolveUserFromHeaders = async (req) => {
  const headerMap = config.auth.platform.headers;
  const identity = extractIdentity(req, headerMap);

  logger.debug(
    'Platform auth attempt: method=%s path=%s platform=%s headers=%o',
    req.method,
    req.originalUrl,
    config.auth.platform.name,
    describeHeaderPresence(req, headerMap)
  );

  if (!identity.email) {
    logger.debug(
      'Platform auth failed: missing email header; method=%s path=%s',
      req.method,
      req.originalUrl
    );
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  const displayName = resolveDisplayName(identity);

  try {
    const user = await userService.upsertPlatformUser({
      email: identity.email,
      providerUserId: identity.id,
      name: displayName,
      provider: config.auth.platform.name,
    });
    logger.debug(
      'Platform auth succeeded: email=%s userId=%s path=%s',
      maskEmail(identity.email),
      user.id || user._id,
      req.originalUrl
    );
    return user;
  } catch (error) {
    logger.error('Error resolving platform user');
    logger.error(error?.message || error);
    logger.debug(
      'Platform auth failed during upsert: email=%s path=%s reason=%s',
      maskEmail(identity.email),
      req.originalUrl,
      error?.message || error
    );
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/** @type {Record<string, (req: import('express').Request) => Promise<import('../models/user.model').User>>} */
const providers = {
  headers: resolveUserFromHeaders,
};

/**
 * @param {import('express').Request} req
 * @returns {Promise<import('../models/user.model').User>}
 */
const resolveUser = async (req) => {
  const provider = providers.headers;
  if (!provider) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Platform auth provider not configured');
  }
  return provider(req);
};

module.exports = {
  extractIdentity,
  resolveDisplayName,
  resolveUser,
  resolveUserFromHeaders,
  describeHeaderPresence,
  maskEmail,
  providers,
};
