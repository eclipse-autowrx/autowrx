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
 * The backend forwards the user's JWT via the axios `http` instance
 * (Authorization header).
 *
 * Each change triggers one outbound call. Failures are not retried by the
 * backend — the local DB write still succeeds and the frontend shows a warning.
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
