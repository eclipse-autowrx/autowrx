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
const app = require('../../src/app');
const config = require('../../src/config/config');
const setupTestDB = require('../utils/setupTestDB');
const { User } = require('../../src/models');
const { userOne, userTwo, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const { seedRoles, grantRole } = require('../fixtures/role.fixture');

setupTestDB();

const originalStrictAuth = config.strictAuth;

// Admin is no longer a field on the user: it is the global `admin` role held through a UserRole.
// Site auth flags (PUBLIC_VIEWING, PASSWORD_MANAGEMENT, ...) fall back to STRICT_AUTH, which is on by default.
beforeEach(async () => {
  await seedRoles();
  await grantRole(admin._id, 'admin');
});

afterEach(() => {
  config.strictAuth = originalStrictAuth;
});

describe('User routes', () => {
  describe('POST /v2/users', () => {
    let newUser;

    beforeEach(() => {
      newUser = {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
      };
    });

    test('should return 201 and successfully create new user if data is ok', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .post('/v2/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toMatchObject({ id: expect.any(String), name: newUser.name, email: newUser.email });

      const dbUser = await User.findById(res.body.id);
      expect(dbUser).not.toBeNull();
      expect(dbUser.password).not.toBe(newUser.password);
      expect(dbUser.name).toBe(newUser.name);
      expect(dbUser.email).toBe(newUser.email);
      expect(dbUser.email_verified).toBe(false);
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app).post('/v2/users').send(newUser).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if logged in user is not admin', async () => {
      await insertUsers([userOne]);

      await request(app)
        .post('/v2/users')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newUser)
        .expect(httpStatus.FORBIDDEN);

      expect(await User.countDocuments({ email: newUser.email })).toBe(0);
    });

    test('should return 400 error if email is invalid', async () => {
      await insertUsers([admin]);
      newUser.email = 'invalidEmail';

      await request(app)
        .post('/v2/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if email is already used', async () => {
      await insertUsers([admin, userOne]);
      newUser.email = userOne.email;

      await request(app)
        .post('/v2/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if password length is less than 8 characters', async () => {
      await insertUsers([admin]);
      newUser.password = 'passwo1';

      await request(app)
        .post('/v2/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if role is neither user nor admin', async () => {
      await insertUsers([admin]);
      newUser.role = 'invalid';

      await request(app)
        .post('/v2/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v2/users', () => {
    // Fixed names make the sort/filter assertions deterministic (the fixtures use random names).
    const alice = { ...userOne, name: 'Alice One' };
    const bob = { ...userTwo, name: 'Bob Two' };
    const carol = { ...admin, name: 'Carol Admin' };

    beforeEach(async () => {
      await insertUsers([alice, bob, carol]);
    });

    test('should return 200 and the public fields of all users with the default query options', async () => {
      const res = await request(app)
        .get('/v2/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: config.constraints.defaultPageSize,
        totalPages: 1,
        totalResults: 3,
      });
      expect(res.body.results).toHaveLength(3);
      expect(res.body.results).toEqual(
        expect.arrayContaining([
          { id: alice._id.toHexString(), name: alice.name },
          { id: bob._id.toHexString(), name: bob.name },
          { id: carol._id.toHexString(), name: carol.name },
        ]),
      );
    });

    test('should return 200 with only the public fields for a regular user', async () => {
      const res = await request(app)
        .get('/v2/users')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.totalResults).toBe(3);
      res.body.results.forEach((user) => {
        expect(user).not.toHaveProperty('email');
        expect(user).not.toHaveProperty('password');
      });
    });

    test('should return 200 and the full details of users if includeFullDetails is set by an admin', async () => {
      const res = await request(app)
        .get('/v2/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ includeFullDetails: true, name: alice.name })
        .expect(httpStatus.OK);

      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0]).not.toHaveProperty('password');
      expect(res.body.results[0]).toMatchObject({ id: alice._id.toHexString(), name: alice.name, email: alice.email });
    });

    test('should return 403 if a non-admin asks for the full details of users', async () => {
      await request(app)
        .get('/v2/users')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .query({ includeFullDetails: true })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 401 if access token is missing and public viewing is disabled', async () => {
      await request(app).get('/v2/users').expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 200 without an access token if public viewing is enabled', async () => {
      config.strictAuth = false;

      const res = await request(app).get('/v2/users').expect(httpStatus.OK);

      expect(res.body.totalResults).toBe(3);
    });

    test('should correctly apply filter on name field', async () => {
      const res = await request(app)
        .get('/v2/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ name: alice.name })
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: config.constraints.defaultPageSize,
        totalPages: 1,
        totalResults: 1,
      });
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].id).toBe(alice._id.toHexString());
    });

    test('should correctly apply the search param on name and email', async () => {
      const res = await request(app)
        .get('/v2/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ search: 'bOb' })
        .expect(httpStatus.OK);

      expect(res.body.totalResults).toBe(1);
      expect(res.body.results[0].id).toBe(bob._id.toHexString());
    });

    test('should correctly sort the returned array if descending sort param is specified', async () => {
      const res = await request(app)
        .get('/v2/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ sortBy: 'name:desc' })
        .expect(httpStatus.OK);

      expect(res.body.results.map((user) => user.id)).toEqual([
        carol._id.toHexString(),
        bob._id.toHexString(),
        alice._id.toHexString(),
      ]);
    });

    test('should correctly sort the returned array if ascending sort param is specified', async () => {
      const res = await request(app)
        .get('/v2/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ sortBy: 'name:asc' })
        .expect(httpStatus.OK);

      expect(res.body.results.map((user) => user.id)).toEqual([
        alice._id.toHexString(),
        bob._id.toHexString(),
        carol._id.toHexString(),
      ]);
    });

    test('should limit returned array if limit param is specified', async () => {
      const res = await request(app)
        .get('/v2/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ sortBy: 'name:asc', limit: 2 })
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 1,
        limit: 2,
        totalPages: 2,
        totalResults: 3,
      });
      expect(res.body.results.map((user) => user.id)).toEqual([alice._id.toHexString(), bob._id.toHexString()]);
    });

    test('should return the correct page if page and limit params are specified', async () => {
      const res = await request(app)
        .get('/v2/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ sortBy: 'name:asc', page: 2, limit: 2 })
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        results: expect.any(Array),
        page: 2,
        limit: 2,
        totalPages: 2,
        totalResults: 3,
      });
      expect(res.body.results.map((user) => user.id)).toEqual([carol._id.toHexString()]);
    });
  });

  describe('GET /v2/users/self', () => {
    test('should return 200 and the full user object of the caller', async () => {
      await insertUsers([userOne, userTwo]);

      const res = await request(app)
        .get('/v2/users/self')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toMatchObject({ id: userOne._id.toHexString(), name: userOne.name, email: userOne.email });
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app).get('/v2/users/self').expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /v2/users/:userId', () => {
    test('should return 200 and the public user object if data is ok', async () => {
      await insertUsers([userOne]);

      const res = await request(app)
        .get(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toEqual({ id: userOne._id.toHexString(), name: userOne.name });
    });

    test('should return 200 and the full user object if the user asks for their own full details', async () => {
      await insertUsers([userOne]);

      const res = await request(app)
        .get(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .query({ includeFullDetails: true })
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toMatchObject({ id: userOne._id.toHexString(), name: userOne.name, email: userOne.email });
    });

    test('should return 401 error if access token is missing and public viewing is disabled', async () => {
      await insertUsers([userOne]);

      await request(app).get(`/v2/users/${userOne._id}`).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 200 and only the public fields of another user', async () => {
      await insertUsers([userOne, userTwo]);

      const res = await request(app)
        .get(`/v2/users/${userTwo._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toEqual({ id: userTwo._id.toHexString(), name: userTwo.name });
    });

    test('should return 403 error if user is trying to get the full details of another user', async () => {
      await insertUsers([userOne, userTwo]);

      await request(app)
        .get(`/v2/users/${userTwo._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .query({ includeFullDetails: true })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 200 and the full user object if admin is trying to get the full details of another user', async () => {
      await insertUsers([userOne, admin]);

      const res = await request(app)
        .get(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .query({ includeFullDetails: true })
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({ id: userOne._id.toHexString(), email: userOne.email });
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await insertUsers([admin]);

      await request(app)
        .get('/v2/users/invalidId')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if user is not found', async () => {
      await insertUsers([admin]);

      await request(app)
        .get(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /v2/users/:userId', () => {
    test('should return 204 and delete the user if admin is trying to delete another user', async () => {
      await insertUsers([userOne, admin]);

      await request(app)
        .delete(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbUser = await User.findById(userOne._id);
      expect(dbUser).toBeNull();
    });

    test('should return 401 error if access token is missing', async () => {
      await insertUsers([userOne]);

      await request(app).delete(`/v2/users/${userOne._id}`).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 error if a non-admin user is trying to delete another user', async () => {
      await insertUsers([userOne, userTwo]);

      await request(app)
        .delete(`/v2/users/${userTwo._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.FORBIDDEN);

      expect(await User.findById(userTwo._id)).not.toBeNull();
    });

    test('should return 403 error if a non-admin user is trying to delete themselves', async () => {
      await insertUsers([userOne]);

      await request(app)
        .delete(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.FORBIDDEN);

      expect(await User.findById(userOne._id)).not.toBeNull();
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await insertUsers([admin]);

      await request(app)
        .delete('/v2/users/invalidId')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if user already is not found', async () => {
      await insertUsers([admin]);

      await request(app)
        .delete(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /v2/users/self', () => {
    test('should return 200 and successfully update the caller if data is ok', async () => {
      await insertUsers([userOne]);
      const updateBody = {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
      };

      const res = await request(app)
        .patch('/v2/users/self')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toMatchObject({ id: userOne._id.toHexString(), name: updateBody.name, email: updateBody.email });

      const dbUser = await User.findById(userOne._id);
      expect(dbUser.name).toBe(updateBody.name);
      expect(dbUser.email).toBe(updateBody.email);
    });

    test('should return 200 and hash the new password if password management is enabled', async () => {
      config.strictAuth = false;
      await insertUsers([userOne]);

      await request(app)
        .patch('/v2/users/self')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ password: 'newPassword1' })
        .expect(httpStatus.OK);

      const dbUser = await User.findById(userOne._id);
      expect(dbUser.password).not.toBe('newPassword1');
      expect(await dbUser.isPasswordMatch('newPassword1')).toBe(true);
    });

    test('should return 403 if password management is disabled and a password is sent', async () => {
      await insertUsers([userOne]);

      await request(app)
        .patch('/v2/users/self')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ password: 'newPassword1' })
        .expect(httpStatus.FORBIDDEN);

      const dbUser = await User.findById(userOne._id);
      expect(await dbUser.isPasswordMatch(userOne.password)).toBe(true);
    });

    test('should return 401 error if access token is missing', async () => {
      await insertUsers([userOne]);

      await request(app).patch('/v2/users/self').send({ name: faker.person.fullName() }).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 if the body is empty', async () => {
      await insertUsers([userOne]);

      await request(app)
        .patch('/v2/users/self')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({})
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is invalid', async () => {
      await insertUsers([userOne]);

      await request(app)
        .patch('/v2/users/self')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ email: 'invalidEmail' })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is already taken', async () => {
      await insertUsers([userOne, userTwo]);

      await request(app)
        .patch('/v2/users/self')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ email: userTwo.email })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should not return 400 if email is my email', async () => {
      await insertUsers([userOne]);

      await request(app)
        .patch('/v2/users/self')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ email: userOne.email })
        .expect(httpStatus.OK);
    });

    test('should return 400 if password length is less than 8 characters', async () => {
      config.strictAuth = false;
      await insertUsers([userOne]);

      await request(app)
        .patch('/v2/users/self')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ password: 'passwo1' })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if the new password is the same as the current one', async () => {
      config.strictAuth = false;
      await insertUsers([userOne]);

      await request(app)
        .patch('/v2/users/self')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ password: userOne.password })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('PATCH /v2/users/:userId', () => {
    test('should return 200 and successfully update user if admin is updating another user', async () => {
      await insertUsers([userOne, admin]);
      const updateBody = {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
      };

      const res = await request(app)
        .patch(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body).not.toHaveProperty('password');
      expect(res.body).toMatchObject({ id: userOne._id.toHexString(), name: updateBody.name, email: updateBody.email });

      const dbUser = await User.findById(userOne._id);
      expect(dbUser.name).toBe(updateBody.name);
      expect(dbUser.email).toBe(updateBody.email);
    });

    test('should return 401 error if access token is missing', async () => {
      await insertUsers([userOne]);

      await request(app)
        .patch(`/v2/users/${userOne._id}`)
        .send({ name: faker.person.fullName() })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 if a non-admin user is updating another user', async () => {
      await insertUsers([userOne, userTwo]);

      await request(app)
        .patch(`/v2/users/${userTwo._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ name: faker.person.fullName() })
        .expect(httpStatus.FORBIDDEN);

      expect((await User.findById(userTwo._id)).name).toBe(userTwo.name);
    });

    test('should return 403 if a non-admin user is updating themselves (they use /v2/users/self instead)', async () => {
      await insertUsers([userOne]);

      await request(app)
        .patch(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ name: faker.person.fullName() })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 404 if admin is updating another user that is not found', async () => {
      await insertUsers([admin]);

      await request(app)
        .patch(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: faker.person.fullName() })
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 400 error if userId is not a valid mongo id', async () => {
      await insertUsers([admin]);

      await request(app)
        .patch('/v2/users/invalidId')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: faker.person.fullName() })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is invalid', async () => {
      await insertUsers([userOne, admin]);

      await request(app)
        .patch(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ email: 'invalidEmail' })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if email is already taken', async () => {
      await insertUsers([userOne, userTwo, admin]);

      await request(app)
        .patch(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ email: userTwo.email })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should not return 400 if email is the user email', async () => {
      await insertUsers([userOne, admin]);

      await request(app)
        .patch(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ email: userOne.email })
        .expect(httpStatus.OK);
    });

    test('should return 400 if password length is less than 8 characters', async () => {
      await insertUsers([userOne, admin]);

      await request(app)
        .patch(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ password: 'passwo1' })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 if the body is empty', async () => {
      await insertUsers([userOne, admin]);

      await request(app)
        .patch(`/v2/users/${userOne._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({})
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});
