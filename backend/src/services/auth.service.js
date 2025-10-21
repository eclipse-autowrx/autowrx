// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const axios = require('axios');
const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const Token = require('../models/token.model');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');
const logger = require('../config/logger');
const config = require('../config/config');
const listenerService = require('./listener.service');

const githubCallback = async (code, userId) => {
  try {
    const { data } = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
    const { access_token: accessToken, expires_in: expiresIn } = data;
    const socket = listenerService.findSocketByUser(userId);
    if (socket) {
      socket.emit('auth/github', { accessToken, expiresIn });
    }
  } catch (error) {
    const socket = listenerService.findSocketByUser(userId);
    if (socket) {
      socket.emit('auth/github/error', {
        message: error.response?.data?.message || 'Failed to authenticate with GitHub',
      });
    }
    logger.error(error);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
};

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  if (user.provider_user_id && !user.password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please login with SSO');
  }
  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await refreshTokenDoc.deleteOne();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.deleteOne();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  const resetPasswordTokenDoc = await tokenService.verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
  const user = await userService.getUserById(resetPasswordTokenDoc.user, true);
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password reset failed');
  }
  await userService.updateUserById(user._id, { password: newPassword });
  await Token.deleteMany({ user: user._id, type: tokenTypes.RESET_PASSWORD });
  return user;
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await userService.getUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user._id, type: tokenTypes.VERIFY_EMAIL });
    await userService.updateUserById(user._id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

/**
 *
 * @param {string} accessToken
 * @returns {Promise<import('../typedefs/msGraph').MSGraph>}
 */
const callMsGraph = async (accessToken) => {
  logger.debug(`Fetching user data from: ${config.sso.msGraphMeEndpoint}`);

  // Fetch user data
  const userData = await fetch(config.sso.msGraphMeEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => response.json())
    .catch((error) => {
      logger.error(`Error fetching user data: ${JSON.stringify(error)}`);
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Failed to fetch user data');
    });

  // Fetch user profile photo
  let userPhotoUrl = null;
  await fetch(`${config.sso.msGraphMeEndpoint}/photo/$value`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      if (!response.ok) throw new Error('Photo not found');
      return response.blob();
    })
    .then((blob) => {
      userPhotoUrl = URL.createObjectURL(blob);
    })
    .catch((error) => {
      console.error('Error fetching user photo:', error);
    });

  return { ...userData, userPhotoUrl };
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  githubCallback,
  callMsGraph,
};
