// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const config = require('../../config/config');
const { proxyHandler } = require('../../config/proxyHandler');
const { checkPermission } = require('../../middlewares/permission');
const { PERMISSIONS } = require('../../config/roles');
const auth = require('../../middlewares/auth');
const router = require('express').Router();

router.use(auth(), checkPermission(PERMISSIONS.GENERATIVE_AI));

const proxyMiddleware = config.services.genAI.url
  ? createProxyMiddleware({
      target: config.services.genAI.url,
      changeOrigin: true,
      on: {
        proxyReq: fixRequestBody,
        proxyRes: (proxyRes, req, res) => {
          // Handle specific proxy response modifications if needed
          if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
            if (res.flush && typeof res.flush === 'function') {
              proxyRes.on('data', () => {
                setImmediate(() => {
                  res.flush();
                });
              });
            }
          }
        },
      },
    })
  : null;

router.use(proxyHandler('GenAI service', proxyMiddleware));

module.exports = router;
