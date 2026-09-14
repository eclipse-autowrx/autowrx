// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Example external sync handler — GenAI Profiles Management API.
 *
 * Copy to default.handler.js (or replace its contents) when enabling external
 * sync for your deployment.
 *
 * GenAI endpoints (see OpenAPI Profiles Management):
 *   PUT    {EXTERNAL_SYNC_MODEL_URL}/profiles/{name}
 *   DELETE {EXTERNAL_SYNC_MODEL_URL}/profiles/{name}
 *
 * Body for PUT: { name, vss } where vss is the computed AutoWRX VSS tree.
 * Profile name = modelId.
 *
 * When EXTERNAL_SYNC_DEVICE_TOKEN is configured on the backend, the provided
 * axios `http` instance already includes Authorization: Bearer <token>.
 * Outbound calls respect HTTP_PROXY / HTTPS_PROXY when set.
 *
 * Sync is awaited on the request path so X-Sync-Warning can ride the same mutating
 * response (latency may include one outbound call). Single attempt — no retry/queue;
 * local DB write still succeeds; a failed sync can leave the external system behind
 * until a later successful write.
 *
 * @param {Object} event — { action, resourceType, modelId, document, changes, userId }
 * @param {import('axios').AxiosInstance} http
 */

const apiService = require('../src/services/api.service');

const EXTERNAL_SYNC_MODEL_URL =
  process.env.EXTERNAL_SYNC_MODEL_URL || 'http://localhost:5050';

function transformVSSToGenAIFormat(vssTree, profileName) {
  const rootKey = Object.keys(vssTree)[0] || 'Vehicle';
  const rootNode = vssTree[rootKey];
  return {
    name: profileName,
    vss: { [rootKey]: rootNode },
  };
}

function profileUrl(modelId) {
  const base = String(EXTERNAL_SYNC_MODEL_URL).replace(/\/$/, '');
  return `${base}/profiles/${encodeURIComponent(modelId)}`;
}

async function putProfileFromModel(http, modelId) {
  if (!modelId) return;

  const vssTree = await apiService.computeVSSApi(modelId);
  if (!vssTree || Object.keys(vssTree).length === 0) {
    return;
  }

  const payload = transformVSSToGenAIFormat(vssTree, modelId);
  await http.put(profileUrl(modelId), payload);
}

async function deleteProfile(http, modelId) {
  if (!modelId) return;
  await http.delete(profileUrl(modelId));
}

module.exports = {
  name: 'default',

  async sync(event, http) {
    const { action, resourceType, modelId } = event;
    if (!modelId) return;

    if (resourceType === 'Model' && action === 'DELETE') {
      await deleteProfile(http, String(modelId));
      return;
    }

    if (
      resourceType === 'Model' ||
      resourceType === 'ExtendedApi' ||
      resourceType === 'Api'
    ) {
      await putProfileFromModel(http, String(modelId));
    }
  },
};
