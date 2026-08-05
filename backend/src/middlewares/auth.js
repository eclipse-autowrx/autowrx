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
const { default: axios, isAxiosError } = require('axios');
const passport = require('passport');
const logger = require('../config/logger');
const platformAuthService = require('../services/platformAuth.service');

let authUrlDeprecationWarned = false;

const getAuthMode = () => {
  if (config.auth.provider === 'platform') return 'platform';
  if (config.services.auth.url) return 'auth_url';
  return 'jwt';
};

/**
 *
 * @param {Object} user
 */
const sanitizeUser = (user) => {
  if (!user || typeof user !== 'object') return user;
  delete user.password;
  delete user.__v;
  user.id = user.id ?? user._id;
  delete user._id;
  delete user.createdAt;
  delete user.updatedAt;
  return user;
};

// Authentication middleware
const auth =
  ({ optional = false } = {}) =>
  async (req, res, next) => {
    const authMode = getAuthMode();
    try {
      let user;
      logger.debug('Auth attempt: mode=%s method=%s path=%s', authMode, req.method, req.originalUrl);

      if (config.auth.provider === 'platform') {
        user = await platformAuthService.resolveUser(req);
        user = sanitizeUser(user?.toJSON ? user.toJSON() : user);
      } else if (config.services.auth.url) {
        if (!authUrlDeprecationWarned) {
          logger.warn('AUTH_URL is deprecated; use AUTH_PROVIDER=platform with AUTH_PLATFORM_HEADERS instead');
          authUrlDeprecationWarned = true;
        }
        logger.debug('Auth delegating to AUTH_URL: url=%s path=%s', config.services.auth.url, req.originalUrl);
        const forwardHeaders = { ...req.headers };
        delete forwardHeaders['content-length'];
        delete forwardHeaders['keep-alive'];
        delete forwardHeaders['proxy-connection'];
        delete forwardHeaders['transfer-encoding'];
        delete forwardHeaders['upgrade'];
        delete forwardHeaders['trailer'];
        const response = await axios.post(config.services.auth.url, req.body, {
          headers: forwardHeaders,
        });
        user = response?.data?.user;
        user = sanitizeUser(user);
        logger.debug(
          'Auth via AUTH_URL succeeded: path=%s userId=%s',
          req.originalUrl,
          user?.id || user?._id || '(none)'
        );
      } else {
        // If auth service url is not provided, use passport to authenticate the user
        user = await new Promise((resolve, reject) => {
          passport.authenticate('jwt', { session: false }, (err, user, info) => {
            if (err || info || !user) {
              const hasBearer = Boolean(req.headers.authorization?.startsWith('Bearer '));
              logger.debug(
                'JWT auth failed: method=%s path=%s hasBearer=%s err=%s info=%s',
                req.method,
                req.originalUrl,
                hasBearer,
                err?.message || err || '(none)',
                info?.message || info?.name || info || '(none)'
              );
              return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
            }
            logger.debug(
              'JWT auth succeeded: userId=%s method=%s path=%s',
              user.id || user._id,
              req.method,
              req.originalUrl
            );
            resolve(user);
          })(req, res, next);
        });
      }

      if (!user) {
        logger.debug('Auth failed: mode=%s path=%s reason=no user returned', authMode, req.originalUrl);
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
      }

      req.user = user;
      next();
    } catch (error) {
      // Resolve optional parameter - can be boolean or function that receives req
      const isOptional = typeof optional === 'function' ? optional(req) : optional;

      logger.debug(
        'Auth failed: mode=%s method=%s path=%s optional=%s reason=%s',
        authMode,
        req.method,
        req.originalUrl,
        isOptional,
        error?.message || error
      );

      // If the middleware is optional, call the next middleware
      if (isOptional) next();
      else {
        logger.error(`Failed to authenticate user: %o`, error?.message || error);
        if (isAxiosError(error)) {
          logger.debug(
            'Auth via AUTH_URL failed: path=%s status=%s response=%o',
            req.originalUrl,
            error.response?.status,
            error.response?.data
          );
          next(new ApiError(error.response?.status || 401, error.response?.data?.message || 'Please authenticate'));
        } else {
          next(error);
        }
      }
    }
  };

module.exports = auth;
