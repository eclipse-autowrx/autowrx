// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Container healthcheck probe: GET /v2/health/ready on the local server.
// Plain Node so it doesn't depend on curl/wget being present in the image.
// Exits 0 on HTTP 200, 1 on anything else (non-200, error, timeout).

const http = require('http');

const PORT = process.env.PORT || 3200;
const TIMEOUT_MS = 3000;

const req = http.get({ host: '127.0.0.1', port: PORT, path: '/v2/health/ready', timeout: TIMEOUT_MS }, (res) => {
  res.resume();
  process.exit(res.statusCode === 200 ? 0 : 1);
});

req.on('timeout', () => req.destroy(new Error(`request timed out after ${TIMEOUT_MS}ms`)));
req.on('error', () => process.exit(1));
