// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

jest.mock('axios', () => {
  const mockAxios = jest.fn();
  mockAxios.default = mockAxios;
  mockAxios.create = jest.fn(() => mockAxios);
  mockAxios.get = jest.fn();
  mockAxios.post = jest.fn();
  mockAxios.isAxiosError = jest.fn(() => false);
  mockAxios.interceptors = { request: { use: jest.fn() }, response: { use: jest.fn() } };
  return mockAxios;
});

const dns = require('dns');
const net = require('net');
const axios = require('axios');
const request = require('supertest');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { roles } = require('../../src/config/roles');
const apiService = require('../../src/services/api.service');
const modelService = require('../../src/services/model.service');
const ApiError = require('../../src/utils/ApiError');
const setupTestDB = require('../utils/setupTestDB');
const { SiteConfig, Asset } = require('../../src/models');
const Role = require('../../src/models/role.model');
const UserRole = require('../../src/models/userRole.model');
const { userOne, userTwo, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken } = require('../fixtures/token.fixture');

setupTestDB();

const SDV_ENDPOINT = 'https://sdv.example.com/generate';

const seedConfig = (key, value) =>
  SiteConfig.create({
    key,
    value,
    scope: 'site',
    valueType: 'string',
    secret: false,
    category: 'genai',
    created_by: userOne._id,
    updated_by: userOne._id,
  });

const grantGenerativeAI = async (user) => {
  const role = await Role.create({
    name: roles.generative_ai_role?.name || 'Generative AI',
    ref: 'generative_ai_role',
    permissions: ['generativeAI'],
  });
  await UserRole.create({ user: user._id, role: role._id });
};

const post = (body, token = userOneAccessToken) => {
  const req = request(app).post('/v2/genai/generate');
  return (token ? req.set('Authorization', `Bearer ${token}`) : req).send(body);
};

const validBody = { source: 'sdv-copilot', type: 'GenAI_Python', prompt: 'make a hello world app' };

describe('POST /v2/genai/generate', () => {
  beforeEach(async () => {
    await insertUsers([userOne, userTwo]);
    axios.mockReset();
    jest
      .spyOn(dns.promises, 'lookup')
      .mockImplementation(async (hostname) => [
        { address: net.isIP(hostname) ? hostname : '93.184.216.34', family: net.isIP(hostname) || 4 },
      ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('authorization', () => {
    test('should return 401 for anonymous requests', async () => {
      await post(validBody, null).expect(httpStatus.UNAUTHORIZED);
      expect(axios).not.toHaveBeenCalled();
    });

    test('should return 403 for an authenticated user without generativeAI', async () => {
      await post(validBody).expect(httpStatus.FORBIDDEN);
      expect(axios).not.toHaveBeenCalled();
    });

    test('should return 200 with { content } for a user with generativeAI', async () => {
      await grantGenerativeAI(userOne);
      await seedConfig('GENAI_SDV_APP_ENDPOINT', SDV_ENDPOINT);
      axios.mockResolvedValue({ data: { content: 'print("hi")' } });

      const res = await post(validBody).expect(httpStatus.OK);

      expect(res.body).toEqual({ content: 'print("hi")' });
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: SDV_ENDPOINT,
          maxRedirects: 0,
          timeout: 60000,
          data: { systemMessage: '', message: validBody.prompt },
        }),
      );
    });
  });

  describe('validation', () => {
    beforeEach(async () => {
      await grantGenerativeAI(userOne);
      await seedConfig('GENAI_SDV_APP_ENDPOINT', SDV_ENDPOINT);
    });

    test('should return 400 for an empty prompt', async () => {
      await post({ ...validBody, prompt: '   ' }).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 for a prompt longer than 20000 characters', async () => {
      await post({ ...validBody, prompt: 'a'.repeat(20001) }).expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 for unknown keys such as endpointUrl', async () => {
      await post({ ...validBody, endpointUrl: 'http://evil.example.com' }).expect(httpStatus.BAD_REQUEST);
      expect(axios).not.toHaveBeenCalled();
    });

    test('should return 400 when assetId is sent for a non-asset source', async () => {
      await post({ ...validBody, assetId: new mongoose.Types.ObjectId().toString() }).expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('asset source', () => {
    beforeEach(async () => {
      await grantGenerativeAI(userOne);
    });

    test('should return 403 when the user cannot read another user asset', async () => {
      const asset = await Asset.create({
        name: 'other',
        type: 'GENAI-PYTHON',
        data: JSON.stringify({ url: 'https://gen.example.com/run' }),
        created_by: userTwo._id,
      });

      await post({ source: 'asset', assetId: asset.id, type: 'GenAI_Python', prompt: 'hi' }).expect(httpStatus.FORBIDDEN);
      expect(axios).not.toHaveBeenCalled();
    });

    test('should return 400 when the asset url targets link-local metadata', async () => {
      const asset = await Asset.create({
        name: 'mine',
        type: 'GENAI-PYTHON',
        data: JSON.stringify({ url: 'http://169.254.169.254/x' }),
        created_by: userOne._id,
      });

      const res = await post({ source: 'asset', assetId: asset.id, type: 'GenAI_Python', prompt: 'hi' }).expect(
        httpStatus.BAD_REQUEST,
      );
      expect(res.body.message).toBe('Generator endpoint is not allowed');
      expect(axios).not.toHaveBeenCalled();
    });

    test('should call the asset endpoint with Authorization and return the response field', async () => {
      const asset = await Asset.create({
        name: 'mine',
        type: 'GENAI-PYTHON',
        data: JSON.stringify({ url: 'https://gen.example.com/run', accessToken: 'secret-key', responseField: 'code' }),
        created_by: userOne._id,
      });
      axios.mockResolvedValue({ data: { code: 'x = 1' } });

      const res = await post({ source: 'asset', assetId: asset.id, type: 'GenAI_Python', prompt: 'hi' }).expect(
        httpStatus.OK,
      );

      expect(res.body).toEqual({ content: 'x = 1' });
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: 'https://gen.example.com/run',
          headers: expect.objectContaining({ Authorization: 'secret-key' }),
          data: { systemMessage: '', prompt: 'hi' },
        }),
      );
    });
  });

  describe('CVI grounding', () => {
    test('should add the model VSS signal paths to the upstream systemMessage when modelId is given', async () => {
      await grantGenerativeAI(userOne);
      await seedConfig('GENAI_SDV_APP_ENDPOINT', SDV_ENDPOINT);
      jest.spyOn(modelService, 'getModelById').mockResolvedValue({});
      jest.spyOn(apiService, 'computeVSSApi').mockResolvedValue({
        Vehicle: {
          type: 'branch',
          children: {
            Speed: { type: 'sensor' },
            Cabin: { type: 'branch', children: { Door: { type: 'branch', children: { IsOpen: { type: 'sensor' } } } } },
          },
        },
      });
      axios.mockResolvedValue({ data: { content: 'ok' } });
      const modelId = new mongoose.Types.ObjectId().toString();

      await post({ ...validBody, modelId, systemMessage: 'Be brief.' }).expect(httpStatus.OK);

      const { data } = axios.mock.calls[0][0];
      expect(apiService.computeVSSApi).toHaveBeenCalledWith(modelId);
      expect(data.systemMessage).toContain('Be brief.');
      expect(data.systemMessage).toContain('Vehicle.Speed');
      expect(data.systemMessage).toContain('Vehicle.Cabin.Door.IsOpen');
    });

    test('should return 403 and skip grounding when the caller cannot read the model', async () => {
      await grantGenerativeAI(userOne);
      await seedConfig('GENAI_SDV_APP_ENDPOINT', SDV_ENDPOINT);
      jest.spyOn(modelService, 'getModelById').mockRejectedValue(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
      const vssSpy = jest.spyOn(apiService, 'computeVSSApi');
      const modelId = new mongoose.Types.ObjectId().toString();

      await post({ ...validBody, modelId }).expect(httpStatus.FORBIDDEN);

      expect(vssSpy).not.toHaveBeenCalled();
      expect(axios).not.toHaveBeenCalled();
    });
  });
});
