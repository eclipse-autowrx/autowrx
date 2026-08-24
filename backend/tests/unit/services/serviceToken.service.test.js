// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

jest.mock('axios');

const axios = require('axios');
const httpStatus = require('http-status');
const { issueServiceToken, issueAzureSpeechToken } = require('../../../src/services/serviceToken.service');

describe('serviceToken.service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('issueServiceToken', () => {
    test('throws 400 for unknown service', async () => {
      await expect(issueServiceToken('unknown')).rejects.toMatchObject({
        statusCode: httpStatus.BAD_REQUEST,
        message: 'Unknown service',
      });
    });
  });

  describe('issueAzureSpeechToken', () => {
    test('throws 503 when key or region is missing', async () => {
      delete process.env.AZURE_SPEECH_SDK_KEY;
      delete process.env.AZURE_SPEECH_KEY;
      delete process.env.AZURE_SPEECH_SDK_REGION;
      delete process.env.AZURE_SPEECH_REGION;

      await expect(issueAzureSpeechToken()).rejects.toMatchObject({
        statusCode: httpStatus.SERVICE_UNAVAILABLE,
        message: 'Azure Speech Services not configured',
      });
    });

    test('returns STS token and region on success', async () => {
      process.env.AZURE_SPEECH_SDK_KEY = 'test-key';
      process.env.AZURE_SPEECH_SDK_REGION = 'eastus';
      axios.post.mockResolvedValue({ data: 'sts-token-value' });

      const result = await issueAzureSpeechToken();

      expect(result).toEqual({
        service: 'azure-speech',
        token: 'sts-token-value',
        region: 'eastus',
      });
      expect(axios.post).toHaveBeenCalledWith(
        'https://eastus.api.cognitive.microsoft.com/sts/v1.0/issueToken',
        null,
        expect.objectContaining({
          headers: { 'Ocp-Apim-Subscription-Key': 'test-key' },
          proxy: false,
        })
      );
    });

    test('throws 502 when STS returns empty body', async () => {
      process.env.AZURE_SPEECH_SDK_KEY = 'test-key';
      process.env.AZURE_SPEECH_SDK_REGION = 'eastus';
      axios.post.mockResolvedValue({ data: '' });

      await expect(issueAzureSpeechToken()).rejects.toMatchObject({
        statusCode: httpStatus.BAD_GATEWAY,
        message: 'Failed to fetch Azure Speech token',
      });
    });

    test('throws 502 when STS request fails', async () => {
      process.env.AZURE_SPEECH_SDK_KEY = 'test-key';
      process.env.AZURE_SPEECH_SDK_REGION = 'eastus';
      axios.post.mockRejectedValue(new Error('network error'));

      await expect(issueAzureSpeechToken()).rejects.toMatchObject({
        statusCode: httpStatus.BAD_GATEWAY,
        message: 'Failed to fetch Azure Speech token',
      });
    });
  });
});
