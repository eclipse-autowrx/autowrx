// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const express = require('express');
const config = require('../../../config/config');
const { proxyHandler } = require('../../../config/proxyHandler');
const auth = require('../../../middlewares/auth');

const {
  services: { genAI },
} = config;

const router = express.Router();

router.use(auth());

const proxyMiddleware = genAI.url
  ? createProxyMiddleware({
      target: genAI.url,
      changeOrigin: true,
      on: {
        proxyReq: fixRequestBody,
        proxyRes: (proxyRes, _req, res) => {
          // Handle SSE streaming responses
          if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
            const { flush } = res;
            if (typeof flush === 'function') {
              proxyRes.on('data', () => {
                setImmediate(() => {
                  flush.call(res);
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
