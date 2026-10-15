// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const rateLimit = require('express-rate-limit');
const httpStatus = require('http-status');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');

const MINUTE = 60 * 1000;

// Defaults per auth flow; override any field via AUTH_RATE_LIMITS (JSON), e.g. {"login":{"max":20}}
const RATE_LIMITS = {
  // Failed attempts per IP across all brute-forceable auth endpoints (credential stuffing over many emails)
  authIp: { windowMs: 15 * MINUTE, max: 50, skipSuccessfulRequests: true },
  // Failed logins per IP + email
  login: { windowMs: 15 * MINUTE, max: 10, skipSuccessfulRequests: true },
  register: { windowMs: 60 * MINUTE, max: 5 },
  // Failed refreshes per IP; successful ones happen on every page load and are not counted
  refresh: { windowMs: 15 * MINUTE, max: 60, skipSuccessfulRequests: true },
  // Reset-code emails per IP + email
  forgotPassword: { windowMs: 60 * MINUTE, max: 3 },
  // Failed reset-code guesses per IP + email
  resetPassword: { windowMs: 15 * MINUTE, max: 5, skipSuccessfulRequests: true },
  // Email verification and SSO entry points, per IP
  verifyEmail: { windowMs: 15 * MINUTE, max: 10 },
  sso: { windowMs: 15 * MINUTE, max: 30 },
};

const ipKey = (req) => req.ip;

const ipEmailKey = (req) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return `${req.ip}:${email}`;
};

/**
 * Build a rate limiter that reports through the shared error handler and honours RATE_LIMIT_ENABLED
 * @param {Object} options - express-rate-limit options (windowMs, max, skipSuccessfulRequests, keyGenerator)
 * @returns {Function} express middleware
 */
const createLimiter = ({ keyGenerator = ipKey, ...options }) =>
  rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator,
    skip: () => !config.rateLimit.enabled,
    handler: (req, res, next) =>
      next(new ApiError(httpStatus.TOO_MANY_REQUESTS, 'Too many requests, please try again later.')),
    ...options,
  });

const limitsFor = (name) => ({ ...RATE_LIMITS[name], ...(config.rateLimit.overrides[name] || {}) });

const authIpLimiter = createLimiter(limitsFor('authIp'));
const loginLimiter = createLimiter({ ...limitsFor('login'), keyGenerator: ipEmailKey });
const registerLimiter = createLimiter(limitsFor('register'));
const refreshLimiter = createLimiter(limitsFor('refresh'));
const forgotPasswordLimiter = createLimiter({ ...limitsFor('forgotPassword'), keyGenerator: ipEmailKey });
const resetPasswordLimiter = createLimiter({ ...limitsFor('resetPassword'), keyGenerator: ipEmailKey });
const verifyEmailLimiter = createLimiter(limitsFor('verifyEmail'));
const ssoLimiter = createLimiter(limitsFor('sso'));

module.exports = {
  RATE_LIMITS,
  createLimiter,
  ipEmailKey,
  authIpLimiter,
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  verifyEmailLimiter,
  ssoLimiter,
};
