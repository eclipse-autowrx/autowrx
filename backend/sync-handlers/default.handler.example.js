// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Example external sync handler for deployment reference.
 *
 * Copy to default.handler.js (or replace its contents) when enabling external
 * sync for your deployment.
 *
 * Optional env: CLIENT_SYNC_BASE_URL — base URL for your external API.
 *
 * @param {Object} event — { action, resourceType, modelId, document, changes, userId }
 * @param {import('axios').AxiosInstance} http
 */
const EXTERNAL_BASE_URL = process.env.CLIENT_SYNC_BASE_URL || 'http://localhost:5050';

module.exports = {
  name: 'default',

  async sync(event, http) {
    const { action, resourceType, modelId, document, changes } = event;
    const base = `${EXTERNAL_BASE_URL}/models/${modelId}`;

    switch (resourceType) {
      case 'Model': {
        if (action === 'CREATE') {
          await http.post(base, { operation: action, model: document });
        } else if (action === 'UPDATE') {
          await http.patch(base, { operation: action, model: document, diff: changes });
        } else if (action === 'DELETE') {
          await http.delete(base, { data: { operation: action, model: document } });
        }
        break;
      }
      case 'ExtendedApi': {
        if (action === 'BULK_REPLACE') {
          await http.post(`${base}/apis/replace`, {
            operation: action,
            model: document?.model,
            extendedApis: document?.extendedApis,
            diff: changes,
          });
          break;
        }
        const apiName = encodeURIComponent(document?.apiName || 'unknown');
        const url = `${base}/extended-apis/${apiName}`;
        if (action === 'CREATE') {
          await http.post(url, { operation: action, api: document });
        } else if (action === 'UPDATE') {
          await http.patch(url, { operation: action, api: document, diff: changes });
        } else if (action === 'DELETE') {
          await http.delete(url, { data: { operation: action, api: document } });
        }
        break;
      }
      case 'Api': {
        const url = `${base}/cvi`;
        if (action === 'CREATE' || action === 'UPDATE') {
          await http.put(url, { operation: action, cvi: document });
        } else if (action === 'DELETE') {
          await http.delete(url, { data: { operation: action, cvi: document } });
        }
        break;
      }
      default:
        break;
    }
  },
};
