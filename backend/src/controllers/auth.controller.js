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

  // Send welcome email (non-blocking, don't fail registration if email fails)
  const domain = req.headers.origin || req.headers.referer || config.client.baseUrl;
  emailService.sendWelcomeEmail(user.email, user.name, domain).catch(() => {});

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
  const { code, user } = await tokenService.generateResetPasswordCode(req.body.email);

  await emailService.sendResetPasswordCodeEmail(req.body.email, code, user.name);
  res.status(httpStatus.OK).send({ message: 'Reset code sent to your email' });

  try {
    await logService.createLog(
      {
        name: 'Forgot password',
        type: 'forgot_password',
        created_by: req.body.email,
        description: `User with email ${req.body.email} has triggered forgot password flow (code-based)`,
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
  const { email, code, password } = req.body;
  let user;

  if (email && code) {
    // Code-based reset (new flow)
    user = await authService.resetPasswordWithCode(email, code, password);
  } else if (req.query.token) {
    // Legacy token-based reset (backward compatibility)
    user = await authService.resetPassword(req.query.token, password);
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email and code are required');
  }

  res.status(httpStatus.NO_CONTENT).send();

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
  const { providerId, idToken } = req.body;
  const ssoService = require('../services/sso.service');

  // Validate that provider exists and is enabled
  try {
    await ssoService.getSSOProviderById(providerId, false);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message || 'Invalid or disabled SSO provider');
  }

  // Validate ID token is provided
  if (!idToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'ID token is required');
  }

  // Parse ID token to extract user data (no additional scopes needed)
  let graphData;
  try {
    graphData = await authService.parseIdToken(idToken, providerId);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, `Invalid ID token: ${error.message}`);
  }
  let user = await userService.getUserByEmail(graphData.mail);
  if (!user) {
    // Check if SSO auto-registration is enabled
    if (!req.authConfig.SSO_AUTO_REGISTRATION) {
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

const ssoService = require('../services/sso.service');

const githubSsoStart = catchAsync(async (req, res) => {
  const { providerId, origin } = req.query;
  if (!providerId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'providerId is required');
  }
  const provider = await ssoService.getSSOProviderById(providerId, true);
  if (provider.type !== 'GITHUB') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Provider is not a GitHub SSO provider');
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const pathWithoutQuery = (req.originalUrl || '').split('?')[0];
  const callbackPath = pathWithoutQuery.replace(/\/github-sso\/start\/?$/, '') + '/github-sso/callback';
  const redirectUri = baseUrl + callbackPath;
  const returnOrigin = origin || config.client.baseUrl;
  const state = encodeURIComponent(JSON.stringify({ providerId, origin: returnOrigin }));
  const scope = (Array.isArray(provider.scopes) && provider.scopes.length)
    ? provider.scopes.join(' ')
    : (typeof provider.scopes === 'string' && provider.scopes.trim())
      ? provider.scopes.trim()
      : 'user:email';
  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: redirectUri,
    scope,
    state,
  });
  const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
  res.redirect(url);
});

const githubSsoCallback = catchAsync(async (req, res) => {
  const { code, state } = req.query;
  let origin = config.client.baseUrl;
  let providerId = null;
  if (state) {
    try {
      const decoded = JSON.parse(decodeURIComponent(state));
      providerId = decoded.providerId;
      if (decoded.origin) origin = decoded.origin;
    } catch (e) {
      providerId = decodeURIComponent(state);
    }
  }
  if (!code || !providerId) {
    return res.redirect(`${origin}?error=missing_code_or_state`);
  }
  let provider;
  try {
    provider = await ssoService.getSSOProviderById(providerId, true);
  } catch (e) {
    return res.redirect(`${origin}?error=invalid_provider`);
  }
  if (provider.type !== 'GITHUB') {
    return res.redirect(`${origin}?error=invalid_provider`);
  }
  let graphData;
  try {
    graphData = await authService.exchangeGithubSSOCode(code, provider);
  } catch (error) {
    logger.error(error);
    const message = encodeURIComponent(error.message || 'GitHub authentication failed');
    return res.redirect(`${origin}?error=${message}`);
  }
  let user = await userService.getUserByEmail(graphData.mail);
  if (!user) {
    if (!req.authConfig.SSO_AUTO_REGISTRATION) {
      return res.redirect(`${origin}?error=${encodeURIComponent('User not registered. Contact admin to register your account.')}`);
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
  res.redirect(origin);
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
  githubSsoStart,
  githubSsoCallback,
};
