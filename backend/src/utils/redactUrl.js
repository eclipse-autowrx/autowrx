// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const REDACTED = '[REDACTED]';

// Query keys whose values are secrets and must never reach logs (matched case-insensitively).
const SENSITIVE_KEYS = new Set([
  'token',
  'code',
  'password',
  'access_token',
  'refresh_token',
  'id_token',
  'secret',
  'apikey',
  'api_key',
  'key',
]);

/**
 * Replace the values of secret-bearing query parameters with a placeholder.
 * Works on paths ("/a?b=c") and absolute URLs; never throws.
 * @param {string} url
 * @returns {string}
 */
const redactUrl = (url) => {
  if (typeof url !== 'string') return url;
  const queryStart = url.indexOf('?');
  if (queryStart === -1) return url;

  try {
    const hashStart = url.indexOf('#', queryStart);
    const query = hashStart === -1 ? url.slice(queryStart + 1) : url.slice(queryStart + 1, hashStart);
    const hash = hashStart === -1 ? '' : url.slice(hashStart);

    const redacted = query
      .split('&')
      .map((pair) => {
        const eq = pair.indexOf('=');
        const rawKey = eq === -1 ? pair : pair.slice(0, eq);
        let key = rawKey;
        try {
          key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
        } catch (e) {
          // Keep the raw key if it is not valid percent-encoding.
        }
        return SENSITIVE_KEYS.has(key.toLowerCase()) ? `${rawKey}=${REDACTED}` : pair;
      })
      .join('&');

    return `${url.slice(0, queryStart)}?${redacted}${hash}`;
  } catch (e) {
    return url;
  }
};

module.exports = {
  redactUrl,
  REDACTED,
};
