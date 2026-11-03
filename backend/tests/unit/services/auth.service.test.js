// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #641: unit coverage for login / logout / refresh / reset / verify flows in auth.service.

jest.mock('../../../src/services/token.service', () => ({
  verifyToken: jest.fn(),
  verifyResetPasswordCode: jest.fn(),
  generateAuthTokens: jest.fn(),
}));
jest.mock('../../../src/services/user.service', () => ({
  getUserByEmail: jest.fn(),
  getUserById: jest.fn(),
  updateUserById: jest.fn(),
}));
jest.mock('../../../src/models/token.model', () => ({ findOne: jest.fn(), deleteMany: jest.fn() }));
jest.mock('../../../src/services/listener.service', () => ({ findSocketByUser: jest.fn() }));
jest.mock('../../../src/utils/oidcVerifier', () => ({ verifyIdToken: jest.fn() }));

const httpStatus = require('http-status');
const tokenService = require('../../../src/services/token.service');
const userService = require('../../../src/services/user.service');
const Token = require('../../../src/models/token.model');
const { verifyIdToken } = require('../../../src/utils/oidcVerifier');
const { tokenTypes } = require('../../../src/config/tokens');
const authService = require('../../../src/services/auth.service');

const tokenDoc = (fields = {}) => ({ user: 'u1', deleteOne: jest.fn(), ...fields });

describe('auth.service', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('loginUserWithEmailAndPassword', () => {
    test('unknown email → 401', async () => {
      userService.getUserByEmail.mockResolvedValue(null);
      await expect(authService.loginUserWithEmailAndPassword('a@b.c', 'pw')).rejects.toMatchObject({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'Incorrect email or password',
      });
    });

    test('wrong password → 401', async () => {
      userService.getUserByEmail.mockResolvedValue({ isPasswordMatch: jest.fn().mockResolvedValue(false) });
      await expect(authService.loginUserWithEmailAndPassword('a@b.c', 'pw')).rejects.toMatchObject({
        statusCode: httpStatus.UNAUTHORIZED,
      });
    });

    test('SSO-only account → 400', async () => {
      userService.getUserByEmail.mockResolvedValue({
        provider_user_id: 'sso-1',
        isPasswordMatch: jest.fn().mockResolvedValue(true),
      });
      await expect(authService.loginUserWithEmailAndPassword('a@b.c', 'pw')).rejects.toMatchObject({
        statusCode: httpStatus.BAD_REQUEST,
        message: 'Please login with SSO',
      });
    });

    test('valid credentials return the user', async () => {
      const user = { password: 'hash', isPasswordMatch: jest.fn().mockResolvedValue(true) };
      userService.getUserByEmail.mockResolvedValue(user);
      await expect(authService.loginUserWithEmailAndPassword('a@b.c', 'pw')).resolves.toBe(user);
      expect(user.isPasswordMatch).toHaveBeenCalledWith('pw');
    });
  });

  describe('logout', () => {
    test('missing refresh token → 401', async () => {
      await expect(authService.logout(undefined)).rejects.toMatchObject({ statusCode: httpStatus.UNAUTHORIZED });
      expect(Token.findOne).not.toHaveBeenCalled();
    });

    test('unknown or blacklisted token → 404', async () => {
      Token.findOne.mockResolvedValue(null);
      await expect(authService.logout('rt')).rejects.toMatchObject({ statusCode: httpStatus.NOT_FOUND });
      expect(Token.findOne).toHaveBeenCalledWith({ token: 'rt', type: tokenTypes.REFRESH, blacklisted: false });
    });

    test('deletes the refresh token', async () => {
      const doc = tokenDoc();
      Token.findOne.mockResolvedValue(doc);
      await authService.logout('rt');
      expect(doc.deleteOne).toHaveBeenCalled();
    });
  });

  describe('refreshAuth', () => {
    test('missing refresh token → 401', async () => {
      await expect(authService.refreshAuth('')).rejects.toMatchObject({ statusCode: httpStatus.UNAUTHORIZED });
    });

    test('invalid token → 401', async () => {
      tokenService.verifyToken.mockRejectedValue(new Error('Token not found'));
      await expect(authService.refreshAuth('rt')).rejects.toMatchObject({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'Please authenticate',
      });
    });

    test('user gone → 401 and the token is kept', async () => {
      const doc = tokenDoc();
      tokenService.verifyToken.mockResolvedValue(doc);
      userService.getUserById.mockResolvedValue(null);
      await expect(authService.refreshAuth('rt')).rejects.toMatchObject({ statusCode: httpStatus.UNAUTHORIZED });
      expect(doc.deleteOne).not.toHaveBeenCalled();
      expect(tokenService.generateAuthTokens).not.toHaveBeenCalled();
    });

    test('rotates the refresh token and issues new tokens', async () => {
      const doc = tokenDoc();
      const user = { _id: 'u1' };
      const tokens = { access: {}, refresh: {} };
      tokenService.verifyToken.mockResolvedValue(doc);
      userService.getUserById.mockResolvedValue(user);
      tokenService.generateAuthTokens.mockResolvedValue(tokens);

      await expect(authService.refreshAuth('rt')).resolves.toBe(tokens);
      expect(tokenService.verifyToken).toHaveBeenCalledWith('rt', tokenTypes.REFRESH);
      expect(doc.deleteOne).toHaveBeenCalled();
      expect(tokenService.generateAuthTokens).toHaveBeenCalledWith(user);
    });
  });

  describe.each([
    ['resetPassword', () => authService.resetPassword('tok', 'newPass1'), tokenService.verifyToken],
    [
      'resetPasswordWithCode',
      () => authService.resetPasswordWithCode('a@b.c', '123456', 'newPass1'),
      tokenService.verifyResetPasswordCode,
    ],
  ])('%s', (_name, run, verifier) => {
    test('propagates verification errors', async () => {
      verifier.mockRejectedValue(new Error('bad'));
      await expect(run()).rejects.toThrow('bad');
      expect(userService.updateUserById).not.toHaveBeenCalled();
    });

    test('user gone → 400', async () => {
      verifier.mockResolvedValue(tokenDoc());
      userService.getUserById.mockResolvedValue(null);
      await expect(run()).rejects.toMatchObject({
        statusCode: httpStatus.BAD_REQUEST,
        message: 'Password reset failed',
      });
      expect(userService.updateUserById).not.toHaveBeenCalled();
    });

    test('updates the password and clears reset tokens', async () => {
      const user = { _id: 'u1' };
      verifier.mockResolvedValue(tokenDoc());
      userService.getUserById.mockResolvedValue(user);

      await expect(run()).resolves.toBe(user);
      expect(userService.getUserById).toHaveBeenCalledWith('u1', true);
      expect(userService.updateUserById).toHaveBeenCalledWith('u1', { password: 'newPass1' });
      expect(Token.deleteMany).toHaveBeenCalledWith({ user: 'u1', type: tokenTypes.RESET_PASSWORD });
    });
  });

  describe('verifyEmail', () => {
    test('invalid token → 401', async () => {
      tokenService.verifyToken.mockRejectedValue(new Error('Token not found'));
      await expect(authService.verifyEmail('tok')).rejects.toMatchObject({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'Email verification failed',
      });
    });

    test('user gone → 401', async () => {
      tokenService.verifyToken.mockResolvedValue(tokenDoc());
      userService.getUserById.mockResolvedValue(null);
      await expect(authService.verifyEmail('tok')).rejects.toMatchObject({ statusCode: httpStatus.UNAUTHORIZED });
      expect(userService.updateUserById).not.toHaveBeenCalled();
    });

    test('marks the email verified and clears verify tokens', async () => {
      tokenService.verifyToken.mockResolvedValue(tokenDoc());
      userService.getUserById.mockResolvedValue({ _id: 'u1' });

      await authService.verifyEmail('tok');
      expect(tokenService.verifyToken).toHaveBeenCalledWith('tok', tokenTypes.VERIFY_EMAIL);
      expect(Token.deleteMany).toHaveBeenCalledWith({ user: 'u1', type: tokenTypes.VERIFY_EMAIL });
      expect(userService.updateUserById).toHaveBeenCalledWith('u1', { isEmailVerified: true });
    });
  });

  describe('parseIdToken', () => {
    const provider = { id: 'p1', authority: 'https://login.example/tenant', clientId: 'client' };

    test('maps oid, name and email claims', async () => {
      verifyIdToken.mockResolvedValue({ oid: 'oid-1', sub: 'sub-1', name: 'Ann', email: 'ann@example.com' });
      await expect(authService.parseIdToken('jwt', provider)).resolves.toEqual({
        id: 'oid-1',
        displayName: 'Ann',
        mail: 'ann@example.com',
        userPhotoUrl: null,
        providerId: 'p1',
      });
      expect(verifyIdToken).toHaveBeenCalledWith('jwt', { authority: provider.authority, clientId: provider.clientId });
    });

    test('falls back to sub, preferred_username and the email local part', async () => {
      verifyIdToken.mockResolvedValue({ sub: 'sub-1', preferred_username: 'bob@example.com' });
      await expect(authService.parseIdToken('jwt', provider)).resolves.toMatchObject({
        id: 'sub-1',
        mail: 'bob@example.com',
        displayName: 'bob',
      });
    });

    test('no email claim → 401', async () => {
      verifyIdToken.mockResolvedValue({ sub: 'sub-1', name: 'NoMail' });
      await expect(authService.parseIdToken('jwt', provider)).rejects.toMatchObject({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'Invalid ID token',
      });
    });

    test('verifier failure → generic 401', async () => {
      verifyIdToken.mockRejectedValue(new Error('signature mismatch'));
      await expect(authService.parseIdToken('jwt', provider)).rejects.toMatchObject({
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'Invalid ID token',
      });
    });
  });
});
