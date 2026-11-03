// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const httpStatus = require('http-status');
const axios = require('axios');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const { redactUrl } = require('../utils/redactUrl');
const { assertSafeOutboundUrl } = require('../utils/assertSafeOutboundUrl');
const { PERMISSIONS, RESOURCES } = require('../config/roles');
const apiService = require('./api.service');
const assetService = require('./asset.service');
const permissionService = require('./permission.service');
const modelService = require('./model.service');
const siteConfigService = require('./siteConfig.service');
const { createForwarder } = require('./externalForward.service');

const ENVIRONMENT_KEYS = new Set(['dev', 'prod', 'staging']);
const DEFAULT_MARKETPLACE_URL = 'https://store-be.digitalauto.tech';
const OUTBOUND_TIMEOUT_MS = 60000;
const OUTBOUND_MAX_CONTENT_BYTES = 5 * 1024 * 1024;
const MAX_VSS_SIGNALS = 2000;
const MAX_VSS_CHARS = 60000;

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
      'Invalid payload. Could not find corresponding model API. Please check payload and profile ID.',
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
    resolved.environment || 'default',
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

/**
 * Flatten a VSS tree (as returned by apiService.computeVSSApi) into leaf signal paths.
 * @param {Record<string, any>} tree
 * @param {number} [maxEntries]
 * @returns {string[]}
 */
const flattenVssPaths = (tree, maxEntries = MAX_VSS_SIGNALS) => {
  const paths = [];
  const walk = (node, path) => {
    if (paths.length >= maxEntries || !node || typeof node !== 'object') {
      return;
    }
    const children = node.children && typeof node.children === 'object' ? Object.entries(node.children) : [];
    if (children.length === 0) {
      paths.push(path);
      return;
    }
    children.forEach(([name, child]) => walk(child, `${path}.${name}`));
  };
  Object.entries(tree || {}).forEach(([name, node]) => walk(node, name));
  return paths.slice(0, maxEntries);
};

/**
 * Append the model's vehicle API signal paths to a system message (CVI grounding).
 * @param {string} systemMessage
 * @param {Record<string, any>|null|undefined} vssTree
 * @returns {string}
 */
const buildGroundedSystemMessage = (systemMessage, vssTree) => {
  const base = systemMessage || '';
  if (!vssTree || Object.keys(vssTree).length === 0) {
    return base;
  }
  const paths = flattenVssPaths(vssTree);
  if (paths.length === 0) {
    return base;
  }
  let list = paths.join('\n');
  if (list.length > MAX_VSS_CHARS) {
    list = list.slice(0, list.lastIndexOf('\n', MAX_VSS_CHARS) > 0 ? list.lastIndexOf('\n', MAX_VSS_CHARS) : MAX_VSS_CHARS);
  }
  return `${base}\n\nVehicle API (VSS) available in this model:\n${list}`;
};

/**
 * Perform an outbound generation request after the SSRF guard. Never leaks the URL or key in errors.
 * @param {import('axios').AxiosRequestConfig} requestConfig
 * @returns {Promise<any>} response data
 */
const callUpstream = async (requestConfig) => {
  await assertSafeOutboundUrl(requestConfig.url);
  try {
    const response = await axios({
      timeout: OUTBOUND_TIMEOUT_MS,
      maxContentLength: OUTBOUND_MAX_CONTENT_BYTES,
      maxBodyLength: OUTBOUND_MAX_CONTENT_BYTES,
      maxRedirects: 0,
      ...requestConfig,
    });
    return response.data;
  } catch (error) {
    logger.warn(
      '[genai] upstream request failed url=%s status=%s code=%s',
      redactUrl(requestConfig.url),
      error.response?.status,
      error.code,
    );
    throw new ApiError(httpStatus.BAD_GATEWAY, 'GenAI upstream request failed');
  }
};

const parseAssetData = (asset) => {
  try {
    const data = typeof asset.data === 'string' ? JSON.parse(asset.data) : asset.data;
    return data && typeof data === 'object' ? data : {};
  } catch (e) {
    return {};
  }
};

const resolveAssetTarget = async (user, assetId) => {
  const asset = await assetService.getAssetById(assetId);
  if (!asset) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
  }
  const canRead = await permissionService.hasPermission(user.id, PERMISSIONS.READ_ASSET, assetId, RESOURCES.ASSET);
  if (!canRead) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  if (asset.type !== 'GENAI-PYTHON') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Asset is not a GenAI generator');
  }
  const data = parseAssetData(asset);
  if (!data.url) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Generator endpoint is not allowed');
  }
  return {
    endpointUrl: data.url,
    apiKey: data.accessToken || '',
    method: data.method || 'POST',
    requestField: data.requestField || 'prompt',
    responseField: data.responseField || 'data',
    samples: '',
  };
};

const resolveMarketplaceTarget = async (type, addonId) => {
  const configured = await siteConfigService.getSiteConfigValue('GENAI_MARKETPLACE_URL');
  const marketplaceUrl = typeof configured === 'string' ? configured.trim() : DEFAULT_MARKETPLACE_URL;
  if (!marketplaceUrl) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Marketplace is not configured');
  }
  const body = await callUpstream({
    method: 'get',
    url: `${marketplaceUrl}/package?type=${encodeURIComponent(type)}&exposeCredentials=true`,
  });
  const entries = Array.isArray(body?.data) ? body.data : [];
  const entry = entries.find(
    (item) => item && item.version && typeof item.version === 'object' && item.version._id === addonId && item.type === type,
  );
  if (!entry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Add-on not found');
  }
  return {
    endpointUrl: entry.version.endpointUrl,
    apiKey: entry.team?.accessKey ? `${entry.team.accessKey}@${entry.team.secretKey}` : entry.version.apiKey,
    method: entry.version.method || 'POST',
    requestField: entry.version.requestField || 'prompt',
    responseField: entry.version.responseField || 'data',
    samples: entry.version.samples || '',
  };
};

/**
 * Generate code through a server-resolved upstream (SDV Copilot, user asset or marketplace add-on).
 * @param {{ user: { id: string }, source: 'sdv-copilot'|'asset'|'marketplace', assetId?: string,
 *   addonId?: string, type: string, prompt: string, systemMessage?: string, modelId?: string }} params
 * @returns {Promise<string>}
 */
const generate = async ({ user, source, assetId, addonId, type, prompt, systemMessage, modelId }) => {
  let target;
  if (source === 'sdv-copilot') {
    const endpoint = await siteConfigService.getSiteConfigValue('GENAI_SDV_APP_ENDPOINT');
    if (!endpoint || typeof endpoint !== 'string' || !endpoint.trim()) {
      throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'GENAI_SDV_APP_ENDPOINT is not configured');
    }
    target = { endpointUrl: endpoint.trim(), samples: '' };
  } else if (source === 'asset') {
    target = await resolveAssetTarget(user, assetId);
  } else {
    target = await resolveMarketplaceTarget(type, addonId);
  }

  let groundedMessage = systemMessage || '';
  if (modelId) {
    // Ground only in models the caller may read (private models require READ_MODEL).
    await modelService.getModelById(modelId, user.id);
    const vssTree = await apiService.computeVSSApi(modelId);
    groundedMessage = buildGroundedSystemMessage(groundedMessage || target.samples, vssTree);
  } else {
    groundedMessage = groundedMessage || target.samples;
  }

  if (source === 'sdv-copilot') {
    const data = await callUpstream({
      method: 'post',
      url: target.endpointUrl,
      data: { systemMessage: groundedMessage, message: prompt },
      headers: { 'Content-Type': 'application/json' },
    });
    return data?.content || data?.data || JSON.stringify(data);
  }

  const headers = { 'Content-Type': 'application/json' };
  if (target.apiKey) {
    headers.Authorization = `${target.apiKey}`;
  }
  const isGet = String(target.method).toLowerCase().trim() === 'get';
  const data = await callUpstream(
    isGet
      ? {
          method: 'get',
          url: `${target.endpointUrl}?${target.requestField}=${encodeURIComponent(prompt)}`,
          headers,
        }
      : {
          method: 'post',
          url: target.endpointUrl,
          data: { systemMessage: groundedMessage, [target.requestField]: prompt },
          headers,
        },
  );
  const content = data?.[target.responseField];
  if (!content) {
    throw new ApiError(httpStatus.BAD_GATEWAY, 'Upstream returned an unexpected response format');
  }
  return typeof content === 'string' ? content : JSON.stringify(content);
};

module.exports = {
  forwarder,
  isConfigured: forwarder.isConfigured,
  transformVSSToGenAIFormat,
  hasProfilePayload,
  resolveGenAIPath,
  resolveGenAIRequest,
  resolveProfilePayload,
  flattenVssPaths,
  buildGroundedSystemMessage,
  generate,
  handle,
};
