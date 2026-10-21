// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

jest.mock('axios');
jest.mock('jwks-rsa');

const axios = require('axios');
const jwksRsa = require('jwks-rsa');
const { verifyIdToken, _resetCache } = require('../../../src/utils/oidcVerifier');

const KID = 'test-kid';
const CLIENT_ID = 'client-123';
const TENANT = '11111111-2222-3333-4444-555555555555';
const AUTHORITY = `https://login.example.test/${TENANT}`;
const ISSUER = `https://login.example.test/${TENANT}/v2.0`;

const makeKeyPair = () => crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const goodKeys = makeKeyPair();
const otherKeys = makeKeyPair();

const pem = (key) => key.export({ type: 'pkcs1', format: 'pem' });

const sign = (payload = {}, { key = goodKeys.privateKey, header = {}, algorithm = 'RS256' } = {}) =>
  jwt.sign({ iss: ISSUER, aud: CLIENT_ID, sub: 'user-1', email: 'user@example.com', ...payload }, pem(key), {
    algorithm,
    header: { kid: KID, ...header },
  });

describe('oidcVerifier', () => {
  let getSigningKey;

  const setup = (issuer = ISSUER) => {
    axios.get.mockResolvedValue({ data: { issuer, jwks_uri: 'https://login.example.test/keys' } });
    getSigningKey = jest.fn(async (kid) => {
      if (kid !== KID) throw new Error(`Unable to find a signing key that matches '${kid}'`);
      return { getPublicKey: () => goodKeys.publicKey.export({ type: 'spki', format: 'pem' }) };
    });
    jwksRsa.mockReturnValue({ getSigningKey });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    _resetCache();
    setup();
  });

  const verify = (token) => verifyIdToken(token, { authority: AUTHORITY, clientId: CLIENT_ID });

  it('accepts a valid token and returns the payload', async () => {
    const payload = await verify(sign());
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('user@example.com');
    expect(axios.get).toHaveBeenCalledWith(`${AUTHORITY}/v2.0/.well-known/openid-configuration`, expect.any(Object));
  });

  it('normalizes an authority ending in /v2.0/', async () => {
    await verifyIdToken(sign(), { authority: `${AUTHORITY}/v2.0/`, clientId: CLIENT_ID });
    expect(axios.get.mock.calls[0][0]).toBe(`${AUTHORITY}/v2.0/.well-known/openid-configuration`);
  });

  it('rejects a token signed by a different key', async () => {
    await expect(verify(sign({}, { key: otherKeys.privateKey }))).rejects.toThrow(/invalid signature/);
  });

  it('rejects a tampered payload', async () => {
    const [h, , s] = sign().split('.');
    const forged = Buffer.from(JSON.stringify({ iss: ISSUER, aud: CLIENT_ID, email: 'admin@example.com' })).toString(
      'base64url',
    );
    await expect(verify(`${h}.${forged}.${s}`)).rejects.toThrow(/invalid signature/);
  });

  it('rejects alg none', async () => {
    const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const token = `${enc({ alg: 'none', typ: 'JWT', kid: KID })}.${enc({ iss: ISSUER, aud: CLIENT_ID, email: 'a@b.c' })}.`;
    await expect(verify(token)).rejects.toThrow(/Unsupported ID token algorithm/);
  });

  it('rejects HS256 signed with the clientId as secret', async () => {
    const token = jwt.sign({ iss: ISSUER, aud: CLIENT_ID, email: 'a@b.c' }, CLIENT_ID, {
      algorithm: 'HS256',
      header: { kid: KID },
    });
    await expect(verify(token)).rejects.toThrow(/Unsupported ID token algorithm/);
  });

  it('rejects a wrong audience', async () => {
    await expect(verify(sign({ aud: 'someone-else' }))).rejects.toThrow(/audience invalid/);
  });

  it('rejects a wrong issuer', async () => {
    await expect(verify(sign({ iss: 'https://evil.example.test/v2.0' }))).rejects.toThrow(/issuer mismatch/);
  });

  it('rejects an expired token', async () => {
    const now = Math.floor(Date.now() / 1000);
    await expect(verify(sign({ iat: now - 7200, exp: now - 3600 }))).rejects.toThrow(/jwt expired/);
  });

  it('rejects an unknown kid', async () => {
    await expect(verify(sign({}, { header: { kid: 'unknown' } }))).rejects.toThrow(/Unable to find a signing key/);
  });

  it('rejects a token with no kid', async () => {
    const token = jwt.sign({ iss: ISSUER, aud: CLIENT_ID }, pem(goodKeys.privateKey), { algorithm: 'RS256' });
    await expect(verify(token)).rejects.toThrow(/no kid/);
  });

  it('rejects garbage input', async () => {
    await expect(verify('not-a-jwt')).rejects.toThrow();
    await expect(verify('')).rejects.toThrow();
  });

  describe('multi-tenant (templated issuer)', () => {
    beforeEach(() => {
      _resetCache();
      setup('https://login.example.test/{tenantid}/v2.0');
    });

    it('accepts a token whose iss matches its tid', async () => {
      const payload = await verifyIdToken(sign({ tid: TENANT }), {
        authority: 'https://login.example.test/common',
        clientId: CLIENT_ID,
      });
      expect(payload.tid).toBe(TENANT);
    });

    it('rejects a token without tid', async () => {
      await expect(
        verifyIdToken(sign(), { authority: 'https://login.example.test/common', clientId: CLIENT_ID }),
      ).rejects.toThrow(/no tid/);
    });

    it('rejects a token whose iss does not match its tid', async () => {
      await expect(
        verifyIdToken(sign({ tid: 'other-tenant' }), {
          authority: 'https://login.example.test/common',
          clientId: CLIENT_ID,
        }),
      ).rejects.toThrow(/issuer mismatch/);
    });
  });

  it('caches the discovery document', async () => {
    await verify(sign());
    await verify(sign());
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(jwksRsa).toHaveBeenCalledTimes(1);
  });

  it('rejects when discovery lacks issuer or jwks_uri', async () => {
    axios.get.mockResolvedValue({ data: { issuer: ISSUER } });
    await expect(verify(sign())).rejects.toThrow(/missing issuer or jwks_uri/);
  });
});
