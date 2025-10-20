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
    try {
      let user;
      // If auth service url is provided, use it to authenticate the user
      if (config.services.auth.url) {
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
      } else {
        // If auth service url is not provided, use passport to authenticate the user
        user = await new Promise((resolve, reject) => {
          passport.authenticate('jwt', { session: false }, (err, user, info) => {
            if (err || info || !user) {
              return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
            }
            resolve(user);
          })(req, res, next);
        });
      }

      if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');

      req.user = user;
      next();
    } catch (error) {
      // If the middleware is optional, call the next middleware
      if (optional) next();
      else {
        logger.error(`Failed to authenticate user: %o`, error?.message || error);
        if (isAxiosError(error)) {
          next(new ApiError(error.response?.status || 401, error.response?.data?.message || 'Please authenticate'));
        } else {
          next(error);
        }
      }
    }
  };

module.exports = auth;
