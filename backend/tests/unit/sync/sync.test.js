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

const http = require('http');
const axios = require('axios');
const {
  middleware,
  triggerSync,
  runWithSkipSync,
  SYNC_WARNING_HEADER,
  encodeSyncWarningHeader,
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

  /** Assert Node accepts the header value (reproduces ERR_INVALID_CHAR if unsafe). */
  function assertNodeAcceptsHeader(value) {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        try {
          res.setHeader(SYNC_WARNING_HEADER, value);
          res.statusCode = 200;
          res.end('ok');
        } catch (err) {
          reject(err);
        }
      });
      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        http
          .get(`http://127.0.0.1:${port}/`, (res) => {
            res.resume();
            res.on('end', () => {
              server.close(() => resolve());
            });
          })
          .on('error', (err) => {
            server.close(() => reject(err));
          });
      });
    });
  }

  test('attaches EXTERNAL_SYNC_DEVICE_TOKEN and sets proxy:false by default', async () => {
    mockHandlerSync.mockResolvedValue(undefined);

    await runInMiddleware('POST', async () => {
      await triggerSync({ ...baseEvent });
    });

    expect(axios.create).toHaveBeenCalledTimes(1);
    expect(createdAxiosConfig.headers).toEqual({
      Authorization: 'Bearer test-sync-token',
    });
    // Default EXTERNAL_SYNC_USE_PROXY=false → bypass corp proxy for internal GenAI.
    expect(createdAxiosConfig.proxy).toBe(false);
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
    const decoded = decodeURIComponent(responseHeaders[SYNC_WARNING_HEADER]);
    const warnings = JSON.parse(decoded);
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

  test('F1: non-latin1 model name + sync failure does not throw ERR_INVALID_CHAR', async () => {
    const err = new Error('échec synchronisation — endpoint unreachable');
    err.code = 'ECONNREFUSED';
    mockHandlerSync.mockRejectedValue(err);

    const { responseHeaders } = await runInMiddleware('POST', async () => {
      const result = await triggerSync({
        ...baseEvent,
        document: { name: 'テスト車両モデル' },
      });
      expect(result.success).toBe(false);
    });

    const raw = responseHeaders[SYNC_WARNING_HEADER];
    expect(raw).toBeDefined();
    for (let i = 0; i < raw.length; i += 1) {
      expect(raw.charCodeAt(i)).toBeLessThanOrEqual(255);
    }
    await expect(assertNodeAcceptsHeader(raw)).resolves.toBeUndefined();

    const warnings = JSON.parse(decodeURIComponent(raw));
    expect(warnings[0].resourceLabel).toContain('テスト車両モデル');
  });

  test('F1: encodeSyncWarningHeader percent-encodes and caps length', () => {
    const encoded = encodeSyncWarningHeader([
      {
        action: 'CREATE',
        resourceType: 'Model',
        resourceId: 'x',
        resourceLabel: 'Model "Modèle — sport 🚗"',
        status: 500,
        message: 'échec',
      },
    ]);
    expect(encoded).toMatch(/^[%0-9A-Za-z._~-]+$/);
    expect(encoded.length).toBeLessThanOrEqual(2048);
    expect(() => JSON.parse(decodeURIComponent(encoded))).not.toThrow();
  });

  test('F2: triggerSync returns failure object when handler rejects (does not throw)', async () => {
    mockHandlerSync.mockRejectedValue(new Error('handler boom'));

    await expect(
      runInMiddleware('POST', async () => {
        const result = await triggerSync({ ...baseEvent });
        expect(result).toEqual({ success: false, message: expect.any(String) });
      }),
    ).resolves.toBeDefined();
  });
});
