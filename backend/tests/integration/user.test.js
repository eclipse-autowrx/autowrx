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
const { User, Role } = require('../../src/models');
const { permissionService } = require('../../src/services');
const { PERMISSIONS } = require('../../src/config/roles');
const setupTestDB = require('../utils/setupTestDB');

// The suite exercises the v2 user management API (/v2/users): admin-only
// create/update/delete with RBAC (checkPermission(PERMISSIONS.ADMIN)),
// plus the optional-auth list and self endpoints.

setupTestDB();

const password = 'password1';
const admin = { email: 'admin-int@example.com', name: 'Admin Integration', password, role: 'admin' };
const user = { email: 'user-int@example.com', name: 'User Integration', password, role: 'user' };

let adminTokens;
let userTokens;
let adminUserId;
let userUserId;

// setupTestDB's beforeEach wipes the DB first (it is declared before this
// hook), so seed the users, RBAC role and tokens fresh for every test.
beforeEach(async () => {
  const adminDoc = await User.create(admin);
  adminUserId = adminDoc._id;
  const userDoc = await User.create(user);
  userUserId = userDoc._id;

  const adminRole = await Role.create({
    name: 'Admin',
    permissions: [PERMISSIONS.ADMIN],
    ref: 'admin',
  });
  await permissionService.assignRoleToUser(adminDoc._id, adminRole._id);

  const adminLogin = await request(app).post('/v2/auth/login').send({ email: admin.email, password });
  adminTokens = adminLogin.body.tokens;
  const userLogin = await request(app).post('/v2/auth/login').send({ email: user.email, password });
  userTokens = userLogin.body.tokens;
});

describe('POST /v2/users', () => {
  const newUser = { name: 'Created User', email: 'created@example.com', password };

  test('returns 401 without an access token', async () => {
    await request(app).post('/v2/users').send(newUser).expect(httpStatus.UNAUTHORIZED);
  });

  test('returns 403 for a user without the admin permission', async () => {
    await request(app)
      .post('/v2/users')
      .set('Authorization', `Bearer ${userTokens.access.token}`)
      .send(newUser)
      .expect(httpStatus.FORBIDDEN);
  });

  test('returns 201 and creates the user when called by an admin', async () => {
    const res = await request(app)
      .post('/v2/users')
      .set('Authorization', `Bearer ${adminTokens.access.token}`)
      .send(newUser)
      .expect(httpStatus.CREATED);

    expect(res.body).toMatchObject({ email: newUser.email, name: newUser.name });
    const dbUser = await User.findOne({ email: newUser.email });
    expect(dbUser).toBeTruthy();
  });

  test('returns 400 for an invalid email', async () => {
    await request(app)
      .post('/v2/users')
      .set('Authorization', `Bearer ${adminTokens.access.token}`)
      .send({ ...newUser, email: 'invalidEmail' })
      .expect(httpStatus.BAD_REQUEST);
  });

  test('returns 400 for a password shorter than 8 characters', async () => {
    await request(app)
      .post('/v2/users')
      .set('Authorization', `Bearer ${adminTokens.access.token}`)
      .send({ ...newUser, email: 'shortpw@example.com', password: 'short' })
      .expect(httpStatus.BAD_REQUEST);
  });
});

describe('GET /v2/users', () => {
  test('returns 200 and the seeded users for an admin', async () => {
    const res = await request(app)
      .get('/v2/users')
      .set('Authorization', `Bearer ${adminTokens.access.token}`)
      .expect(httpStatus.OK);

    // the list endpoint returns a privacy-reduced projection (name,id,image_file)
    const names = res.body.results.map((u) => u.name);
    expect(names).toContain(admin.name);
    expect(names).toContain(user.name);
  });
});

describe('PATCH /v2/users/:userId', () => {
  test('returns 200 and updates the name when called by an admin', async () => {
    const res = await request(app)
      .patch(`/v2/users/${userUserId}`)
      .set('Authorization', `Bearer ${adminTokens.access.token}`)
      .send({ name: 'Renamed Integration' })
      .expect(httpStatus.OK);

    expect(res.body.name).toBe('Renamed Integration');
    const dbUser = await User.findById(userUserId);
    expect(dbUser.name).toBe('Renamed Integration');
  });

  test('returns 403 for a user without the admin permission', async () => {
    await request(app)
      .patch(`/v2/users/${userUserId}`)
      .set('Authorization', `Bearer ${userTokens.access.token}`)
      .send({ name: 'Should Not Apply' })
      .expect(httpStatus.FORBIDDEN);
  });
});

describe('DELETE /v2/users/:userId', () => {
  test('returns 403 for a user without the admin permission', async () => {
    await request(app)
      .delete(`/v2/users/${userUserId}`)
      .set('Authorization', `Bearer ${userTokens.access.token}`)
      .expect(httpStatus.FORBIDDEN);
  });

  test('returns 204 and removes the user when called by an admin', async () => {
    await request(app)
      .delete(`/v2/users/${userUserId}`)
      .set('Authorization', `Bearer ${adminTokens.access.token}`)
      .expect(httpStatus.NO_CONTENT);

    const dbUser = await User.findById(userUserId);
    expect(dbUser).toBeNull();
  });
});
