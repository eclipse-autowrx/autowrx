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
const setupTestDB = require('../utils/setupTestDB');
const { Prototype, UserRole } = require('../../src/models');
const { userOne, userTwo, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, userTwoAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const { seedRoles, getRole, grantRole } = require('../fixtures/role.fixture');
const { insertModel } = require('../fixtures/model.fixture');

setupTestDB();

// userOne owns the private model, userTwo is a stranger, admin holds the global admin role.
describe('Permission routes (RBAC v1)', () => {
  let privateModel;
  let contributorRole;

  beforeEach(async () => {
    await seedRoles();
    await insertUsers([userOne, userTwo, admin]);
    await grantRole(admin._id, 'admin');
    privateModel = await insertModel({ created_by: userOne._id, visibility: 'private' });
    contributorRole = await getRole('model_contributor');
  });

  describe('POST /v2/permissions', () => {
    test('should return 201 and create the user role when called by an admin', async () => {
      await request(app)
        .post('/v2/permissions')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ user: userTwo._id.toString(), role: contributorRole.id, ref: privateModel.id })
        .expect(httpStatus.CREATED);

      expect(await UserRole.countDocuments({ user: userTwo._id, role: contributorRole._id, ref: privateModel.id })).toBe(1);
    });

    test('should not duplicate the user role when assigned twice', async () => {
      const body = { user: userTwo._id.toString(), role: contributorRole.id, ref: privateModel.id };
      await request(app).post('/v2/permissions').set('Authorization', `Bearer ${adminAccessToken}`).send(body);
      await request(app)
        .post('/v2/permissions')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(body)
        .expect(httpStatus.CREATED);

      expect(await UserRole.countDocuments({ user: userTwo._id })).toBe(1);
    });

    test('should return 403 for a non-admin, even the model owner', async () => {
      await request(app)
        .post('/v2/permissions')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ user: userTwo._id.toString(), role: contributorRole.id, ref: privateModel.id })
        .expect(httpStatus.FORBIDDEN);

      expect(await UserRole.countDocuments({ user: userTwo._id })).toBe(0);
    });

    test('should return 401 without an access token', async () => {
      await request(app)
        .post('/v2/permissions')
        .send({ user: userTwo._id.toString(), role: contributorRole.id })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 when user or role is missing', async () => {
      await request(app)
        .post('/v2/permissions')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ role: contributorRole.id })
        .expect(httpStatus.BAD_REQUEST);
      await request(app)
        .post('/v2/permissions')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ user: userTwo._id.toString() })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /v2/permissions', () => {
    test('should return 204 and remove a global role when called by an admin', async () => {
      await grantRole(userTwo._id, 'model_contributor');

      await request(app)
        .delete('/v2/permissions')
        .query({ user: userTwo._id.toString(), role: contributorRole.id })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      expect(await UserRole.countDocuments({ user: userTwo._id })).toBe(0);
    });

    test('should return 403 for a non-admin', async () => {
      await grantRole(userTwo._id, 'model_contributor');

      await request(app)
        .delete('/v2/permissions')
        .query({ user: userTwo._id.toString(), role: contributorRole.id })
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.FORBIDDEN);

      expect(await UserRole.countDocuments({ user: userTwo._id })).toBe(1);
    });

    test('should return 400 when user or role is not an ObjectId', async () => {
      await request(app)
        .delete('/v2/permissions')
        .query({ user: 'nope', role: contributorRole.id })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('Grant and revoke flow', () => {
    test('should allow editing a private-model prototype only while the model-scoped role is granted', async () => {
      const prototype = await Prototype.create({ name: 'Guarded', model_id: privateModel._id, created_by: userOne._id });
      const patch = () =>
        request(app)
          .patch(`/v2/prototypes/${prototype.id}`)
          .set('Authorization', `Bearer ${userTwoAccessToken}`)
          .send({ code: 'print(2)' });

      await patch().expect(httpStatus.FORBIDDEN);

      await request(app)
        .post('/v2/permissions')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ user: userTwo._id.toString(), role: contributorRole.id, ref: privateModel.id })
        .expect(httpStatus.CREATED);
      await patch().expect(httpStatus.OK);

      // Model-scoped grants are revoked through the model collaborator route, not DELETE /v2/permissions.
      await request(app)
        .delete(`/v2/models/${privateModel.id}/permissions`)
        .query({ userId: userTwo._id.toString(), role: 'model_contributor' })
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NO_CONTENT);
      await patch().expect(httpStatus.FORBIDDEN);
    });

    test('should leave model-scoped grants alone on DELETE /v2/permissions, which only revokes global roles', async () => {
      await grantRole(userTwo._id, 'model_contributor', privateModel._id);

      await request(app)
        .delete('/v2/permissions')
        .query({ user: userTwo._id.toString(), role: contributorRole.id })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      expect(await UserRole.countDocuments({ user: userTwo._id, ref: privateModel.id })).toBe(1);
    });
  });

  describe('GET /v2/permissions/has-permission', () => {
    test('should evaluate each permission:resource pair for the caller', async () => {
      const permissions = `writeModel:${privateModel.id},manageUsers`;
      const check = (token) =>
        request(app)
          .get('/v2/permissions/has-permission')
          .query({ permissions })
          .set('Authorization', `Bearer ${token}`)
          .expect(httpStatus.OK);

      expect((await check(userOneAccessToken)).body).toEqual([true, false]);
      expect((await check(userTwoAccessToken)).body).toEqual([false, false]);
      expect((await check(adminAccessToken)).body).toEqual([true, true]);
    });

    test('should return 401 without an access token', async () => {
      await request(app).get('/v2/permissions/has-permission').expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /v2/permissions/self', () => {
    test("should return only the caller's own roles", async () => {
      await grantRole(userTwo._id, 'model_member', privateModel._id);

      const res = await request(app)
        .get('/v2/permissions/self')
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ ref: privateModel.id, role: { ref: 'model_member' } });
    });
  });

  describe('GET /v2/permissions/roles and /v2/permissions', () => {
    test('should list every role, and only feature roles on the root path', async () => {
      const allRoles = await request(app)
        .get('/v2/permissions/roles')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);
      const featureRoles = await request(app)
        .get('/v2/permissions')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(allRoles.body.map((r) => r.ref)).toEqual(
        expect.arrayContaining(['admin', 'model_contributor', 'model_member']),
      );
      expect(featureRoles.body.map((r) => r.ref)).toContain('admin');
      expect(featureRoles.body.map((r) => r.ref)).not.toEqual(expect.arrayContaining(['model_contributor']));
      expect(featureRoles.body.map((r) => r.ref)).not.toContain('model_member');
    });
  });

  describe('GET /v2/permissions/users-by-roles', () => {
    test('should group users by role for an admin', async () => {
      const res = await request(app)
        .get('/v2/permissions/users-by-roles')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      const adminGroup = res.body.find((group) => group.role.ref === 'admin');
      expect(adminGroup.users.map((u) => u.id)).toEqual([admin._id.toString()]);
    });

    test('should return 403 for a non-admin', async () => {
      await request(app)
        .get('/v2/permissions/users-by-roles')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });
  });
});
