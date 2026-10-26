// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Exercise routes, validation, controllers, services, schemas and BSON serialization.
// Only database I/O and unrelated dependencies are replaced, so no MongoDB is needed.
jest.mock('../../../src/models', () => ({
  Model: jest.requireActual('../../../src/models/model.model'),
  ExtendedApi: jest.requireActual('../../../src/models/extendedApi.model'),
}));
jest.mock('../../../src/services', () => ({ userService: { getUserById: jest.fn() } }));
jest.mock('../../../src/services/prototype.service', () => ({}));
jest.mock('../../../src/services/customApiSet.service', () => ({}));
jest.mock('../../../src/services/permission.service', () => ({
  canAccessModel: jest.fn(),
  hasPermission: jest.fn(),
}));
jest.mock('../../../src/sync', () => ({
  runWithSkipSync: (fn) => fn(),
  triggerSync: jest.fn(),
}));
jest.mock('../../../src/middlewares/auth', () => () => (req, _res, next) => {
  req.user = { id: '507f1f77bcf86cd799439011' };
  next();
});
jest.mock('../../../src/middlewares/permission', () => ({ checkPermission: () => (_req, _res, next) => next() }));
jest.mock('../../../src/controllers', () => ({
  modelController: jest.requireActual('../../../src/controllers/model.controller'),
}));

const httpMocks = require('node-mocks-http');
const { EventEmitter } = require('events');
const mongoose = require('mongoose');
const services = require('../../../src/services');
const modelService = require('../../../src/services/model.service');
const apiService = require('../../../src/services/api.service');
const extendedApiService = require('../../../src/services/extendedApi.service');
const permissionService = require('../../../src/services/permission.service');
const config = require('../../../src/config/config');
const { Model, ExtendedApi } = require('../../../src/models');
const standard = require('../../../data/v6.0.json');

Object.assign(services, { modelService, apiService, extendedApiService, permissionService });
const modelRoute = require('../../../src/routes/v2/vehicle-data/model.route');

const request = () => {
  const build = (method, url) => {
    let body;
    return {
      send(value) {
        body = value;
        return this;
      },
      expect(status) {
        return new Promise((resolve, reject) => {
          const parsed = new URL(url, 'http://localhost');
          const req = httpMocks.createRequest({
            method,
            url: parsed.pathname.replace('/models', '') || '/',
            query: Object.fromEntries(parsed.searchParams),
            body: body ? JSON.parse(JSON.stringify(body)) : {},
          });
          const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
          res.on('end', () => {
            try {
              const responseBody = JSON.parse(JSON.stringify(res._getData()));
              expect({ status: res.statusCode, body: responseBody }).toMatchObject({ status });
              resolve({ body: responseBody });
            } catch (error) {
              reject(error);
            }
          });
          modelRoute.handle(req, res, (err) => {
            res.status(err?.statusCode || 500).send({ message: err?.message || 'Route not found' });
          });
        });
      },
    };
  };
  return { get: (url) => build('GET', url), post: (url) => build('POST', url), patch: (url) => build('PATCH', url) };
};

const fixture = {
  Vehicle: {
    description: 'Custom root description',
    uuid: 'root-uuid',
    type: 'branch',
    'x-vendor': { z: 1, a: 2, empty: {} },
    children: {
      Zebra: { uuid: 'custom-uuid', type: 'x-custom', 'x-vendor': 'retained', comment: '', children: {} },
      Alpha: { type: 'sensor', datatype: 'float', description: 'Alpha' },
      'Dotted.Name': { type: 'x-custom', instances: ['one', 'two'] },
      Empty: { type: 'branch', children: { Value: { type: 'sensor', datatype: 'float' } } },
    },
  },
};
const clone = (value) => JSON.parse(JSON.stringify(value));
const bsonRoundTrip = (value) => mongoose.mongo.BSON.deserialize(mongoose.mongo.BSON.serialize(value));
const modelBody = { name: 'Custom VSS', main_api: 'Vehicle', api_data_url: '/custom.json' };
const wishlist = { apiName: 'Vehicle.New.Wanted', type: 'sensor', datatype: 'float', isWishlist: true };

let storedModel;
let storedApis;

beforeEach(() => {
  storedModel = null;
  storedApis = [];
  services.userService.getUserById.mockResolvedValue({ role: 'admin' });
  permissionService.canAccessModel.mockResolvedValue(true);
  permissionService.hasPermission.mockResolvedValue(true);
  jest.spyOn(global, 'fetch').mockImplementation(async () => ({ ok: true, json: async () => clone(fixture) }));
  jest.spyOn(Model, 'findOne').mockResolvedValue(null);
  jest.spyOn(Model, 'create').mockImplementation(async (body) => {
    const model = new Model(body);
    await model.validate();
    storedModel = bsonRoundTrip(model.toObject());
    return model;
  });
  jest.spyOn(Model, 'findById').mockImplementation(() => {
    const model = storedModel ? Model.hydrate(bsonRoundTrip(storedModel)) : null;
    if (model) {
      model.save = async () => {
        await model.validate();
        storedModel = bsonRoundTrip(model.toObject());
        return model;
      };
    }
    const query = Promise.resolve(model);
    query.lean = async () => (model ? model.toObject() : null);
    query.populate = () => query;
    return query;
  });
  jest.spyOn(ExtendedApi, 'find').mockImplementation(() => {
    const rows = storedApis.map((api) => ExtendedApi.hydrate(api));
    const query = Promise.resolve(rows);
    query.lean = async () => rows.map((row) => row.toObject());
    return query;
  });
  jest.spyOn(ExtendedApi, 'findOne').mockResolvedValue(null);
  jest.spyOn(ExtendedApi, 'create').mockImplementation(async (body) => {
    const api = new ExtendedApi(body);
    await api.validate();
    storedApis.push(bsonRoundTrip(api.toObject()));
    return api;
  });
  jest.spyOn(ExtendedApi, 'deleteMany').mockImplementation(async () => {
    storedApis = [];
  });
});

const expectRawExport = async (id, expected = fixture) => {
  const response = await request().get(`/models/${id}/api?raw=true`).expect(200);
  expect(response.body).toEqual(expected);
  expect(JSON.stringify(response.body)).toBe(JSON.stringify(expected));
};

describe('VSS import URL restrictions', () => {
  let originalAllowlist;

  beforeEach(() => {
    originalAllowlist = process.env.VSS_DATA_URL_ALLOWLIST;
    process.env.VSS_DATA_URL_ALLOWLIST = ' EXAMPLE.COM, , vss.example.org ';
  });

  afterEach(() => {
    if (originalAllowlist === undefined) delete process.env.VSS_DATA_URL_ALLOWLIST;
    else process.env.VSS_DATA_URL_ALLOWLIST = originalAllowlist;
  });

  test('relative paths are fetched from the configured backend origin', async () => {
    await modelService.processApiDataUrl('/d/custom.json?version=1');
    expect(fetch).toHaveBeenCalledWith(`http://localhost:${config.port}/d/custom.json?version=1`);
  });

  test.each(['//evil.com/x', '/d/../custom.json', '/d/a..json', '/\\evil.com/x', '/d\\custom.json', '/@evil.com/x'])(
    'rejects unsafe relative path %s before fetching',
    async (url) => {
      await expect(modelService.processApiDataUrl(url)).rejects.toMatchObject({ statusCode: 400 });
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  test('allowlisted HTTPS URLs use the configured hostname and preserve path and query', async () => {
    await modelService.processApiDataUrl('https://EXAMPLE.com/d/custom.json?version=1#ignored');
    expect(fetch).toHaveBeenCalledWith('https://example.com/d/custom.json?version=1');
  });

  test('allowlisted HTTPS URLs preserve an explicit port', async () => {
    await modelService.processApiDataUrl('https://vss.example.org:8443/custom.json');
    expect(fetch).toHaveBeenCalledWith('https://vss.example.org:8443/custom.json');
  });

  test.each([
    'https://evil.com/custom.json',
    'https://sub.example.com/custom.json',
    'https://example.com.evil.com/custom.json',
    'https://example.com@evil.com/custom.json',
    'http://example.com/custom.json',
    'not a URL',
  ])('rejects external URL %s before fetching', async (url) => {
    await expect(modelService.processApiDataUrl(url)).rejects.toMatchObject({ statusCode: 400 });
    expect(fetch).not.toHaveBeenCalled();
  });

  test('external URLs are rejected when no allowlist is configured', async () => {
    delete process.env.VSS_DATA_URL_ALLOWLIST;
    await expect(modelService.processApiDataUrl('https://example.com/custom.json')).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  test.each(['localhost', '127.0.0.1', '10.0.0.1', '192.168.1.1', '172.16.0.1', '169.254.169.254', '0.0.0.0', '[::1]'])(
    'rejects internal host %s even when allowlisted',
    async (host) => {
      process.env.VSS_DATA_URL_ALLOWLIST = host;
      await expect(modelService.processApiDataUrl(`https://${host}/custom.json`)).rejects.toMatchObject({ statusCode: 400 });
      expect(fetch).not.toHaveBeenCalled();
    },
  );
});

describe('lossless custom VSS import/export', () => {
  test('create stores the custom base privately and raw export preserves all fields and key order', async () => {
    const response = await request().post('/models').send(modelBody).expect(201);
    expect(response.body).not.toHaveProperty('custom_vss');
    expect(storedModel.custom_vss).toEqual(fixture);
    expect(storedApis).toEqual([]);
    await expectRawExport(response.body.id);
  });

  test('replace-api preserves the custom base and deletes the previous extended rows', async () => {
    const response = await request().post('/models').send(modelBody).expect(201);
    await extendedApiService.createExtendedApi({ ...wishlist, model: response.body.id });
    await request().post(`/models/${response.body.id}/replace-api`).send({ api_data_url: '/custom.json' }).expect(200);
    expect(storedApis).toEqual([]);
    await expectRawExport(response.body.id);
  });

  test('ZIP cvi imports preserve the base and separately posted wishlist rows', async () => {
    const response = await request()
      .post('/models')
      .send({ name: 'ZIP VSS', main_api: 'Vehicle', cvi: JSON.stringify(fixture), extended_apis: [wishlist] })
      .expect(201);
    expect(storedModel.custom_vss).toEqual(fixture);
    expect(storedApis).toHaveLength(1);
    const exported = await request().get(`/models/${response.body.id}/api?raw=true`).expect(200);
    expect(exported.body.Vehicle.children.New.children.Wanted.isWishlist).toBe(true);
    delete exported.body.Vehicle.children.New;
    expect(JSON.stringify(exported.body)).toBe(JSON.stringify(fixture));
  });

  test('ZIP cvi alone exports identically', async () => {
    const response = await request()
      .post('/models')
      .send({ name: 'ZIP VSS', main_api: 'Vehicle', api_version: null, cvi: JSON.stringify(fixture) })
      .expect(201);
    await expectRawExport(response.body.id);
  });

  test('non-raw output still refines nodes without mutating the stored base', async () => {
    const response = await request().post('/models').send(modelBody).expect(201);
    const exported = await request().get(`/models/${response.body.id}/api`).expect(200);
    expect(exported.body.Vehicle).toMatchObject({ name: 'Vehicle', id: expect.any(String) });
    expect(exported.body.Vehicle.children.Zebra).toMatchObject({
      name: 'Vehicle.Zebra',
      id: expect.any(String),
      description: 'nan',
      datatype: 'string',
    });
    expect(exported.body.Vehicle.children.Empty.children.Value).toMatchObject({ datatype: 'float' });
    await expectRawExport(response.body.id);
  });

  test('wishlist overlay is nested, skips base collisions, and leaves the base intact', async () => {
    const response = await request().post('/models').send(modelBody).expect(201);
    await extendedApiService.createExtendedApi({ ...wishlist, model: response.body.id });
    await extendedApiService.createExtendedApi({ ...wishlist, apiName: 'Vehicle.Zebra', model: response.body.id });
    const exported = await request().get(`/models/${response.body.id}/api?raw=true`).expect(200);
    expect(exported.body.Vehicle.children.New.children.Wanted).toMatchObject(wishlist);
    expect(exported.body.Vehicle.children.Zebra).toEqual(fixture.Vehicle.children.Zebra);
    expect(storedModel.custom_vss).toEqual(fixture);
  });

  test('empty branches are rejected before creating a model', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ Vehicle: { type: 'branch' } }) });
    const response = await request().post('/models').send(modelBody).expect(400);
    expect(response.body.message).toContain('Vehicle: branch must contain children');
    expect(Model.create).not.toHaveBeenCalled();
  });

  test('imported wishlist nodes become validated ExtendedApi rows', async () => {
    const data = clone(fixture);
    data.Vehicle.children.Wanted = { type: 'sensor', datatype: 'float', isWishlist: true };
    fetch.mockResolvedValue({ ok: true, json: async () => clone(data) });
    const response = await request().post('/models').send(modelBody).expect(201);
    expect(storedModel.custom_vss).toEqual(fixture);
    expect(storedApis).toHaveLength(1);
    expect(storedApis[0].apiName).toBe('Vehicle.Wanted');
    const exported = await request().get(`/models/${response.body.id}/api?raw=true`).expect(200);
    expect(exported.body.Vehicle.children.Wanted.isWishlist).toBe(true);
  });

  test('invalid wishlist nodes are rejected before create or replace mutates data', async () => {
    const response = await request().post('/models').send(modelBody).expect(201);
    const before = clone(storedModel.custom_vss);
    const data = clone(fixture);
    data.Vehicle.children.Invalid = { type: 'sensor', isWishlist: true };
    fetch.mockResolvedValue({ ok: true, json: async () => clone(data) });
    await request().post('/models').send(modelBody).expect(400);
    await request().post(`/models/${response.body.id}/replace-api`).send({ api_data_url: '/custom.json' }).expect(400);
    expect(storedModel.custom_vss).toEqual(before);
  });

  test('standard imports store the version without a custom tree or flattened rows', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => clone(standard) });
    const response = await request().post('/models').send(modelBody).expect(201);
    expect(storedModel.api_version).toBe('v6.0');
    expect(storedModel.custom_vss).toBeNull();
    expect(storedApis).toEqual([]);
    await expectRawExport(response.body.id, standard);
  });

  test('replacing a custom API with a standard version clears custom_vss', async () => {
    const response = await request().post('/models').send(modelBody).expect(201);
    fetch.mockResolvedValue({ ok: true, json: async () => clone(standard) });
    await request().post(`/models/${response.body.id}/replace-api`).send({ api_data_url: '/v6.0.json' }).expect(200);
    expect(storedModel.api_version).toBe('v6.0');
    expect(storedModel.custom_vss).toBeNull();
    await expectRawExport(response.body.id, standard);
  });

  test('raw=false retains refinement and invalid raw query values are rejected', async () => {
    const response = await request().post('/models').send(modelBody).expect(201);
    const exported = await request().get(`/models/${response.body.id}/api?raw=false`).expect(200);
    expect(exported.body.Vehicle.name).toBe('Vehicle');
    await request().get(`/models/${response.body.id}/api?raw=invalid`).expect(400);
  });

  test('raw export retains the model access check', async () => {
    permissionService.canAccessModel.mockResolvedValue(false);
    await request().get('/models/507f1f77bcf86cd799439012/api?raw=true').expect(403);
  });

  test('model lists exclude the custom tree even when selected explicitly', async () => {
    const aggregate = jest.spyOn(Model, 'aggregate').mockReturnValue({ exec: async () => [] });
    await modelService.queryModels({}, { fields: 'custom_vss,name' }, {}, null);
    expect(aggregate).toHaveBeenCalledWith(expect.arrayContaining([{ $project: { custom_vss: 0 } }]));
  });

  test('wishlist paths cannot modify Object.prototype', async () => {
    const response = await request().post('/models').send(modelBody).expect(201);
    await extendedApiService.createExtendedApi({
      ...wishlist,
      apiName: 'Vehicle.__proto__.polluted',
      model: response.body.id,
    });
    const exported = await request().get(`/models/${response.body.id}/api?raw=true`).expect(200);
    expect(Object.prototype).not.toHaveProperty('polluted');
    expect(exported.body.Vehicle.children).toHaveProperty('__proto__.children.polluted.isWishlist', true);
  });

  test('malformed cvi nodes return 400 without creating a model', async () => {
    await request()
      .post('/models')
      .send({ name: 'Bad ZIP', main_api: 'Vehicle', cvi: '{"Vehicle":{"children":{"Bad":null}}}' })
      .expect(400);
    expect(Model.create).not.toHaveBeenCalled();
  });

  test('oversized URL and ZIP imports return 400 before creating a model', async () => {
    const data = { Vehicle: { type: 'branch', description: 'é'.repeat(6 * 1024 * 1024) } };
    fetch.mockResolvedValue({ ok: true, json: async () => data });
    await request().post('/models').send(modelBody).expect(400);
    await request()
      .post('/models')
      .send({ name: 'ZIP VSS', main_api: 'Vehicle', cvi: JSON.stringify(data) })
      .expect(400);
    expect(Model.create).not.toHaveBeenCalled();
  });
});

describe('VSS preflight and write validation', () => {
  test('preflight accepts valid objects and strings without writes', async () => {
    await request().post('/models/validate-vss').send({ spec: fixture }).expect(204);
    await request()
      .post('/models/validate-vss')
      .send({ spec: JSON.stringify(fixture) })
      .expect(204);
    expect(Model.create).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  test('preflight reports the failing path', async () => {
    const response = await request()
      .post('/models/validate-vss')
      .send({ spec: { Vehicle: { type: 'branch', children: { Cabin: { type: 'branch' } } } } })
      .expect(400);
    expect(response.body.message).toBe('Invalid VSS at Vehicle.Cabin: branch must contain children.');
  });
  test('inline data cannot bypass validation using api_version', async () => {
    await request()
      .post('/models')
      .send({ name: 'Bad', main_api: 'Vehicle', api_version: 'v6.0', cvi: JSON.stringify({ Vehicle: { type: 'branch' } }) })
      .expect(400);
    expect(Model.create).not.toHaveBeenCalled();
  });
  test('failed replacement preserves model and API rows', async () => {
    const response = await request().post('/models').send(modelBody).expect(201);
    await extendedApiService.createExtendedApi({ ...wishlist, model: response.body.id });
    const previousModel = clone(storedModel);
    const previousApis = clone(storedApis);
    fetch.mockResolvedValue({ ok: true, json: async () => ({ Vehicle: { type: 'branch' } }) });
    await request().post(`/models/${response.body.id}/replace-api`).send({ api_data_url: '/bad.json' }).expect(400);
    expect(clone(storedModel)).toEqual(previousModel);
    expect(clone(storedApis)).toEqual(previousApis);
    expect(ExtendedApi.deleteMany).not.toHaveBeenCalled();
  });
  test('failed full-spec update preserves the model', async () => {
    const response = await request().post('/models').send(modelBody).expect(201);
    const previous = clone(storedModel);
    await request()
      .patch(`/models/${response.body.id}`)
      .send({ cvi: JSON.stringify({ Vehicle: { type: 'branch' } }) })
      .expect(400);
    expect(clone(storedModel)).toEqual(previous);
  });
});
