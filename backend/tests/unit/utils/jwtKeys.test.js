// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const jwt = require('jsonwebtoken');
const moment = require('moment');

const ENV_KEYS = ['JWT_SECRET', 'JWT_KEYS', 'JWT_ACTIVE_KID', 'JWT_ACCEPT_LEGACY_SECRET'];

const loadWithEnv = (env) => {
  ENV_KEYS.forEach((key) => {
    if (env[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = env[key];
    }
  });
  jest.resetModules();
  /* eslint-disable global-require */
  return {
    jwtKeys: require('../../../src/utils/jwtKeys'),
    tokenService: require('../../../src/services/token.service'),
    tokenTypes: require('../../../src/config/tokens').tokenTypes,
  };
  /* eslint-enable global-require */
};

describe('jwtKeys', () => {
  const original = {};
  ENV_KEYS.forEach((key) => {
    original[key] = process.env[key];
  });

  afterEach(() => {
    loadWithEnv(original);
  });

  const ring = {
    JWT_SECRET: 'legacy-secret',
    JWT_KEYS: JSON.stringify({ new: 'new-secret', old: 'old-secret' }),
    JWT_ACTIVE_KID: 'new',
  };
  const expires = () => moment().add(5, 'minutes');

  test('signs with the active kid and verifies', () => {
    const { jwtKeys, tokenService, tokenTypes } = loadWithEnv(ring);
    const token = tokenService.generateToken('user1', expires(), tokenTypes.ACCESS);

    expect(jwt.decode(token, { complete: true }).header).toMatchObject({ alg: 'HS256', kid: 'new' });
    expect(jwtKeys.verifyJwt(token).sub).toBe('user1');
  });

  test('verifies tokens signed with a retired kid still in the ring', () => {
    const { jwtKeys } = loadWithEnv(ring);
    const token = jwt.sign({ sub: 'user1' }, 'old-secret', { keyid: 'old' });

    expect(jwtKeys.verifyJwt(token).sub).toBe('user1');
  });

  test('rejects unknown kids, including Object.prototype keys', () => {
    const { jwtKeys } = loadWithEnv(ring);

    expect(() => jwtKeys.verifyJwt(jwt.sign({ sub: 'u' }, 'gone', { keyid: 'gone' }))).toThrow('Unknown key id');
    expect(() => jwtKeys.verifyJwt(jwt.sign({ sub: 'u' }, 'x', { keyid: 'constructor' }))).toThrow('Unknown key id');
  });

  test('rejects a token whose kid exists but whose signature uses another key', () => {
    const { jwtKeys } = loadWithEnv(ring);

    expect(() => jwtKeys.verifyJwt(jwt.sign({ sub: 'u' }, 'old-secret', { keyid: 'new' }))).toThrow('invalid signature');
  });

  test('verifies legacy tokens without kid against JWT_SECRET', () => {
    const { jwtKeys } = loadWithEnv(ring);

    expect(jwtKeys.verifyJwt(jwt.sign({ sub: 'user1' }, 'legacy-secret')).sub).toBe('user1');
    expect(() => jwtKeys.verifyJwt(jwt.sign({ sub: 'user1' }, 'new-secret'))).toThrow('invalid signature');
  });

  test('rejects unsigned and non-HS256 tokens', () => {
    const { jwtKeys } = loadWithEnv(ring);
    const unsigned = jwt.sign({ sub: 'u' }, null, { algorithm: 'none', keyid: 'new' });
    const hs512 = jwt.sign({ sub: 'u' }, 'new-secret', { algorithm: 'HS512', keyid: 'new' });

    expect(() => jwtKeys.verifyJwt(unsigned)).toThrow('jwt signature is required');
    expect(() => jwtKeys.verifyJwt(hs512)).toThrow('invalid algorithm');
    expect(() => jwtKeys.verifyJwt('not-a-jwt')).toThrow('jwt malformed');
  });

  test('falls back to JWT_SECRET under kid "default" when JWT_KEYS is unset', () => {
    const { jwtKeys, tokenService, tokenTypes } = loadWithEnv({ JWT_SECRET: 'only-secret' });
    const token = tokenService.generateToken('user1', expires(), tokenTypes.ACCESS);

    expect(jwt.decode(token, { complete: true }).header.kid).toBe('default');
    expect(jwt.verify(token, 'only-secret').sub).toBe('user1');
    expect(jwtKeys.verifyJwt(token).sub).toBe('user1');
  });

  test('keeps verifying kid "default" tokens from before the first rotation', () => {
    const before = loadWithEnv({ JWT_SECRET: 'legacy-secret' });
    const token = before.tokenService.generateToken('user1', expires(), before.tokenTypes.ACCESS);
    const { jwtKeys } = loadWithEnv(ring);

    expect(jwt.decode(token, { complete: true }).header.kid).toBe('default');
    expect(jwtKeys.verifyJwt(token).sub).toBe('user1');
  });

  test('rejects JWT_SECRET-signed tokens once JWT_ACCEPT_LEGACY_SECRET is off', () => {
    const { jwtKeys } = loadWithEnv({ ...ring, JWT_ACCEPT_LEGACY_SECRET: 'false' });

    expect(() => jwtKeys.verifyJwt(jwt.sign({ sub: 'u' }, 'legacy-secret', { keyid: 'default' }))).toThrow('Unknown key id');
    expect(() => jwtKeys.verifyJwt(jwt.sign({ sub: 'u' }, 'legacy-secret'))).toThrow('Tokens without kid are not accepted');
    expect(jwtKeys.verifyJwt(jwt.sign({ sub: 'u' }, 'old-secret', { keyid: 'old' })).sub).toBe('u');
  });

  test('adds the tid claim only when a tenant is given', () => {
    const { tokenService, tokenTypes } = loadWithEnv(ring);

    expect(jwt.decode(tokenService.generateToken('u', expires(), tokenTypes.ACCESS, undefined, { tid: 't1' })).tid).toBe(
      't1',
    );
    expect(jwt.decode(tokenService.generateToken('u', expires(), tokenTypes.ACCESS))).not.toHaveProperty('tid');
  });

  test.each([
    [{ JWT_KEYS: 'not-json' }, 'JWT_KEYS must be valid JSON'],
    [{ JWT_KEYS: '{}' }, 'JWT_KEYS must contain at least one'],
    [{ JWT_KEYS: '{"a":"s"}' }, 'JWT_ACTIVE_KID must name a key'],
    [{ JWT_KEYS: '{"a":"s"}', JWT_ACTIVE_KID: 'b' }, 'JWT_ACTIVE_KID must name a key'],
    [{ JWT_KEYS: '{"a":"s"}', JWT_ACTIVE_KID: 'constructor' }, 'JWT_ACTIVE_KID must name a key'],
  ])('rejects invalid key ring config %j', (env, message) => {
    expect(() => loadWithEnv(env)).toThrow(message);
  });
});
