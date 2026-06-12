// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const axios = require('axios');
const config = require('../../../src/config/config');
const ApiError = require('../../../src/utils/ApiError');

jest.mock('axios');

const aaosService = require('../../../src/services/aaos.service');

describe('AAOS service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('forwardToRust', () => {
    const validPayload = {
      someip: {
        serviceId: '0x4100',
        instanceId: '0x1000',
        operationId: '0x8410',
      },
    };

    test('should abort transmission when serviceId is not valid hex', async () => {
      await expect(
        aaosService.forwardToRust({
          someip: {
            ...validPayload.someip,
            serviceId: 'not-hex',
          },
        }),
      ).rejects.toMatchObject({
        statusCode: httpStatus.BAD_REQUEST,
      });

      expect(axios.post).not.toHaveBeenCalled();
    });

    test('should abort transmission when parseInt would produce a partial parse', async () => {
      await expect(
        aaosService.forwardToRust({
          someip: {
            ...validPayload.someip,
            operationId: '0x8410zz',
          },
        }),
      ).rejects.toBeInstanceOf(ApiError);

      expect(axios.post).not.toHaveBeenCalled();
    });

    test('should abort transmission when someip payload is missing', async () => {
      await expect(aaosService.forwardToRust({})).rejects.toMatchObject({
        statusCode: httpStatus.BAD_REQUEST,
      });

      expect(axios.post).not.toHaveBeenCalled();
    });

    test('should abort transmission when request payload is not an object', async () => {
      await expect(aaosService.forwardToRust(null)).rejects.toMatchObject({
        statusCode: httpStatus.BAD_REQUEST,
      });

      expect(axios.post).not.toHaveBeenCalled();
    });

    test('should abort transmission when request payload is not JSON serializable', async () => {
      const circularPayload = { someip: { ...validPayload.someip } };
      circularPayload.self = circularPayload;

      await expect(aaosService.forwardToRust(circularPayload)).rejects.toMatchObject({
        statusCode: httpStatus.BAD_REQUEST,
      });

      expect(axios.post).not.toHaveBeenCalled();
    });

    test('should reject invalid Rust response payload after transmission', async () => {
      axios.post.mockResolvedValue({ status: 200, data: null });

      await expect(aaosService.forwardToRust(validPayload)).rejects.toMatchObject({
        statusCode: httpStatus.BAD_REQUEST,
      });
    });

    test('should forward a valid SOME/IP payload as decimal Rust config', async () => {
      axios.post.mockResolvedValue({ status: 200, data: { ok: true } });

      await expect(aaosService.forwardToRust(validPayload)).resolves.toEqual({ ok: true });

      expect(axios.post).toHaveBeenCalledWith(
        config.aaos.rustServiceUrl,
        expect.objectContaining({
          service_id: 16640,
          instance_id: 4096,
          event_id: 33808,
          method_id: config.aaos.subscribeMethodId,
          operation: config.aaos.operation,
          ttl_ms: config.aaos.ttlMs,
        }),
        expect.any(Object),
      );
    });
  });

  describe('storeResponseAndBroadcast', () => {
    test('should reject non-object response payloads', () => {
      expect(() => aaosService.storeResponseAndBroadcast(null)).toThrow(ApiError);
    });

    test('should reject non-serializable response payloads', () => {
      const circularPayload = {};
      circularPayload.self = circularPayload;

      expect(() => aaosService.storeResponseAndBroadcast(circularPayload)).toThrow(ApiError);
    });

    test('should store valid response payloads', () => {
      const payload = { vehicleSpeed: 72.5, unit: 'km/h' };

      aaosService.storeResponseAndBroadcast(payload);

      expect(aaosService.getLatestResponse()).toEqual(
        expect.objectContaining({
          payload,
          timestamp: expect.any(String),
        }),
      );
    });
  });
});
