// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('./config');
const httpStatus = require('http-status');
const logger = require('./logger');

const setupProxy = (app) => {
  // File upload is now handled directly by the backend
  // No proxy needed for /v2/file
};

/**
 *
 * @param {string} name
 * @param {import('http-proxy-middleware').RequestHandler | null} [proxy]
 * @returns
 */
const proxyHandler =
  (name, proxy) =>
  /**
   * @param {import('http').IncomingMessage} req
   * @param {import('http').ServerResponse} res
   */
  (req, res, next) => {
    if (!proxy) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `${name} is not implemented` });
    }

    return proxy(req, res, (err) => {
      if (err) {
        logger.error(`Proxy error for ${name}: %o`, err?.message || err);
      }
    });
  };

module.exports.setupProxy = setupProxy;
module.exports.proxyHandler = proxyHandler;
