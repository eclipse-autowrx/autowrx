// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const morgan = require('morgan');
const config = require('./config');
const logger = require('./logger');
const { redactUrl } = require('../utils/redactUrl');

morgan.token('message', (req, res) => res.locals.errorMessage || '');
// Log URLs with secret query values (reset/verify tokens, codes, ...) redacted.
morgan.token('safe-url', (req) => redactUrl(req.originalUrl || req.url));

const getIpFormat = () => (config.env === 'production' ? ':remote-addr - ' : '');
const successResponseFormat = `${getIpFormat()}:method :safe-url :status - :response-time ms`;
const errorResponseFormat = `${getIpFormat()}:method :safe-url :status - :response-time ms - message: :message`;

const successHandler = morgan(successResponseFormat, {
  skip: (req, res) => res.statusCode >= 400,
  stream: { write: (message) => logger.info(message.trim()) },
});

const errorHandler = morgan(errorResponseFormat, {
  skip: (req, res) => res.statusCode < 400,
  stream: { write: (message) => logger.error(message.trim()) },
});

module.exports = {
  successHandler,
  errorHandler,
};
