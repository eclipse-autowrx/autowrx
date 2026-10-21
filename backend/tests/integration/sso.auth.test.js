// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const crypto = require('crypto');
const request = require('supertest');
const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

jest.mock('jwks-rsa', () => jest.fn());

const axios = require('axios');
const jwksRsa = require('jwks-rsa');
const app = require('../../src/app');
const { clearAuthCache } = require('../../src/utils/siteConfig');
const { _resetCache } = require('../../src/utils/oidcVerifier');
const setupTestDB = require('../utils/setupTestDB');
const { SiteConfig, User } = require('../../src/models');

setupTestDB();

const KID = 'sso-test-kid';
const CLIENT_ID = 'sso-client-id';
const TENANT = '99999999-8888-7777-6666-555555555555';
const AUTHORITY = `https://login.sso-test.invalid/${TENANT}`;
const ISSUER = `${AUTHORITY}/v2.0`;
const PROVIDER_ID = 'msal-test';
const EMAIL = 'sso.user@example.com';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const attacker = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

const signToken = (key, claims = {}) =>
  jwt.sign({ iss: ISSUER, aud: CLIENT_ID, sub: 'sub-1', oid: 'oid-1', name: 'Sso User', email: EMAIL, ...claims }, key, {
    algorithm: 'RS256',
    header: { kid: KID },
  });

const forgedUnsigned = () => {
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${enc({ alg: 'none', typ: 'JWT' })}.${enc({ iss: ISSUER, aud: CLIENT_ID, email: EMAIL, name: 'Forged' })}.`;
};

const seedConfig = async (key, value, valueType, category = 'auth') => {
  const id = new mongoose.Types.ObjectId();
  await SiteConfig.create({
    key,
    scope: 'site',
    value,
    valueType,
    secret: false,
    category,
    created_by: id,
    updated_by: id,
  });
};

describe('POST /v2/auth/sso ID token validation', () => {
  beforeEach(async () => {
    _resetCache();
    jest.spyOn(axios, 'get').mockImplementation(async (url) => {
      if (url === `${AUTHORITY}/v2.0/.well-known/openid-configuration`) {
        return { data: { issuer: ISSUER, jwks_uri: `${AUTHORITY}/keys` } };
      }
      throw new Error(`unexpected axios.get ${url}`);
    });
    jwksRsa.mockReturnValue({
      getSigningKey: async () => ({ getPublicKey: () => publicKey.export({ type: 'spki', format: 'pem' }) }),
    });

    await seedConfig(
      'SSO_PROVIDERS',
      [{ id: PROVIDER_ID, name: 'Test', type: 'MSAL', clientId: CLIENT_ID, authority: AUTHORITY, enabled: true }],
      'array',
      'sso',
    );
    await seedConfig('SSO_AUTO_REGISTRATION', true, 'boolean');
    clearAuthCache();
  });

  const post = (idToken) => request(app).post('/v2/auth/sso').send({ providerId: PROVIDER_ID, idToken });

  test('should return 401 and create no user for an unsigned (alg none) forged token, even with auto-registration on', async () => {
    const res = await post(forgedUnsigned()).expect(httpStatus.UNAUTHORIZED);

    expect(res.body.message).toBe('Invalid ID token');
    expect(await User.countDocuments({ email: EMAIL })).toBe(0);
  });

  test('should return 401 and create no user for a token signed with an attacker key', async () => {
    await post(signToken(attacker.privateKey)).expect(httpStatus.UNAUTHORIZED);

    expect(await User.countDocuments({ email: EMAIL })).toBe(0);
  });

  test('should return 401 for a token issued for a different audience', async () => {
    await post(signToken(privateKey, { aud: 'another-app' })).expect(httpStatus.UNAUTHORIZED);

    expect(await User.countDocuments({ email: EMAIL })).toBe(0);
  });

  test('should return 200 with tokens and create the user for a valid token', async () => {
    const res = await post(signToken(privateKey)).expect(httpStatus.OK);

    expect(res.body.tokens.access.token).toBeDefined();
    expect(res.body.user.email).toBe(EMAIL);
    expect(await User.countDocuments({ email: EMAIL })).toBe(1);
  });

  test('should return 400 for an unknown provider', async () => {
    await request(app)
      .post('/v2/auth/sso')
      .send({ providerId: 'nope', idToken: signToken(privateKey) })
      .expect(httpStatus.BAD_REQUEST);
  });
});
