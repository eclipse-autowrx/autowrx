// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const express = require('express');
const config = require('../../config/config');
const auth = require('../../middlewares/auth');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const { proxyHandler } = require('../../config/proxyHandler');

const router = express.Router();

router.use(
  auth({
    optional: !config.strictAuth,
  })
);

const proxyMiddleware = config.services.homologation.url
  ? createProxyMiddleware({
      target: config.services.homologation.url,
      changeOrigin: true,
      on: {
        proxyReq: fixRequestBody,
      },
    })
  : null;

router.use(proxyHandler('Homologation service', proxyMiddleware));

module.exports = router;
