// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const parseOrigins = (raw = '', protocols = ['https:', 'http:']) => {
  const origins = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      let url;
      try {
        url = new URL(value);
      } catch {
        throw new Error('CSP allowlists must contain explicit origins');
      }
      if (
        !protocols.includes(url.protocol) ||
        (['http:', 'ws:'].includes(url.protocol) && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== '/' ||
        value.includes('*') ||
        url.origin === 'null'
      ) {
        throw new Error('CSP allowlists must contain explicit origins with no credentials, paths, queries or wildcards');
      }
      return url.origin;
    });
  return [...new Set(origins)];
};

const createCspConfig = (env) => ({
  mode: env.CSP_MODE,
  scriptOrigins: parseOrigins(env.CSP_SCRIPT_ORIGINS),
  connectOrigins: parseOrigins(env.CSP_CONNECT_ORIGINS, ['https:', 'wss:', 'http:', 'ws:']),
  frameOrigins: parseOrigins(env.CSP_FRAME_ORIGINS),
  imageOrigins: parseOrigins(env.CSP_IMAGE_ORIGINS),
  mediaOrigins: parseOrigins(env.CSP_MEDIA_ORIGINS),
});

module.exports = { createCspConfig, parseOrigins };
