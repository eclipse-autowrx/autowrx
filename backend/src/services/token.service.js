// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const config = require('../config/config');
const userService = require('./user.service');
const { Token } = require('../models');
const ApiError = require('../utils/ApiError');
const { tokenTypes } = require('../config/tokens');

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await Token.findOne({ token, type, user: new mongoose.Types.ObjectId(payload.sub), blacklisted: false });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationValue, config.jwt.accessExpirationUnit);
  const accessToken = generateToken(user._id, accessTokenExpires, tokenTypes.ACCESS);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user._id, refreshTokenExpires, tokenTypes.REFRESH);
  await saveToken(refreshToken, user._id, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }
  const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(user._id, expires, tokenTypes.RESET_PASSWORD);
  await saveToken(resetPasswordToken, user._id, expires, tokenTypes.RESET_PASSWORD);
  return resetPasswordToken;
};

/**
 * Generate a 6-digit reset password code (sent via email instead of a link).
 * Code expires in 60 minutes. Any previous codes for this user are deleted first.
 * @param {string} email
 * @returns {Promise<{code: string, user: Object}>}
 */
const generateResetPasswordCode = async (email) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
  }

  // Delete any existing reset password tokens for this user
  await Token.deleteMany({ user: user._id, type: tokenTypes.RESET_PASSWORD });

  // Generate a cryptographically random 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  const expires = moment().add(60, 'minutes');

  await Token.create({
    token: code,
    user: user._id,
    expires: expires.toDate(),
    type: tokenTypes.RESET_PASSWORD,
    blacklisted: false,
  });

  return { code, user };
};

/**
 * Verify a 6-digit reset password code for a given email.
 * @param {string} email
 * @param {string} code - The 6-digit code
 * @returns {Promise<Token>} The token document
 */
const verifyResetPasswordCode = async (email, code) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid code');
  }

  const tokenDoc = await Token.findOne({
    token: code,
    type: tokenTypes.RESET_PASSWORD,
    user: user._id,
    blacklisted: false,
  });

  if (!tokenDoc) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired code');
  }

  // Check expiration
  if (moment().isAfter(moment(tokenDoc.expires))) {
    await tokenDoc.deleteOne();
    throw new ApiError(httpStatus.BAD_REQUEST, 'Code has expired. Please request a new one.');
  }

  return tokenDoc;
};

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user) => {
  const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
  const verifyEmailToken = generateToken(user._id, expires, tokenTypes.VERIFY_EMAIL);
  await saveToken(verifyEmailToken, user._id, expires, tokenTypes.VERIFY_EMAIL);
  return verifyEmailToken;
};

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateResetPasswordCode,
  verifyResetPasswordCode,
  generateVerifyEmailToken,
};
