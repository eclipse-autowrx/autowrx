// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Default external sync handler — no-op placeholder (always succeeds).
 *
 * Replace this file per deployment to call your external API when
 * Model / ExtendedApi / Api data changes. Copy from default.handler.example.js
 * as a starting point.
 *
 * When EXTERNAL_SYNC_DEVICE_TOKEN is configured on the backend, the axios
 * `http` instance includes Authorization: Bearer <token> for outbound sync
 * requests. Outbound calls respect HTTP_PROXY / HTTPS_PROXY when set.
 *
 * Sync is awaited on the request path so failures can surface as X-Sync-Warning
 * on the same mutating response (save/create/delete may wait on one outbound call).
 *
 * Single attempt — no retry/queue. Failures are not retried; the local DB write
 * still succeeds and the frontend shows a warning toast. A failed sync means the
 * external system can miss that change until a later successful write.
 *
 * @param {Object} event — { action, resourceType, modelId, document, changes, userId }
 * @param {import('axios').AxiosInstance} http
 */
module.exports = {
  name: 'default',

  async sync(_event, _http) {
    // No-op — replace this file per deployment.
  },
};
