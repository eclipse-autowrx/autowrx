// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService, logService, permissionService } = require('../services');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const pick = require('../utils/pick');

const authenticate = catchAsync(async (req, res) => {
  res.status(httpStatus.OK).json({
    user: req.user,
  });
});

// This controller is INTERNAL ONLY. DO NOT EXPOSE THIS ENDPOINT TO THE PUBLIC.
const authorize = catchAsync(async (req, res) => {
  const bodyData = pick(req.body, ['permissions', 'permissionQuery', 'userId']);

  // Legacy permission check. This is permission check version 1 using self-implemented authorization
  if (bodyData.permissions) {
    const permissionQueries = bodyData.permissions.split(',').map((permission) => permission.split(':'));
    const results = await Promise.all(
      permissionQueries.map((query) => permissionService.hasPermission(req.user.id ?? bodyData.userId, query[0], query[1]))
    );

    if (!results.every(Boolean)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }

  // New permission check. This is permission check version 2 using casbin library. Only support 1 query for now.
  if (bodyData.permissionQuery) {
    const [sub, act, obj] = bodyData.permissionQuery.split('#');
    const allowed = await permissionService.hasPermissionV2({ sub, act, obj });
    if (!allowed) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }
  }

  res.status(httpStatus.OK).json({
    message: 'Authorized',
  });
});

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser({
    ...req.body,
    provider: req.body?.provider || 'Email',
  });
  const tokens = await tokenService.generateAuthTokens(user);
  res.cookie(config.jwt.cookie.name, tokens.refresh.token, {
    expires: tokens.refresh.expires,
    ...config.jwt.cookie.options,
  });

  delete tokens.refresh;
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.cookie(config.jwt.cookie.name, tokens.refresh.token, {
    expires: tokens.refresh.expires,
    ...config.jwt.cookie.options,
  });
  delete tokens.refresh;
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.cookies[config.jwt.cookie.name]);
  res.clearCookie(config.jwt.cookie.name);
  res.clearCookie(config.jwt.cookie.name, {
    ...config.jwt.cookie.options,
  });
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.cookies[config.jwt.cookie.name]);
  res.cookie(config.jwt.cookie.name, tokens.refresh.token, {
    expires: tokens.refresh.expires,
    ...config.jwt.cookie.options,
  });
  delete tokens.refresh;

  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const returnRawToken = req.query.return_raw_token;

  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);

  let domain = undefined;
  try {
    const hostname = new URL(req.get('referer')).hostname;
    if (hostname === 'auth.digital.auto') {
      domain = hostname;
    }
  } catch (error) {}

  if (returnRawToken) {
    res.status(httpStatus.OK).send({ resetPasswordToken });
  } else {
    await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken, domain);
    res.status(httpStatus.NO_CONTENT).send();
  }

  try {
    await logService.createLog(
      {
        name: 'Forgot password',
        type: 'forgot_password',
        created_by: req.body.email,
        description: `User with email ${req.body.email} has triggered forgot password flow`,
      },
      {
        headers: {
          origin: req.get('origin'),
          referer: req.get('referer'),
        },
      }
    );
  } catch (error) {
    logger.warn(`Failed to create log - forgot password log: ${error}`);
  }
});

const resetPassword = catchAsync(async (req, res) => {
  let user;
  try {
    user = await authService.resetPassword(req.query.token, req.body.password);
  } catch (error) {
    logger.info(`Failed to reset password: ${error}`);
  } finally {
    res.status(httpStatus.NO_CONTENT).send();
  }

  try {
    await logService.createLog(
      {
        name: 'Password reset',
        type: 'password_reset',
        created_by: user.email || user.id || user._id,
        description: `User with email ${user.email}, id ${user.id || user._id} has reset their password`,
        ref_type: 'user',
        ref_id: user.id || user._id,
      },
      {
        headers: {
          origin: req.get('origin'),
          referer: req.get('referer'),
        },
      }
    );
  } catch (error) {
    logger.warn(`Failed to create log: ${error}`);
  }
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

const githubCallback = catchAsync(async (req, res) => {
  try {
    const { origin, code, userId } = req.query;
    await authService.githubCallback(code, userId);
    res.redirect(`${origin || 'http://127.0.0.1:3000'}/auth/github/success`);
  } catch (error) {
    logger.error(error);
    res.status(httpStatus.UNAUTHORIZED).send('Unauthorized. Please try again.');
  }
});

const sso = catchAsync(async (req, res) => {
  const { msAccessToken } = req.body;

  const graphData = await authService.callMsGraph(msAccessToken);
  if (graphData.error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid MS access token');
  }

  let user = await userService.getUserByEmail(graphData.mail);
  if (!user) {
    if (config.strictAuth) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not registered. Contact admin to register your account.');
    }
    user = await userService.createSSOUser(graphData);
  } else {
    user = await userService.updateSSOUser(user, graphData);
  }

  const tokens = await tokenService.generateAuthTokens(user);
  res.cookie(config.jwt.cookie.name, tokens.refresh.token, {
    expires: tokens.refresh.expires,
    ...config.jwt.cookie.options,
  });
  delete tokens.refresh;

  res.send({ user, tokens });
});

module.exports = {
  authenticate,
  authorize,
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  githubCallback,
  sso,
};
