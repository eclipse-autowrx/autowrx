// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const crypto = require('crypto');
const helmet = require('helmet');

const createSecurityHeaders = (config) => {
  const development = config.env === 'development';
  const { csp } = config;
  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      reportOnly: !development && csp.mode === 'report-only',
      directives: development
        ? {
            defaultSrc: ['*'],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", '*'],
            styleSrc: ["'self'", "'unsafe-inline'", '*'],
            imgSrc: ['*', 'data:', 'blob:'],
            connectSrc: ['*', 'ws:', 'wss:'],
            fontSrc: ['*', 'data:'],
            objectSrc: ["'none'"],
            mediaSrc: ['*'],
            frameSrc: ['*'],
            workerSrc: ["'self'", 'blob:'],
          }
        : {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            objectSrc: ["'none'"],
            scriptSrc: ["'self'", (_req, res) => `'nonce-${res.locals.cspNonce}'`, ...csp.scriptOrigins],
            scriptSrcAttr: ["'none'"],
            // React, Fluent UI and Monaco generate style elements and style attributes.
            // This exception permits CSS only; inline JavaScript remains forbidden.
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'blob:', ...csp.imageOrigins],
            fontSrc: ["'self'", 'data:'],
            connectSrc: ["'self'", ...csp.connectOrigins],
            frameSrc: ["'self'", ...csp.frameOrigins],
            frameAncestors: ["'self'"],
            formAction: ["'self'"],
            mediaSrc: ["'self'", 'blob:', ...csp.mediaOrigins],
            workerSrc: ["'self'"],
            reportUri: ['/v2/security/csp-reports'],
            upgradeInsecureRequests: config.env === 'production' ? [] : null,
          },
    },
  });
};

const cspNonce = (_req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(24).toString('base64');
  next();
};

module.exports = { createSecurityHeaders, cspNonce };
