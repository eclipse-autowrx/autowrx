// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #641: unit coverage for token.service (JWT issuing/verification and reset codes).

jest.mock('../../../src/models', () => ({
  Token: { create: jest.fn(), findOne: jest.fn(), deleteMany: jest.fn() },
}));
jest.mock('../../../src/services/user.service', () => ({ getUserByEmail: jest.fn() }));

const jwt = require('jsonwebtoken');
const moment = require('moment');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const config = require('../../../src/config/config');
const { Token } = require('../../../src/models');
const userService = require('../../../src/services/user.service');
const { tokenTypes } = require('../../../src/config/tokens');
const tokenService = require('../../../src/services/token.service');

const userId = new mongoose.Types.ObjectId().toString();
const user = { _id: userId };

describe('token.service', () => {
  const originalJwt = { ...config.jwt };

  beforeAll(() => {
    Object.assign(config.jwt, {
      keys: { k1: 'secret-one' },
      activeKid: 'k1',
      acceptLegacySecret: false,
      accessExpirationValue: 30,
      accessExpirationUnit: 'minutes',
      refreshExpirationDays: 30,
      resetPasswordExpirationMinutes: 10,
      verifyEmailExpirationMinutes: 10,
    });
  });
  afterAll(() => Object.assign(config.jwt, originalJwt));

  beforeEach(() => {
    jest.resetAllMocks();
    Token.create.mockImplementation(async (doc) => doc);
  });

  describe('generateToken', () => {
    test('signs with the active key and sets its kid', () => {
      const expires = moment().add(5, 'minutes');
      const token = tokenService.generateToken(userId, expires, tokenTypes.ACCESS);
      const { header, payload } = jwt.decode(token, { complete: true });

      expect(header).toMatchObject({ alg: 'HS256', kid: 'k1' });
      expect(payload).toMatchObject({ sub: userId, type: tokenTypes.ACCESS, exp: expires.unix() });
      expect(payload.tid).toBeUndefined();
      expect(() => jwt.verify(token, 'secret-one')).not.toThrow();
    });

    test('explicit secret has no kid; tid only when provided', () => {
      const token = tokenService.generateToken(userId, moment().add(5, 'minutes'), tokenTypes.ACCESS, 'other', {
        tid: 't1',
      });
      const { header, payload } = jwt.decode(token, { complete: true });

      expect(header.kid).toBeUndefined();
      expect(payload.tid).toBe('t1');
      expect(() => jwt.verify(token, 'other')).not.toThrow();
    });
  });

  describe('verifyToken', () => {
    test('returns the stored, non-blacklisted token doc', async () => {
      const token = tokenService.generateToken(userId, moment().add(5, 'minutes'), tokenTypes.REFRESH);
      const doc = { token };
      Token.findOne.mockResolvedValue(doc);

      await expect(tokenService.verifyToken(token, tokenTypes.REFRESH)).resolves.toBe(doc);
      const query = Token.findOne.mock.calls[0][0];
      expect(query).toMatchObject({ token, type: tokenTypes.REFRESH, blacklisted: false });
      expect(query.user.toString()).toBe(userId);
    });

    test('throws when the token is not stored', async () => {
      const token = tokenService.generateToken(userId, moment().add(5, 'minutes'), tokenTypes.REFRESH);
      Token.findOne.mockResolvedValue(null);
      await expect(tokenService.verifyToken(token, tokenTypes.REFRESH)).rejects.toThrow('Token not found');
    });

    test.each([
      ['an unknown secret', () => tokenService.generateToken(userId, moment().add(5, 'minutes'), 'refresh', 'nope')],
      ['an expired token', () => tokenService.generateToken(userId, moment().subtract(1, 'minute'), 'refresh')],
    ])('rejects %s without hitting the database', async (_label, make) => {
      await expect(tokenService.verifyToken(make(), tokenTypes.REFRESH)).rejects.toThrow();
      expect(Token.findOne).not.toHaveBeenCalled();
    });
  });

  describe('generateAuthTokens', () => {
    test('returns access + refresh tokens and stores only the refresh token', async () => {
      const result = await tokenService.generateAuthTokens(user);

      expect(jwt.decode(result.access.token)).toMatchObject({ sub: userId, type: tokenTypes.ACCESS });
      expect(jwt.decode(result.refresh.token)).toMatchObject({ sub: userId, type: tokenTypes.REFRESH });
      expect(moment(result.access.expires).diff(moment(), 'minutes')).toBeGreaterThanOrEqual(29);
      expect(moment(result.refresh.expires).diff(moment(), 'days')).toBeGreaterThanOrEqual(29);

      expect(Token.create).toHaveBeenCalledTimes(1);
      expect(Token.create).toHaveBeenCalledWith(
        expect.objectContaining({ token: result.refresh.token, user: userId, type: tokenTypes.REFRESH, blacklisted: false }),
      );
    });

    test('adds the tid claim for a tenant', async () => {
      const result = await tokenService.generateAuthTokens(user, { tenantId: 'tenant-1' });
      expect(jwt.decode(result.access.token).tid).toBe('tenant-1');
      expect(jwt.decode(result.refresh.token).tid).toBe('tenant-1');
    });
  });

  describe('generateResetPasswordToken', () => {
    test('unknown email → 404', async () => {
      userService.getUserByEmail.mockResolvedValue(null);
      await expect(tokenService.generateResetPasswordToken('x@y.z')).rejects.toMatchObject({
        statusCode: httpStatus.NOT_FOUND,
      });
      expect(Token.create).not.toHaveBeenCalled();
    });

    test('stores a reset-password token', async () => {
      userService.getUserByEmail.mockResolvedValue(user);
      const token = await tokenService.generateResetPasswordToken('a@b.c');
      expect(jwt.decode(token)).toMatchObject({ sub: userId, type: tokenTypes.RESET_PASSWORD });
      expect(Token.create).toHaveBeenCalledWith(expect.objectContaining({ token, type: tokenTypes.RESET_PASSWORD }));
    });
  });

  describe('generateResetPasswordCode', () => {
    test('unknown email → 404', async () => {
      userService.getUserByEmail.mockResolvedValue(null);
      await expect(tokenService.generateResetPasswordCode('x@y.z')).rejects.toMatchObject({
        statusCode: httpStatus.NOT_FOUND,
      });
    });

    test('replaces earlier codes with a 6-digit code valid for 60 minutes', async () => {
      userService.getUserByEmail.mockResolvedValue(user);
      const { code, user: returned } = await tokenService.generateResetPasswordCode('a@b.c');

      expect(returned).toBe(user);
      expect(code).toMatch(/^\d{6}$/);
      expect(Token.deleteMany).toHaveBeenCalledWith({ user: userId, type: tokenTypes.RESET_PASSWORD });
      expect(Token.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(Token.create.mock.invocationCallOrder[0]);

      const saved = Token.create.mock.calls[0][0];
      expect(saved).toMatchObject({ token: code, user: userId, type: tokenTypes.RESET_PASSWORD, blacklisted: false });
      expect(moment(saved.expires).diff(moment(), 'minutes')).toBeGreaterThanOrEqual(59);
    });
  });

  describe('verifyResetPasswordCode', () => {
    test('unknown email → 400', async () => {
      userService.getUserByEmail.mockResolvedValue(null);
      await expect(tokenService.verifyResetPasswordCode('x@y.z', '123456')).rejects.toMatchObject({
        statusCode: httpStatus.BAD_REQUEST,
        message: 'Invalid code',
      });
    });

    test('wrong code → 400', async () => {
      userService.getUserByEmail.mockResolvedValue(user);
      Token.findOne.mockResolvedValue(null);
      await expect(tokenService.verifyResetPasswordCode('a@b.c', '000000')).rejects.toMatchObject({
        statusCode: httpStatus.BAD_REQUEST,
        message: 'Invalid or expired code',
      });
      expect(Token.findOne).toHaveBeenCalledWith({
        token: '000000',
        type: tokenTypes.RESET_PASSWORD,
        user: userId,
        blacklisted: false,
      });
    });

    test('expired code is deleted → 400', async () => {
      const doc = { expires: moment().subtract(1, 'minute').toDate(), deleteOne: jest.fn() };
      userService.getUserByEmail.mockResolvedValue(user);
      Token.findOne.mockResolvedValue(doc);
      await expect(tokenService.verifyResetPasswordCode('a@b.c', '123456')).rejects.toMatchObject({
        statusCode: httpStatus.BAD_REQUEST,
        message: 'Code has expired. Please request a new one.',
      });
      expect(doc.deleteOne).toHaveBeenCalled();
    });

    test('valid code returns the token doc', async () => {
      const doc = { expires: moment().add(10, 'minutes').toDate(), deleteOne: jest.fn() };
      userService.getUserByEmail.mockResolvedValue(user);
      Token.findOne.mockResolvedValue(doc);
      await expect(tokenService.verifyResetPasswordCode('a@b.c', '123456')).resolves.toBe(doc);
      expect(doc.deleteOne).not.toHaveBeenCalled();
    });
  });

  test('generateVerifyEmailToken stores a verify-email token', async () => {
    const token = await tokenService.generateVerifyEmailToken(user);
    expect(jwt.decode(token)).toMatchObject({ sub: userId, type: tokenTypes.VERIFY_EMAIL });
    expect(Token.create).toHaveBeenCalledWith(expect.objectContaining({ token, type: tokenTypes.VERIFY_EMAIL }));
  });
});
