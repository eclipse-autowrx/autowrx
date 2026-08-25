// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const axios = require('axios');
const httpStatus = require('http-status');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

/**
 * @param {{
 *   name: string,
 *   urls: Record<string, string | undefined>,
 *   getAuthHeaders: () => Record<string, string>,
 *   notConfiguredMessage?: string,
 * }} options
 */
const createForwarder = ({ name, urls, getAuthHeaders, notConfiguredMessage = 'Service is not implemented' }) => {
  const logPrefix = `[${name}]`;

  const isConfigured = () => Boolean(urls?.default && getAuthHeaders());

  /**
   * @param {string} [environment]
   * @returns {string}
   */
  const getBaseUrl = (environment) => {
    const key = environment || 'default';
    const baseUrl = urls[key] || urls.default;

    if (!baseUrl) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Invalid environment: ${environment || 'default'}`);
    }

    return baseUrl;
  };

  /**
   * @param {unknown} error
   * @returns {never}
   */
  const handleAxiosError = (error, url) => {
    logger.warn(
      '%s Upstream request failed: url=%s code=%s message=%s',
      logPrefix,
      url || 'unknown',
      error?.code || 'n/a',
      error?.message || error
    );

    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(error.response.status, error.response.data);
    }

    if (axios.isAxiosError(error) && error.request) {
      throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'No response received from server');
    }

    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
  };

  /**
   * @param {import('express').Response} res
   * @param {unknown} error
   * @param {(res: import('express').Response, error: unknown) => void} [onError]
   */
  const writeSseError = (res, error, onError) => {
    if (res.destroyed) {
      return;
    }

    if (onError) {
      onError(res, error);
      return;
    }

    const message = error?.message || 'Error while streaming response';
    logger.error('%s Stream error: %s', logPrefix, message);

    try {
      res.write(`data: ${JSON.stringify({ code: 502, message })}\n\n`);
    } catch (writeError) {
      logger.error('%s Failed to write SSE error: %s', logPrefix, writeError?.message || writeError);
    }

    res.end();
  };

  /**
   * @param {{
   *   method: import('axios').Method,
   *   upstreamPath: string,
   *   data?: unknown,
   *   environment?: string,
   * }} options
   * @returns {Promise<import('axios').AxiosResponse>}
   */
  const forwardJson = async ({ method, upstreamPath, data, environment }) => {
    if (!isConfigured()) {
      throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, notConfiguredMessage);
    }

    const baseUrl = getBaseUrl(environment);
    const url = `${baseUrl}${upstreamPath.startsWith('/') ? upstreamPath : `/${upstreamPath}`}`;

    logger.info('%s Forwarding %s %s environment=%s', logPrefix, method, url, environment || 'default');

    try {
      const response = await axios({
        method,
        url,
        data,
        headers: getAuthHeaders(),
        responseType: 'json',
        validateStatus: () => true,
        proxy: false,
      });

      if (response.status >= 400) {
        throw new ApiError(response.status, response.data);
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      return handleAxiosError(error, url);
    }
  };

  /**
   * @param {{
   *   method: import('axios').Method,
   *   upstreamPath: string,
   *   data?: unknown,
   *   environment?: string,
   *   req: import('express').Request,
   *   res: import('express').Response,
   *   initialSseMessage?: Record<string, unknown>,
   *   onError?: (res: import('express').Response, error: unknown) => void,
   * }} options
   * @returns {Promise<void>}
   */
  const forwardStream = async ({
    method,
    upstreamPath,
    data,
    environment,
    req,
    res,
    initialSseMessage = { message: '' },
    onError,
  }) => {
    if (!isConfigured()) {
      throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, notConfiguredMessage);
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();
    res.write(`data: ${JSON.stringify(initialSseMessage)}\n\n`);

    const abortController = new AbortController();

    req.on('close', () => {
      logger.debug('%s Stream closed by client', logPrefix);
      abortController.abort();
    });

    req.on('error', () => {
      logger.debug('%s Stream request error', logPrefix);
      abortController.abort();
    });

    let url = 'unknown';
    try {
      const baseUrl = getBaseUrl(environment);
      url = `${baseUrl}${upstreamPath.startsWith('/') ? upstreamPath : `/${upstreamPath}`}`;

      logger.info('%s Starting stream: %s %s environment=%s', logPrefix, method, url, environment || 'default');

      const response = await axios({
        method,
        url,
        data,
        headers: getAuthHeaders(),
        responseType: 'stream',
        signal: abortController.signal,
        validateStatus: () => true,
        proxy: false,
      });

      if (response.status >= 400) {
        let message = 'Unexpected error occurred';
        try {
          const chunks = [];
          for await (const chunk of response.data) {
            chunks.push(chunk);
          }
          const body = Buffer.concat(chunks).toString('utf8');
          try {
            const parsed = JSON.parse(body);
            message = parsed?.message || body || message;
          } catch {
            message = body || message;
          }
        } catch {
          // Ignore parse errors
        }

        writeSseError(res, new Error(message), onError);
        return;
      }

      const stream = response.data;

      stream.on('data', (chunk) => {
        if (!res.destroyed && !abortController.signal.aborted) {
          res.write(chunk);
        }
      });

      stream.on('end', () => {
        if (!res.destroyed) {
          logger.debug('%s Stream ended successfully', logPrefix);
          res.end();
        }
      });

      stream.on('error', (error) => {
        writeSseError(res, error, onError);
      });

      abortController.signal.addEventListener('abort', () => {
        if (!res.destroyed) {
          res.end();
        }
      });
    } catch (error) {
      logger.warn(
        '%s Stream upstream failed: url=%s code=%s message=%s',
        logPrefix,
        url,
        error?.code || 'n/a',
        error?.message || error
      );
      writeSseError(res, error, onError);
    }
  };

  return {
    isConfigured,
    getBaseUrl,
    forwardJson,
    forwardStream,
    writeSseError,
  };
};

module.exports = {
  createForwarder,
};
