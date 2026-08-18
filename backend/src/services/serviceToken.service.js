// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const axios = require('axios');
const httpStatus = require('http-status');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const AZURE_SPEECH = 'azure-speech';

/**
 * Mint a short-lived Azure Speech authorization token.
 * If STS is unreachable, fall back to returning the subscription key.
 * @returns {Promise<{service: string, token: string, region: string, auth: 'authorization' | 'subscription'}>}
 * @throws {ApiError} 503 if key/region not configured
 */
const issueAzureSpeechToken = async () => {
  const azureKey = process.env.AZURE_SPEECH_SDK_KEY || process.env.AZURE_SPEECH_KEY;
  const azureRegion = process.env.AZURE_SPEECH_SDK_REGION || process.env.AZURE_SPEECH_REGION;

  if (!azureKey || !azureRegion) {
    logger.warn(
      '[serviceToken] Azure Speech not configured: hasKey=%s hasRegion=%s',
      Boolean(azureKey),
      Boolean(azureRegion)
    );
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Azure Speech Services not configured');
  }

  const subscriptionResult = {
    service: AZURE_SPEECH,
    token: azureKey,
    region: azureRegion,
    auth: 'subscription',
  };

  try {
    const tokenUrl = `https://${azureRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
    const response = await axios.post(tokenUrl, null, {
      headers: {
        'Ocp-Apim-Subscription-Key': azureKey,
      },
      proxy: false,
    });

    if (!response.data) {
      logger.warn('[serviceToken] Empty STS response, falling back to subscription key');
      return subscriptionResult;
    }

    return {
      service: AZURE_SPEECH,
      token: response.data,
      region: azureRegion,
      auth: 'authorization',
    };
  } catch (error) {
    logger.warn(
      '[serviceToken] STS issueToken failed (code=%s message=%s); falling back to subscription key',
      error?.code || 'n/a',
      error.message
    );
    return subscriptionResult;
  }
};

const ISSUERS = {
  [AZURE_SPEECH]: issueAzureSpeechToken,
};

const SUPPORTED_SERVICES = Object.keys(ISSUERS);

/**
 * Issue a short-lived token for a configured backend service.
 * @param {string} service
 * @returns {Promise<{service: string, token: string, region?: string}>}
 */
const issueServiceToken = async (service) => {
  logger.info('[serviceToken] Issuing token for service=%s', service);
  const issuer = ISSUERS[service];
  if (!issuer) {
    logger.info('[serviceToken] Unknown service=%s', service);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Unknown service');
  }
  const result = await issuer();
  logger.info(
    '[serviceToken] Issued token for service=%s region=%s auth=%s',
    result.service,
    result.region || 'n/a',
    result.auth || 'n/a'
  );
  return result;
};

module.exports = {
  AZURE_SPEECH,
  SUPPORTED_SERVICES,
  issueAzureSpeechToken,
  issueServiceToken,
};
