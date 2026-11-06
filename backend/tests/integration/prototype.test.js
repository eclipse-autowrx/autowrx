// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { Prototype } = require('../../src/models');
const { userOne, userTwo, admin, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken, userTwoAccessToken, adminAccessToken } = require('../fixtures/token.fixture');
const { seedRoles, grantRole } = require('../fixtures/role.fixture');
const { insertModel } = require('../fixtures/model.fixture');

setupTestDB();

const insertPrototype = (model, overrides = {}) =>
  Prototype.create({ name: 'Existing prototype', model_id: model._id, created_by: model.created_by, ...overrides });

// userOne owns every model below; userTwo is a stranger unless a test grants a role.
describe('Prototype routes', () => {
  let privateModel;

  beforeEach(async () => {
    await seedRoles();
    await insertUsers([userOne, userTwo, admin]);
    await grantRole(admin._id, 'admin');
    privateModel = await insertModel({ created_by: userOne._id, visibility: 'private' });
  });

  describe('POST /v2/prototypes', () => {
    test('should return 201 and persist the prototype for the model owner', async () => {
      const res = await request(app)
        .post('/v2/prototypes')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ name: 'Owner prototype', model_id: privateModel.id })
        .expect(httpStatus.CREATED);

      const dbPrototype = await Prototype.findById(res.body.id);
      expect(dbPrototype).not.toBeNull();
      expect(String(dbPrototype.created_by)).toBe(String(userOne._id));
      expect(String(dbPrototype.model_id)).toBe(privateModel.id);
    });

    test('should return 201 for a stranger on an editable model', async () => {
      const editableModel = await insertModel({ created_by: userOne._id, visibility: 'editable' });

      await request(app)
        .post('/v2/prototypes')
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .send({ name: 'Stranger prototype', model_id: editableModel.id })
        .expect(httpStatus.CREATED);
    });

    test.each(['public', 'private'])('should return 403 for a stranger on a %s model', async (visibility) => {
      const model = await insertModel({ created_by: userOne._id, visibility });

      await request(app)
        .post('/v2/prototypes')
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .send({ name: 'Stranger prototype', model_id: model.id })
        .expect(httpStatus.FORBIDDEN);

      expect(await Prototype.countDocuments()).toBe(0);
    });

    test('should return 401 without an access token', async () => {
      await request(app)
        .post('/v2/prototypes')
        .send({ name: 'Anonymous prototype', model_id: privateModel.id })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 when name is missing', async () => {
      await request(app)
        .post('/v2/prototypes')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ model_id: privateModel.id })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 when model_id is missing', async () => {
      await request(app)
        .post('/v2/prototypes')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ name: 'No model' })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 when the name is already used in the same model', async () => {
      await insertPrototype(privateModel);

      const res = await request(app)
        .post('/v2/prototypes')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ name: 'Existing prototype', model_id: privateModel.id })
        .expect(httpStatus.BAD_REQUEST);

      expect(res.body.message).toMatch(/already in use/);
      expect(await Prototype.countDocuments()).toBe(1);
    });
  });

  describe('GET /v2/prototypes/:id', () => {
    let prototype;

    beforeEach(async () => {
      prototype = await insertPrototype(privateModel);
    });

    test('should return 200 for the owner', async () => {
      const res = await request(app)
        .get(`/v2/prototypes/${prototype.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toMatchObject({ id: prototype.id, name: 'Existing prototype' });
    });

    test('should return 403 for a stranger on a private model', async () => {
      await request(app)
        .get(`/v2/prototypes/${prototype.id}`)
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 200 for a stranger granted model_member on the model', async () => {
      await grantRole(userTwo._id, 'model_member', privateModel._id);

      await request(app)
        .get(`/v2/prototypes/${prototype.id}`)
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .expect(httpStatus.OK);
    });

    test('should return 404 for an unknown id', async () => {
      await request(app)
        .get(`/v2/prototypes/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 400 for a malformed id', async () => {
      await request(app)
        .get('/v2/prototypes/not-an-id')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v2/prototypes', () => {
    test('should hide prototypes of private models from a stranger', async () => {
      const publicModel = await insertModel({ created_by: userOne._id, visibility: 'public' });
      await insertPrototype(privateModel, { name: 'Private one' });
      await insertPrototype(publicModel, { name: 'Public one' });

      const res = await request(app)
        .get('/v2/prototypes')
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.results.map((p) => p.name)).toEqual(['Public one']);
    });

    test('should return 403 when a stranger filters by an unreadable private model', async () => {
      await request(app)
        .get('/v2/prototypes')
        .query({ model_id: privateModel.id })
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should list private-model prototypes for the owner', async () => {
      await insertPrototype(privateModel, { name: 'Private one' });

      const res = await request(app)
        .get('/v2/prototypes')
        .query({ model_id: privateModel.id })
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.results).toHaveLength(1);
    });
  });

  describe('PATCH /v2/prototypes/:id', () => {
    let prototype;

    beforeEach(async () => {
      prototype = await insertPrototype(privateModel);
    });

    test('should return 200 and update the prototype for the owner', async () => {
      await request(app)
        .patch(`/v2/prototypes/${prototype.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ name: 'Renamed', code: 'print(1)' })
        .expect(httpStatus.OK);

      expect(await Prototype.findById(prototype.id)).toMatchObject({ name: 'Renamed', code: 'print(1)' });
    });

    test('should return 200 for a model_contributor on the model', async () => {
      await grantRole(userTwo._id, 'model_contributor', privateModel._id);

      await request(app)
        .patch(`/v2/prototypes/${prototype.id}`)
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .send({ name: 'Contributor edit' })
        .expect(httpStatus.OK);
    });

    test('should return 403 for a stranger', async () => {
      await request(app)
        .patch(`/v2/prototypes/${prototype.id}`)
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .send({ name: 'Hijacked' })
        .expect(httpStatus.FORBIDDEN);

      expect((await Prototype.findById(prototype.id)).name).toBe('Existing prototype');
    });

    test('should return 200 for a model_member (read-only) on a public prototype', async () => {
      await grantRole(userTwo._id, 'model_member', privateModel._id);

      await request(app)
        .patch(`/v2/prototypes/${prototype.id}`)
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .send({ name: 'Reader edit' })
        .expect(httpStatus.OK);
    });

    test('should return 404 for an unknown id', async () => {
      await request(app)
        .patch(`/v2/prototypes/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({ name: 'Ghost' })
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('Prototype visibility', () => {
    let publicModel;

    beforeEach(async () => {
      publicModel = await insertModel({ created_by: userOne._id, visibility: 'public' });
    });

    const createAs = (token, body, path = '/v2/prototypes') =>
      request(app).post(path).set('Authorization', `Bearer ${token}`).send(body).expect(httpStatus.CREATED);

    test('should create new prototypes as private', async () => {
      const res = await createAs(userOneAccessToken, { name: 'New one', model_id: publicModel.id });

      expect((await Prototype.findById(res.body.id)).visibility).toBe('private');
    });

    test('should create bulk prototypes as private', async () => {
      const res = await createAs(
        userOneAccessToken,
        [{ name: 'Bulk one', model_id: publicModel.id }],
        '/v2/prototypes/bulk',
      );

      expect((await Prototype.findById(res.body[0])).visibility).toBe('private');
    });

    test('should treat prototypes without a visibility as public', async () => {
      const legacy = await insertPrototype(publicModel, { name: 'Legacy' });

      await request(app)
        .get(`/v2/prototypes/${legacy.id}`)
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .expect(httpStatus.OK);
    });

    describe('private prototype', () => {
      let prototype;

      beforeEach(async () => {
        // userTwo creates it on userOne's model (userTwo = creator, userOne = model owner).
        await grantRole(userTwo._id, 'model_contributor', publicModel._id);
        prototype = await insertPrototype(publicModel, { name: 'Secret', created_by: userTwo._id, visibility: 'private' });
      });

      test.each([
        ['creator', () => userTwoAccessToken],
        ['model owner', () => userOneAccessToken],
        ['admin', () => adminAccessToken],
      ])('should be readable and editable by the %s', async (_role, token) => {
        await request(app)
          .get(`/v2/prototypes/${prototype.id}`)
          .set('Authorization', `Bearer ${token()}`)
          .expect(httpStatus.OK);
        await request(app)
          .patch(`/v2/prototypes/${prototype.id}`)
          .set('Authorization', `Bearer ${token()}`)
          .send({ code: 'print(2)' })
          .expect(httpStatus.OK);
      });

      describe('for others', () => {
        let otherToken;

        beforeEach(async () => {
          // Hand the prototype to another creator so userTwo is only a model contributor.
          await Prototype.updateOne({ _id: prototype._id }, { created_by: admin._id });
          otherToken = userTwoAccessToken;
        });

        test('should hide it from a model contributor on GET by id', async () => {
          await request(app)
            .get(`/v2/prototypes/${prototype.id}`)
            .set('Authorization', `Bearer ${otherToken}`)
            .expect(httpStatus.FORBIDDEN);
        });

        test('should hide it from a model contributor in the list and search', async () => {
          const list = await request(app)
            .get('/v2/prototypes')
            .query({ model_id: publicModel.id })
            .set('Authorization', `Bearer ${otherToken}`)
            .expect(httpStatus.OK);
          expect(list.body.results).toHaveLength(0);

          const search = await request(app)
            .get('/v2/search')
            .query({ q: 'Secret' })
            .set('Authorization', `Bearer ${otherToken}`)
            .expect(httpStatus.OK);
          expect(search.body.prototypes).toHaveLength(0);
        });

        test('should return 403 on PATCH and DELETE for a model contributor', async () => {
          await request(app)
            .patch(`/v2/prototypes/${prototype.id}`)
            .set('Authorization', `Bearer ${otherToken}`)
            .send({ code: 'print(3)' })
            .expect(httpStatus.FORBIDDEN);
          await request(app)
            .delete(`/v2/prototypes/${prototype.id}`)
            .set('Authorization', `Bearer ${otherToken}`)
            .expect(httpStatus.FORBIDDEN);
          expect(await Prototype.findById(prototype.id)).not.toBeNull();
        });
      });
    });

    describe('public prototype', () => {
      let prototype;

      beforeEach(async () => {
        prototype = await insertPrototype(publicModel, { name: 'Shared', visibility: 'public' });
      });

      test('should be listed for a stranger', async () => {
        const res = await request(app)
          .get('/v2/prototypes')
          .query({ model_id: publicModel.id })
          .set('Authorization', `Bearer ${userTwoAccessToken}`)
          .expect(httpStatus.OK);

        expect(res.body.results.map((p) => p.name)).toEqual(['Shared']);
      });

      test('should be editable by any signed-in user', async () => {
        await request(app)
          .patch(`/v2/prototypes/${prototype.id}`)
          .set('Authorization', `Bearer ${userTwoAccessToken}`)
          .send({ code: 'print(4)' })
          .expect(httpStatus.OK);

        expect((await Prototype.findById(prototype.id)).code).toBe('print(4)');
      });

      test('should return 403 when a stranger changes the visibility', async () => {
        await request(app)
          .patch(`/v2/prototypes/${prototype.id}`)
          .set('Authorization', `Bearer ${userTwoAccessToken}`)
          .send({ visibility: 'private' })
          .expect(httpStatus.FORBIDDEN);

        expect((await Prototype.findById(prototype.id)).visibility).toBe('public');
      });

      test('should return 403 when a stranger sets editors_choice', async () => {
        await request(app)
          .patch(`/v2/prototypes/${prototype.id}`)
          .set('Authorization', `Bearer ${userTwoAccessToken}`)
          .send({ editors_choice: true })
          .expect(httpStatus.FORBIDDEN);
      });

      test('should return 403 when a stranger deletes it', async () => {
        await request(app)
          .delete(`/v2/prototypes/${prototype.id}`)
          .set('Authorization', `Bearer ${userTwoAccessToken}`)
          .expect(httpStatus.FORBIDDEN);
      });

      test('should let the creator switch it to private and back', async () => {
        for (const visibility of ['private', 'public']) {
          // eslint-disable-next-line no-await-in-loop
          await request(app)
            .patch(`/v2/prototypes/${prototype.id}`)
            .set('Authorization', `Bearer ${userOneAccessToken}`)
            .send({ visibility })
            .expect(httpStatus.OK);
          // eslint-disable-next-line no-await-in-loop
          expect((await Prototype.findById(prototype.id)).visibility).toBe(visibility);
        }
      });

      test('should return 400 for an unknown visibility value', async () => {
        await request(app)
          .patch(`/v2/prototypes/${prototype.id}`)
          .set('Authorization', `Bearer ${userOneAccessToken}`)
          .send({ visibility: 'editable' })
          .expect(httpStatus.BAD_REQUEST);
      });
    });
  });

  describe('DELETE /v2/prototypes/:id', () => {
    let prototype;

    beforeEach(async () => {
      prototype = await insertPrototype(privateModel);
    });

    test('should return 204 and delete the prototype for the owner', async () => {
      await request(app)
        .delete(`/v2/prototypes/${prototype.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      expect(await Prototype.findById(prototype.id)).toBeNull();
    });

    test('should return 403 for a stranger and keep the prototype', async () => {
      await request(app)
        .delete(`/v2/prototypes/${prototype.id}`)
        .set('Authorization', `Bearer ${userTwoAccessToken}`)
        .expect(httpStatus.FORBIDDEN);

      expect(await Prototype.findById(prototype.id)).not.toBeNull();
    });

    test('should return 204 for a global admin', async () => {
      await request(app)
        .delete(`/v2/prototypes/${prototype.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      expect(await Prototype.findById(prototype.id)).toBeNull();
    });
  });
});
