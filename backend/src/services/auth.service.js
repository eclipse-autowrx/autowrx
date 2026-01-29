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
 * Call Microsoft Graph API to fetch user data
 * @deprecated This method requires User.Read scope. Use parseIdToken() instead which only needs OpenID scopes.
 * @param {string} accessToken - Microsoft access token
 * @param {string} providerId - SSO provider ID (optional for backward compatibility)
 * @returns {Promise<import('../typedefs/msGraph').MSGraph>}
 */
const callMsGraph = async (accessToken, providerId = null) => {
  // If providerId provided, fetch provider config for validation
  // For now, we'll use the default endpoint but this allows for future tenant-specific validation
  const msGraphMeEndpoint = config.sso.msGraphMeEndpoint;


  // Fetch user data
  const userData = await fetch(msGraphMeEndpoint, {
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
  await fetch(`${msGraphMeEndpoint}/photo/$value`, {
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

  return { ...userData, userPhotoUrl, providerId };
};

/**
 * Parse ID token to extract user data (alternative to calling Graph API)
 * @param {string} idToken - MSAL ID token (JWT)
 * @param {string} providerId - SSO provider ID
 * @returns {Promise<import('../typedefs/msGraph').MSGraph>}
 */
const parseIdToken = async (idToken, providerId = null) => {
  try {
    if (!idToken || typeof idToken !== 'string') {
      throw new Error('ID token is missing or invalid format');
    }

    // Decode JWT (ID tokens are not encrypted, just signed)
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('ID token is not a valid JWT (expected 3 parts)');
    }

    const base64Payload = parts[1];
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());

    // Extract user data from ID token claims
    // Map common OIDC claims to our MSGraph format
    const userData = {
      id: payload.oid || payload.sub, // oid = Azure AD object ID, sub = subject
      displayName: payload.name,
      mail: payload.email || payload.preferred_username, // email or UPN
      userPhotoUrl: null, // ID token doesn't contain photo
      providerId,
    };


    // Validate required fields
    if (!userData.mail) {
      logger.error(`Email not found in ID token. Available claims: ${JSON.stringify(payload)}`);
      throw new Error('Email not found in ID token');
    }

    if (!userData.displayName) {
      // Fallback to email if name not provided
      userData.displayName = userData.mail.split('@')[0];
    }

    return userData;
  } catch (error) {
    logger.error(`Error parsing ID token: ${error.message}`);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.UNAUTHORIZED, `Invalid ID token: ${error.message}`);
  }
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
  githubCallback,
  callMsGraph,
  parseIdToken,
};
