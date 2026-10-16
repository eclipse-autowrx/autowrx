// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const { clearAuthCache } = require('../../src/utils/siteConfig');
const setupTestDB = require('../utils/setupTestDB');
const { SiteConfig } = require('../../src/models');
const { userOne, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken } = require('../fixtures/token.fixture');

setupTestDB();

// No RUNTIME_SERVICE_MAPPINGS entry in the test env, so authenticated requests stop at the
// gate with 502 RUNTIME_NOT_CONFIGURED and no upstream runtime is ever contacted.
const RUNTIME_NAME = 'PUBLIC-01-test';

describe('Runtime preview auth', () => {
  beforeEach(async () => {
    await insertUsers([userOne]);
    await SiteConfig.create({
      key: 'PUBLIC_VIEWING',
      scope: 'site',
      value: true,
      valueType: 'boolean',
      secret: false,
      category: 'auth',
      created_by: userOne._id,
      updated_by: userOne._id,
    });
    // Drop the siteConfig auth cache so loadAuthConfigs reads the seeded doc through the real path
    clearAuthCache();
  });

  test('should prove PUBLIC_VIEWING is live: anonymous GET /v2/users succeeds', async () => {
    await request(app).get('/v2/users').expect(httpStatus.OK);
  });

  test('should return 401 for anonymous GET /runtime-preview/:name even when PUBLIC_VIEWING is enabled', async () => {
    const res = await request(app).get(`/runtime-preview/${RUNTIME_NAME}`).expect(httpStatus.UNAUTHORIZED);

    expect(res.body).toEqual({ code: httpStatus.UNAUTHORIZED, message: 'Please authenticate' });
  });

  test('should return 401 for anonymous GET /runtime-preview (no runtime name)', async () => {
    await request(app).get('/runtime-preview').expect(httpStatus.UNAUTHORIZED);
  });

  test('should return 401 for anonymous GET /runtime-preview/ (trailing slash, no runtime name)', async () => {
    await request(app).get('/runtime-preview/').expect(httpStatus.UNAUTHORIZED);
  });

  test('should return 401 when access_token query param is not a valid token', async () => {
    const res = await request(app)
      .get(`/runtime-preview/${RUNTIME_NAME}`)
      .query({ access_token: 'garbage-token' })
      .expect(httpStatus.UNAUTHORIZED);

    expect(res.body).toEqual({ code: httpStatus.UNAUTHORIZED, message: 'Please authenticate' });
  });

  test('should pass auth with a valid Bearer token and stop at the runtime gate (502 RUNTIME_NOT_CONFIGURED)', async () => {
    const res = await request(app)
      .get(`/runtime-preview/${RUNTIME_NAME}`)
      .set('Authorization', `Bearer ${userOneAccessToken}`)
      .expect(httpStatus.BAD_GATEWAY);

    expect(res.headers['content-type']).toMatch(/text\/html/);
  });

  test('should pass auth with a valid access_token query param and stop at the runtime gate (502 RUNTIME_NOT_CONFIGURED)', async () => {
    await request(app)
      .get(`/runtime-preview/${RUNTIME_NAME}`)
      .query({ access_token: userOneAccessToken })
      .expect(httpStatus.BAD_GATEWAY);
  });
});
