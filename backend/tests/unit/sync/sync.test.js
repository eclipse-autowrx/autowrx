// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

jest.mock('axios');

jest.mock('../../../src/config/config', () => ({
  env: 'test',
  services: {
    sync: {
      external: {
        deviceToken: 'test-sync-token',
        modelUrl: 'http://genai.test',
      },
    },
  },
}));

const mockHandlerSync = jest.fn();

jest.mock('../../../sync-handlers/default.handler.js', () => ({
  name: 'mock-handler',
  sync: (...args) => mockHandlerSync(...args),
}));

const axios = require('axios');
const {
  middleware,
  triggerSync,
  runWithSkipSync,
  SYNC_WARNING_HEADER,
} = require('../../../src/sync');

describe('sync engine', () => {
  let createdAxiosConfig;
  let stubHttp;

  beforeEach(() => {
    jest.clearAllMocks();
    createdAxiosConfig = null;
    stubHttp = {
      put: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    axios.create.mockImplementation((config) => {
      createdAxiosConfig = config;
      return stubHttp;
    });
    mockHandlerSync.mockResolvedValue(undefined);
  });

  const baseEvent = {
    action: 'CREATE',
    resourceType: 'Model',
    resourceId: 'model-1',
    modelId: 'model-1',
    document: { name: 'Test' },
    userId: 'user-1',
  };

  function runInMiddleware(method, fn) {
    const req = { method, user: { id: 'user-1' }, headers: {} };
    const responseHeaders = {};
    const res = {
      set(key, value) {
        responseHeaders[key] = value;
      },
      send(body) {
        return body;
      },
      json(body) {
        return body;
      },
      end() {},
    };

    return new Promise((resolve, reject) => {
      middleware(req, res, () => {
        Promise.resolve()
          .then(() => fn(req, res))
          .then(() => {
            res.json({});
            resolve({ req, res, responseHeaders });
          })
          .catch(reject);
      });
    });
  }

  test('attaches EXTERNAL_SYNC_DEVICE_TOKEN and does not set proxy:false', async () => {
    mockHandlerSync.mockResolvedValue(undefined);

    await runInMiddleware('POST', async () => {
      await triggerSync({ ...baseEvent });
    });

    expect(axios.create).toHaveBeenCalledTimes(1);
    expect(createdAxiosConfig.headers).toEqual({
      Authorization: 'Bearer test-sync-token',
    });
    expect(createdAxiosConfig.proxy).not.toBe(false);
    expect(mockHandlerSync).toHaveBeenCalledTimes(1);
  });

  test('attaches X-Sync-Warning on mutating request when handler fails', async () => {
    const err = new Error('External sync endpoint is unreachable');
    err.code = 'ECONNREFUSED';
    mockHandlerSync.mockRejectedValue(err);

    const { responseHeaders } = await runInMiddleware('POST', async () => {
      const result = await triggerSync({ ...baseEvent });
      expect(result.success).toBe(false);
    });

    expect(responseHeaders[SYNC_WARNING_HEADER]).toBeDefined();
    const warnings = JSON.parse(responseHeaders[SYNC_WARNING_HEADER]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({
      action: 'CREATE',
      resourceType: 'Model',
      resourceId: 'model-1',
    });
    expect(warnings[0].message).toMatch(/unreachable/i);
  });

  test('runWithSkipSync prevents outbound sync', async () => {
    await runInMiddleware('POST', async () => {
      await runWithSkipSync(async () => {
        const result = await triggerSync({ ...baseEvent });
        expect(result.success).toBe(true);
      });
    });

    expect(axios.create).not.toHaveBeenCalled();
    expect(mockHandlerSync).not.toHaveBeenCalled();
  });

  test('does not attach X-Sync-Warning on GET when handler fails', async () => {
    const err = new Error('boom');
    mockHandlerSync.mockRejectedValue(err);

    const { responseHeaders } = await runInMiddleware('GET', async () => {
      await triggerSync({ ...baseEvent });
    });

    expect(responseHeaders[SYNC_WARNING_HEADER]).toBeUndefined();
  });
});
