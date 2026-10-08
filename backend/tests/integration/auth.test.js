// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const config = require('../../src/config/config');
const { User } = require('../../src/models');
const setupTestDB = require('../utils/setupTestDB');

// The suite exercises the v2 auth API (/v2/auth/login, /refresh-tokens,
// /logout) against real bcrypt-hashed users.

setupTestDB();

const password = 'password1';
const adminEmail = 'admin-int@example.com';
const userEmail = 'user-int@example.com';

const insertUser = (email, name) => User.create({ email, password, name });

let adminTokens;
let userTokens;
let adminRefreshToken;
let userRefreshToken;

// the refresh token is delivered as an HTTP-only cookie, not in the body
const refreshCookieToken = (res) => {
  const cookie = (res.headers['set-cookie'] || []).find((c) =>
    c.startsWith(`${config.jwt.cookie.name}=`),
  );
  return cookie ? cookie.split(';')[0].split('=')[1] : undefined;
};

// setupTestDB's beforeEach wipes the DB first (it is declared before this
// hook), so seed the users and sign in fresh for every test.
beforeEach(async () => {
  await insertUser(adminEmail, 'Admin Integration');
  await insertUser(userEmail, 'User Integration');

  const adminLogin = await request(app).post('/v2/auth/login').send({ email: adminEmail, password });
  adminTokens = adminLogin.body.tokens;
  adminRefreshToken = refreshCookieToken(adminLogin);

  const userLogin = await request(app).post('/v2/auth/login').send({ email: userEmail, password });
  userTokens = userLogin.body.tokens;
  userRefreshToken = refreshCookieToken(userLogin);
});

describe('POST /v2/auth/login', () => {
  test('returns 200 with user and tokens for valid credentials', async () => {
    const res = await request(app)
      .post('/v2/auth/login')
      .send({ email: adminEmail, password })
      .expect(httpStatus.OK);

    expect(res.body.user).toMatchObject({ email: adminEmail });
    expect(res.body.tokens.access.token).toEqual(expect.any(String));
    // refresh token rides the Set-Cookie header
    expect(refreshCookieToken(res)).toEqual(expect.any(String));
  });

  test('returns 401 for a wrong password', async () => {
    await request(app)
      .post('/v2/auth/login')
      .send({ email: adminEmail, password: 'wrong-password' })
      .expect(httpStatus.UNAUTHORIZED);
  });

  test('returns 401 for an unknown email', async () => {
    await request(app)
      .post('/v2/auth/login')
      .send({ email: 'nobody@example.com', password })
      .expect(httpStatus.UNAUTHORIZED);
  });

  test('returns 400 when the body is invalid', async () => {
    await request(app).post('/v2/auth/login').send({ email: adminEmail }).expect(httpStatus.BAD_REQUEST);
  });
});

describe('POST /v2/auth/refresh-tokens', () => {
  test('returns 200 and fresh access token for a valid refresh token', async () => {
    const res = await request(app)
      .post('/v2/auth/refresh-tokens')
      .set('Cookie', `${config.jwt.cookie.name}=${adminRefreshToken}`)
      .send({ refreshToken: adminRefreshToken })
      .expect(httpStatus.OK);

    expect(res.body.access.token).toEqual(expect.any(String));
  });

  test('returns 401 for an invalid refresh token', async () => {
    await request(app)
      .post('/v2/auth/refresh-tokens')
      .set('Cookie', `${config.jwt.cookie.name}=invalid-refresh-token`)
      .send({ refreshToken: 'invalid-refresh-token' })
      .expect(httpStatus.UNAUTHORIZED);
  });
});

describe('POST /v2/auth/logout', () => {
  test('returns 204 and clears the token cookie', async () => {
    const res = await request(app)
      .post('/v2/auth/logout')
      .set('Cookie', `${config.jwt.cookie.name}=${userRefreshToken}`)
      .expect(httpStatus.NO_CONTENT);

    expect(res.headers['set-cookie'][0]).toMatch(/Expires=Thu, 01 Jan 1970/);
  });
});
