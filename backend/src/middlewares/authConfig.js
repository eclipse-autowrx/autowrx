// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { getAuthConfig } = require('../utils/siteConfig');
const logger = require('../config/logger');

/**
 * Middleware to preload authentication configs and make them available in req.authConfig
 * This allows synchronous access to auth configs in routes
 */
const loadAuthConfigs = async (req, res, next) => {
  try {
    // Load all auth configs in parallel
    const [publicViewing, selfRegistration, ssoAutoRegistration, passwordManagement] = await Promise.all([
      getAuthConfig('PUBLIC_VIEWING'),
      getAuthConfig('SELF_REGISTRATION'),
      getAuthConfig('SSO_AUTO_REGISTRATION'),
      getAuthConfig('PASSWORD_MANAGEMENT'),
    ]);

    // Attach to request object for synchronous access
    req.authConfig = {
      PUBLIC_VIEWING: publicViewing,
      SELF_REGISTRATION: selfRegistration,
      SSO_AUTO_REGISTRATION: ssoAutoRegistration,
      PASSWORD_MANAGEMENT: passwordManagement,
    };

    next();
  } catch (error) {
    logger.error('Failed to load auth configs: %s', error.message);
    // On error, use secure defaults (all false)
    req.authConfig = {
      PUBLIC_VIEWING: false,
      SELF_REGISTRATION: false,
      SSO_AUTO_REGISTRATION: false,
      PASSWORD_MANAGEMENT: false,
    };
    next();
  }
};

module.exports = loadAuthConfigs;
