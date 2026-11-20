// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const request = require('supertest');
const { faker } = require('@faker-js/faker');
const httpStatus = require('http-status');
const httpMocks = require('node-mocks-http');
const moment = require('moment');
const app = require('../../src/app');
const config = require('../../src/config/config');
const auth = require('../../src/middlewares/auth');
const { tokenService, emailService, logService } = require('../../src/services');
const ApiError = require('../../src/utils/ApiError');
const setupTestDB = require('../utils/setupTestDB');
const { User, Token } = require('../../src/models');
const { tokenTypes } = require('../../src/config/tokens');
const { userOne, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken } = require('../fixtures/token.fixture');

setupTestDB();

// Refresh tokens travel in an httpOnly cookie, never in the body.
const refreshCookie = (token) => `${config.jwt.cookie.name}=${token}`;

const originalStrictAuth = config.strictAuth;

afterEach(() => {
  config.strictAuth = originalStrictAuth;
  jest.restoreAllMocks();
});

describe('Auth routes', () => {
  // Site auth flags (SELF_REGISTRATION, ...) fall back to STRICT_AUTH when no site config is stored.
  // Strict (the default) disables self-registration.
  describe('POST /v2/auth/register', () => {
    let newUser;
    beforeEach(() => {
      config.strictAuth = false;
      jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue();
      newUser = {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
      };
    });

    test('should return 201 and successfully register user if request data is ok', async () => {
      const res = await request(app).post('/v2/auth/register').send(newUser).expect(httpStatus.CREATED);

      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('email_verified');
      expect(res.body.user).toMatchObject({
        id: expect.any(String),
        name: newUser.name,
        email: newUser.email,
        provider: 'Email',
      });

      const dbUser = await User.findById(res.body.user.id);
      expect(dbUser).not.toBeNull();
      expect(dbUser.password).not.toBe(newUser.password);
      expect(dbUser.name).toBe(newUser.name);
      expect(dbUser.email).toBe(newUser.email);
      expect(dbUser.email_verified).toBe(false);

      // The refresh token is delivered as a cookie only
      expect(res.body.tokens).toEqual({ access: { token: expect.any(String), expires: expect.any(String) } });
      expect(res.headers['set-cookie'].join(';')).toContain(`${config.jwt.cookie.name}=`);
      expect(await Token.countDocuments({ user: dbUser._id, type: tokenTypes.REFRESH })).toBe(1);

      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(newUser.email, newUser.name, expect.any(String));
    });

    test('should return 403 error if self-registration is disabled', async () => {
      config.strictAuth = true;

      await request(app).post('/v2/auth/register').send(newUser).expect(httpStatus.FORBIDDEN);

      expect(await User.countDocuments()).toBe(0);
    });

    test('should return 400 error if email is invalid', async () => {
      newUser.email = 'invalidEmail';

      await request(app).post('/v2/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if name is missing', async () => {
      delete newUser.name;

      await request(app).post('/v2/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if email is already used', async () => {
      await insertUsers([userOne]);
      newUser.email = userOne.email;

      await request(app).post('/v2/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password length is less than 8 characters', async () => {
      newUser.password = 'passwo1';

      await request(app).post('/v2/auth/register').send(newUser).expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v2/auth/login', () => {
    test('should return 200 and login user if email and password match', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app).post('/v2/auth/login').send(loginCredentials).expect(httpStatus.OK);

      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).toMatchObject({
        id: userOne._id.toHexString(),
        name: userOne.name,
        email: userOne.email,
      });

      expect(res.body.tokens).toEqual({ access: { token: expect.any(String), expires: expect.any(String) } });
      expect(res.headers['set-cookie'].join(';')).toContain(`${config.jwt.cookie.name}=`);
      expect(await Token.countDocuments({ user: userOne._id, type: tokenTypes.REFRESH, blacklisted: false })).toBe(1);
    });

    test('should return 401 error if there are no users with that email', async () => {
      const loginCredentials = {
        email: userOne.email,
        password: userOne.password,
      };

      const res = await request(app).post('/v2/auth/login').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({ code: httpStatus.UNAUTHORIZED, message: 'Incorrect email or password' });
    });

    test('should return 401 error if password is wrong', async () => {
      await insertUsers([userOne]);
      const loginCredentials = {
        email: userOne.email,
        password: 'wrongPassword1',
      };

      const res = await request(app).post('/v2/auth/login').send(loginCredentials).expect(httpStatus.UNAUTHORIZED);

      expect(res.body).toEqual({ code: httpStatus.UNAUTHORIZED, message: 'Incorrect email or password' });
    });

    test('should return 400 error if password is missing', async () => {
      await request(app).post('/v2/auth/login').send({ email: userOne.email }).expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('POST /v2/auth/logout', () => {
    test('should return 204 and delete the refresh token if the refresh cookie is valid', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      const res = await request(app)
        .post('/v2/auth/logout')
        .set('Cookie', refreshCookie(refreshToken))
        .expect(httpStatus.NO_CONTENT);

      expect(res.headers['set-cookie'].join(';')).toContain(`${config.jwt.cookie.name}=;`);
      const dbRefreshTokenDoc = await Token.findOne({ token: refreshToken });
      expect(dbRefreshTokenDoc).toBe(null);
    });

    test('should return 401 error if the refresh cookie is missing', async () => {
      await request(app).post('/v2/auth/logout').send().expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 404 error if refresh token is not found in the database', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);

      await request(app).post('/v2/auth/logout').set('Cookie', refreshCookie(refreshToken)).expect(httpStatus.NOT_FOUND);
    });

    test('should return 404 error if refresh token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH, true);

      await request(app).post('/v2/auth/logout').set('Cookie', refreshCookie(refreshToken)).expect(httpStatus.NOT_FOUND);
    });
  });

  describe('POST /v2/auth/refresh-tokens', () => {
    test('should return 200 and new access token if the refresh cookie is valid', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      const res = await request(app)
        .post('/v2/auth/refresh-tokens')
        .set('Cookie', refreshCookie(refreshToken))
        .expect(httpStatus.OK);

      expect(res.body).toEqual({ access: { token: expect.any(String), expires: expect.any(String) } });
      expect(res.headers['set-cookie'].join(';')).toContain(`${config.jwt.cookie.name}=`);

      // The refresh token is rotated: exactly one valid refresh token remains
      const refreshTokenDocs = await Token.find({ user: userOne._id, type: tokenTypes.REFRESH, blacklisted: false });
      expect(refreshTokenDocs).toHaveLength(1);
    });

    test('should return 401 error if the refresh cookie is missing', async () => {
      await request(app).post('/v2/auth/refresh-tokens').send().expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is signed using an invalid secret', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH, 'invalidSecret');
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      await request(app)
        .post('/v2/auth/refresh-tokens')
        .set('Cookie', refreshCookie(refreshToken))
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is not found in the database', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);

      await request(app)
        .post('/v2/auth/refresh-tokens')
        .set('Cookie', refreshCookie(refreshToken))
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH, true);

      await request(app)
        .post('/v2/auth/refresh-tokens')
        .set('Cookie', refreshCookie(refreshToken))
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if refresh token is expired', async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, 'minutes');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      await request(app)
        .post('/v2/auth/refresh-tokens')
        .set('Cookie', refreshCookie(refreshToken))
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 error if user is not found', async () => {
      const expires = moment().add(config.jwt.refreshExpirationDays, 'days');
      const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
      await tokenService.saveToken(refreshToken, userOne._id, expires, tokenTypes.REFRESH);

      await request(app)
        .post('/v2/auth/refresh-tokens')
        .set('Cookie', refreshCookie(refreshToken))
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /v2/auth/forgot-password', () => {
    beforeEach(() => {
      jest.spyOn(emailService, 'sendResetPasswordCodeEmail').mockResolvedValue();
      jest.spyOn(logService, 'createLog').mockResolvedValue();
    });

    test('should return 200 and email a reset code to the user', async () => {
      await insertUsers([userOne]);

      const res = await request(app).post('/v2/auth/forgot-password').send({ email: userOne.email }).expect(httpStatus.OK);

      expect(res.body).toEqual({ message: 'Reset code sent to your email' });
      expect(emailService.sendResetPasswordCodeEmail).toHaveBeenCalledWith(
        userOne.email,
        expect.stringMatching(/^\d{6}$/),
        userOne.name,
      );
      const code = emailService.sendResetPasswordCodeEmail.mock.calls[0][1];
      const dbResetPasswordTokenDoc = await Token.findOne({
        token: code,
        user: userOne._id,
        type: tokenTypes.RESET_PASSWORD,
      });
      expect(dbResetPasswordTokenDoc).not.toBeNull();
    });

    test('should return 400 if email is missing', async () => {
      await insertUsers([userOne]);

      await request(app).post('/v2/auth/forgot-password').send().expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 if email does not belong to any user', async () => {
      await request(app).post('/v2/auth/forgot-password').send({ email: userOne.email }).expect(httpStatus.NOT_FOUND);

      expect(emailService.sendResetPasswordCodeEmail).not.toHaveBeenCalled();
    });
  });

  describe('POST /v2/auth/reset-password', () => {
    beforeEach(() => {
      jest.spyOn(logService, 'createLog').mockResolvedValue();
    });

    describe('with email and code', () => {
      test('should return 204 and reset the password', async () => {
        await insertUsers([userOne]);
        const { code } = await tokenService.generateResetPasswordCode(userOne.email);

        await request(app)
          .post('/v2/auth/reset-password')
          .send({ email: userOne.email, code, password: 'password2' })
          .expect(httpStatus.NO_CONTENT);

        const dbUser = await User.findById(userOne._id);
        expect(await dbUser.isPasswordMatch('password2')).toBe(true);

        // The code is single-use
        expect(await Token.countDocuments({ user: userOne._id, type: tokenTypes.RESET_PASSWORD })).toBe(0);
      });

      test('should return 400 if the code is wrong', async () => {
        await insertUsers([userOne]);
        await tokenService.generateResetPasswordCode(userOne.email);

        await request(app)
          .post('/v2/auth/reset-password')
          .send({ email: userOne.email, code: 'not-the-code', password: 'password2' })
          .expect(httpStatus.BAD_REQUEST);

        const dbUser = await User.findById(userOne._id);
        expect(await dbUser.isPasswordMatch('password1')).toBe(true);
      });

      test('should return 400 if the code is expired', async () => {
        await insertUsers([userOne]);
        const expires = moment().subtract(1, 'minutes');
        await tokenService.saveToken('123456', userOne._id, expires, tokenTypes.RESET_PASSWORD);

        await request(app)
          .post('/v2/auth/reset-password')
          .send({ email: userOne.email, code: '123456', password: 'password2' })
          .expect(httpStatus.BAD_REQUEST);
      });

      test('should return 400 if the email does not belong to any user', async () => {
        await request(app)
          .post('/v2/auth/reset-password')
          .send({ email: userOne.email, code: '123456', password: 'password2' })
          .expect(httpStatus.BAD_REQUEST);
      });
    });

    describe('with legacy reset token', () => {
      test('should return 204 and reset the password', async () => {
        await insertUsers([userOne]);
        const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
        const resetPasswordToken = tokenService.generateToken(userOne._id, expires, tokenTypes.RESET_PASSWORD);
        await tokenService.saveToken(resetPasswordToken, userOne._id, expires, tokenTypes.RESET_PASSWORD);

        await request(app)
          .post('/v2/auth/reset-password')
          .send({ token: resetPasswordToken, password: 'password2' })
          .expect(httpStatus.NO_CONTENT);

        const dbUser = await User.findById(userOne._id);
        expect(await dbUser.isPasswordMatch('password2')).toBe(true);
        expect(await Token.countDocuments({ user: userOne._id, type: tokenTypes.RESET_PASSWORD })).toBe(0);
      });
    });

    test('should return 400 if neither email and code nor a reset token is given', async () => {
      await insertUsers([userOne]);

      await request(app).post('/v2/auth/reset-password').send({ password: 'password2' }).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if password is missing or too short', async () => {
      await insertUsers([userOne]);
      const { code } = await tokenService.generateResetPasswordCode(userOne.email);

      await request(app).post('/v2/auth/reset-password').send({ email: userOne.email, code }).expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post('/v2/auth/reset-password')
        .send({ email: userOne.email, code, password: 'short1' })
        .expect(httpStatus.BAD_REQUEST);

      const dbUser = await User.findById(userOne._id);
      expect(await dbUser.isPasswordMatch('password1')).toBe(true);
    });
  });

  describe('POST /v2/auth/send-verification-email', () => {
    beforeEach(() => {
      jest.spyOn(emailService, 'sendVerificationEmail').mockResolvedValue();
    });

    test('should return 204 and send verification email to the user', async () => {
      await insertUsers([userOne]);

      await request(app)
        .post('/v2/auth/send-verification-email')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(userOne.email, expect.any(String));
      const verifyEmailToken = emailService.sendVerificationEmail.mock.calls[0][1];
      const dbVerifyEmailToken = await Token.findOne({
        token: verifyEmailToken,
        user: userOne._id,
        type: tokenTypes.VERIFY_EMAIL,
      });

      expect(dbVerifyEmailToken).not.toBeNull();
    });

    test('should return 401 error if access token is missing', async () => {
      await insertUsers([userOne]);

      await request(app).post('/v2/auth/send-verification-email').send().expect(httpStatus.UNAUTHORIZED);

      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('POST /v2/auth/verify-email', () => {
    test('should return 204 and verify the email', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
      const verifyEmailToken = tokenService.generateToken(userOne._id, expires, tokenTypes.VERIFY_EMAIL);
      await tokenService.saveToken(verifyEmailToken, userOne._id, expires, tokenTypes.VERIFY_EMAIL);

      await request(app).post('/v2/auth/verify-email').send({ token: verifyEmailToken }).expect(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);

      expect(dbUser.email_verified).toBe(true);

      const dbVerifyEmailToken = await Token.countDocuments({
        user: userOne._id,
        type: tokenTypes.VERIFY_EMAIL,
      });
      expect(dbVerifyEmailToken).toBe(0);
    });

    test('should return 400 if verify email token is missing', async () => {
      await insertUsers([userOne]);

      await request(app).post('/v2/auth/verify-email').send().expect(httpStatus.BAD_REQUEST);
    });

    test('should return 401 if verify email token is blacklisted', async () => {
      await insertUsers([userOne]);
      const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
      const verifyEmailToken = tokenService.generateToken(userOne._id, expires, tokenTypes.VERIFY_EMAIL);
      await tokenService.saveToken(verifyEmailToken, userOne._id, expires, tokenTypes.VERIFY_EMAIL, true);

      await request(app).post('/v2/auth/verify-email').send({ token: verifyEmailToken }).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if verify email token is expired', async () => {
      await insertUsers([userOne]);
      const expires = moment().subtract(1, 'minutes');
      const verifyEmailToken = tokenService.generateToken(userOne._id, expires, tokenTypes.VERIFY_EMAIL);
      await tokenService.saveToken(verifyEmailToken, userOne._id, expires, tokenTypes.VERIFY_EMAIL);

      await request(app).post('/v2/auth/verify-email').send({ token: verifyEmailToken }).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 if user is not found', async () => {
      const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
      const verifyEmailToken = tokenService.generateToken(userOne._id, expires, tokenTypes.VERIFY_EMAIL);
      await tokenService.saveToken(verifyEmailToken, userOne._id, expires, tokenTypes.VERIFY_EMAIL);

      await request(app).post('/v2/auth/verify-email').send({ token: verifyEmailToken }).expect(httpStatus.UNAUTHORIZED);
    });
  });
});

// auth() only authenticates (JWT access token -> req.user). Permission checks live in
// middlewares/permission (checkPermission) and are covered by the route specs, e.g. permission.test.js.
describe('Auth middleware', () => {
  test('should call next with no errors if access token is valid', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user._id).toEqual(userOne._id);
  });

  test('should call next with unauthorized error if access token is not found in header', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest();
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' }),
    );
  });

  test('should call next with unauthorized error if access token is not a valid jwt token', async () => {
    await insertUsers([userOne]);
    const req = httpMocks.createRequest({ headers: { Authorization: 'Bearer randomToken' } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' }),
    );
  });

  test('should call next with unauthorized error if the token is not an access token', async () => {
    await insertUsers([userOne]);
    const expires = moment().add(config.jwt.accessExpirationValue, 'minutes');
    const refreshToken = tokenService.generateToken(userOne._id, expires, tokenTypes.REFRESH);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${refreshToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' }),
    );
  });

  test('should call next with unauthorized error if access token is generated with an invalid secret', async () => {
    await insertUsers([userOne]);
    const expires = moment().add(config.jwt.accessExpirationValue, 'minutes');
    const accessToken = tokenService.generateToken(userOne._id, expires, tokenTypes.ACCESS, 'invalidSecret');
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' }),
    );
  });

  test('should call next with unauthorized error if access token is expired', async () => {
    await insertUsers([userOne]);
    const expires = moment().subtract(1, 'minutes');
    const accessToken = tokenService.generateToken(userOne._id, expires, tokenTypes.ACCESS);
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${accessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' }),
    );
  });

  test('should call next with unauthorized error if user is not found', async () => {
    const req = httpMocks.createRequest({ headers: { Authorization: `Bearer ${userOneAccessToken}` } });
    const next = jest.fn();

    await auth()(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: httpStatus.UNAUTHORIZED, message: 'Please authenticate' }),
    );
  });

  test('should call next with no errors and no user if auth is optional and the access token is missing', async () => {
    const req = httpMocks.createRequest();
    const next = jest.fn();

    await auth({ optional: true })(req, httpMocks.createResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeUndefined();
  });
});
