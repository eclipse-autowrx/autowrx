// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const apiService = require('./api.service');
const { createForwarder } = require('./externalForward.service');

const ENVIRONMENT_KEYS = new Set(['dev', 'prod', 'staging']);

const forwarder = createForwarder({
  name: 'genai',
  urls: config.services.genAI.external.urls,
  getAuthHeaders: () => {
    const token = config.services.genAI.external.deviceToken;
    if (!token) {
      return null;
    }
    return { Authorization: `Token ${token}` };
  },
  notConfiguredMessage: 'GenAI service is not implemented',
});

/**
 * @param {Record<string, unknown>} vssTree
 * @param {string} profileName
 * @returns {{ name: string, vss: Record<string, unknown> }}
 */
const transformVSSToGenAIFormat = (vssTree, profileName) => {
  const rootKey = Object.keys(vssTree)[0] || 'Vehicle';
  return {
    name: profileName,
    vss: { [rootKey]: vssTree[rootKey] },
  };
};

/**
 * @param {unknown} body
 * @returns {boolean}
 */
const hasProfilePayload = (body) => {
  if (!body || typeof body !== 'object') {
    return false;
  }
  return Boolean(body.vss || body.name);
};

/**
 * Map an inbound `/v2/genai` path to an upstream path on EXTERNAL_GENAI_URL.
 * Query strings are stripped; the host is never taken from the client
 * (see backend/docs/genai-service.md#upstream-url-construction).
 * @param {string} path
 * @returns {{ upstreamPath: string, environment?: string, isGeneration: boolean, profileId?: string }}
 */
const resolveGenAIPath = (path) => {
  const normalizedPath = path.split('?')[0];

  const generationMatch = normalizedPath.match(/^\/generation(?:\/([^/]+))?$/);
  if (generationMatch) {
    const environment = generationMatch[1];
    if (environment && !ENVIRONMENT_KEYS.has(environment)) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
    }
    return {
      upstreamPath: '/generation',
      environment,
      isGeneration: true,
    };
  }

  const profileMatch = normalizedPath.match(/^\/profiles(?:\/([^/]+))?(?:\/([^/]+))?$/);
  if (profileMatch) {
    const [, profileId, maybeEnvironment] = profileMatch;

    if (!profileId) {
      return {
        upstreamPath: '/profiles',
        isGeneration: false,
      };
    }

    if (maybeEnvironment) {
      if (!ENVIRONMENT_KEYS.has(maybeEnvironment)) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
      }
      return {
        upstreamPath: `/profiles/${encodeURIComponent(profileId)}`,
        environment: maybeEnvironment,
        isGeneration: false,
        profileId,
      };
    }

    return {
      upstreamPath: `/profiles/${encodeURIComponent(profileId)}`,
      isGeneration: false,
      profileId,
    };
  }

  return {
    upstreamPath: normalizedPath,
    isGeneration: false,
  };
};

/**
 * @param {import('express').Request} req
 * @returns {{ method: string, upstreamPath: string, environment?: string, isGeneration: boolean, profileId?: string }}
 */
const resolveGenAIRequest = (req) => {
  const requestPath = req.path || req.url.split('?')[0];
  const resolved = resolveGenAIPath(requestPath);

  return {
    method: req.method,
    ...resolved,
  };
};

/**
 * @param {string} profileId
 * @param {unknown} body
 * @returns {Promise<unknown>}
 */
const resolveProfilePayload = async (profileId, body) => {
  if (hasProfilePayload(body)) {
    return body;
  }

  const modelApi = await apiService.computeVSSApi(profileId);
  if (!modelApi || Object.keys(modelApi).length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Invalid payload. Could not find corresponding model API. Please check payload and profile ID.'
    );
  }

  return transformVSSToGenAIFormat(modelApi, profileId);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const handle = async (req, res) => {
  const resolved = resolveGenAIRequest(req);
  logger.info(
    '[genai] resolved method=%s path=%s upstream=%s environment=%s',
    resolved.method,
    req.path || req.url,
    resolved.upstreamPath,
    resolved.environment || 'default'
  );

  if (resolved.isGeneration) {
    if (resolved.method !== 'POST') {
      throw new ApiError(httpStatus.METHOD_NOT_ALLOWED, 'Method not allowed');
    }

    await forwarder.forwardStream({
      method: 'post',
      upstreamPath: resolved.upstreamPath,
      data: req.body,
      environment: resolved.environment,
      req,
      res,
    });
    return;
  }

  if (resolved.method === 'PUT' && resolved.profileId && !hasProfilePayload(req.body)) {
    const payload = await resolveProfilePayload(resolved.profileId, req.body);
    const response = await forwarder.forwardJson({
      method: 'put',
      upstreamPath: resolved.upstreamPath,
      data: payload,
      environment: resolved.environment,
    });
    res.status(response.status).send(response.data);
    return;
  }

  const response = await forwarder.forwardJson({
    method: resolved.method.toLowerCase(),
    upstreamPath: resolved.upstreamPath,
    data: ['GET', 'HEAD', 'DELETE'].includes(resolved.method) ? undefined : req.body,
    environment: resolved.environment,
  });
  res.status(response.status).send(response.data);
};

module.exports = {
  forwarder,
  isConfigured: forwarder.isConfigured,
  transformVSSToGenAIFormat,
  hasProfilePayload,
  resolveGenAIPath,
  resolveGenAIRequest,
  resolveProfilePayload,
  handle,
};
