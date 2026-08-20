// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const express = require('express');
const httpStatus = require('http-status');
const config = require('../../../config/config');
const { proxyHandler } = require('../../../config/proxyHandler');
const auth = require('../../../middlewares/auth');
const logger = require('../../../config/logger');
const catchAsync = require('../../../utils/catchAsync');
const validate = require('../../../middlewares/validate');
const genaiService = require('../../../services/genai.service');
const serviceTokenService = require('../../../services/serviceToken.service');
const genaiValidation = require('../../../validations/genai.validation');

const router = express.Router();

router.use(auth());

router.use((req, res, next) => {
  logger.info('[genai] %s %s configured=%s', req.method, req.originalUrl, genaiService.isConfigured());
  next();
});

router.get(
  '/token',
  validate(genaiValidation.getServiceToken),
  catchAsync(async (req, res) => {
    const result = await serviceTokenService.issueServiceToken(req.query.service);
    res.send(result);
  })
);

let genaiUrlDeprecationWarned = false;

const warnGenaiUrlDeprecation = () => {
  if (!genaiUrlDeprecationWarned && config.services.genAI.url) {
    genaiUrlDeprecationWarned = true;
    logger.warn(
      'GENAI_URL is deprecated. Configure EXTERNAL_GENAI_URL and EXTERNAL_GENAI_DEVICE_TOKEN on the backend instead of using a genai-proxy sidecar.'
    );
  }
};

const deprecatedProxyMiddleware = config.services.genAI.url
  ? createProxyMiddleware({
      target: config.services.genAI.url,
      changeOrigin: true,
      on: {
        proxyReq: fixRequestBody,
        proxyRes: (proxyRes, _req, res) => {
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

const useDeprecatedProxy = () => !genaiService.isConfigured() && Boolean(deprecatedProxyMiddleware);

const ensureGenAIAvailable = (req, res, next) => {
  if (genaiService.isConfigured()) {
    return next();
  }

  if (useDeprecatedProxy()) {
    warnGenaiUrlDeprecation();
    return proxyHandler('GenAI service', deprecatedProxyMiddleware)(req, res, next);
  }

  return res.status(httpStatus.SERVICE_UNAVAILABLE).json({ message: 'GenAI service is not implemented' });
};

router.use(ensureGenAIAvailable);

router.all(
  '*',
  catchAsync(async (req, res) => {
    await genaiService.handle(req, res);
  })
);

module.exports = router;
