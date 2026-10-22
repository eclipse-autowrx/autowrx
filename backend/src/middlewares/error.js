// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const mongoose = require('mongoose');
const multer = require('multer');
const httpStatus = require('http-status');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (error instanceof multer.MulterError) {
    // Upload limits / malformed multipart are client errors, not 500s
    const statusCode = error.code === 'LIMIT_FILE_SIZE' ? httpStatus.REQUEST_ENTITY_TOO_LARGE : httpStatus.BAD_REQUEST;
    error = new ApiError(statusCode, error.message, true, err.stack);
  } else if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  // Check if this is a static file request (assets, css, js, etc.)
  // Return appropriate content type instead of JSON to prevent MIME type errors
  if (req.path.startsWith('/assets/') || req.path.endsWith('.css') || req.path.endsWith('.js')) {
    if (req.path.endsWith('.css')) {
      return res.status(statusCode).type('text/css').send(`/* Error: ${message} */`);
    }
    if (req.path.endsWith('.js')) {
      return res.status(statusCode).type('application/javascript').send(`// Error: ${message}`);
    }
    // For other asset types, return plain text
    return res.status(statusCode).type('text/plain').send(`Error: ${message}`);
  }

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};

module.exports = {
  errorConverter,
  errorHandler,
};
