// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const RUNTIME_NAME_RE = /^[a-zA-Z0-9-]+$/;
const PREVIEW_ACCESS_COOKIE = 'runtime_preview_at';

/**
 * Resolve runtime name from an HTTP or WebSocket upgrade request.
 * Express sets originalUrl; raw upgrade events do not — fall back to req.url.
 * @param {import('http').IncomingMessage & { originalUrl?: string }} req
 * @returns {string|null}
 */
function runtimeNameFromReq(req) {
  const original = String(req.originalUrl || '').split('?')[0];
  const fromOriginal = original.match(/^\/runtime-preview\/([^/]+)/);
  if (fromOriginal) return fromOriginal[1];

  const urlPath = String(req.url || '').split('?')[0];

  // Upgrade path: no Express, so originalUrl is empty — match the full prefix on req.url
  if (!original) {
    const fromUrl = urlPath.match(/^\/runtime-preview\/([^/]+)/);
    return fromUrl ? fromUrl[1] : null;
  }

  // After Express strip, url is /:name/...; only trust when originalUrl is under the mount
  if (original === '/runtime-preview' || original.startsWith('/runtime-preview/')) {
    const match = urlPath.match(/^\/([^/]+)/);
    return match ? match[1] : null;
  }
  return null;
}

/**
 * Strip access_token from a raw query string (without leading ?).
 * @param {string} query
 * @returns {string}
 */
function stripAccessTokenQuery(query) {
  if (!query) return '';
  const params = new URLSearchParams(query);
  params.delete('access_token');
  return params.toString();
}

/**
 * Rewrite /runtime-preview/:name/... → /... and preserve non-secret query params
 * (needed for socket.io EIO/transport and kit UI query state).
 * @param {import('http').IncomingMessage & { originalUrl?: string }} req
 * @returns {string}
 */
function rewriteRuntimePreviewPath(req) {
  const runtimeName = runtimeNameFromReq(req);
  const raw = String(req.originalUrl || req.url || '');
  const qIndex = raw.indexOf('?');
  const pathOnly = (qIndex >= 0 ? raw.slice(0, qIndex) : raw) || '/';
  const nextQs = stripAccessTokenQuery(qIndex >= 0 ? raw.slice(qIndex + 1) : '');

  let rewritten = '/';
  if (runtimeName) {
    if (pathOnly.startsWith('/runtime-preview/')) {
      rewritten = pathOnly.replace(new RegExp(`^/runtime-preview/${runtimeName}`), '') || '/';
    } else {
      rewritten = pathOnly.replace(new RegExp(`^/${runtimeName}`), '') || '/';
    }
  }

  return nextQs ? `${rewritten}?${nextQs}` : rewritten;
}

/**
 * Remove AutoWRX credentials before http-proxy forwards to the kit.
 * @param {{ removeHeader: (name: string) => void, getHeader?: (name: string) => string|number|string[]|undefined, setHeader?: (name: string, value: string) => void }} proxyReq
 */
function stripKitUpstreamCredentials(proxyReq) {
  proxyReq.removeHeader('authorization');

  if (typeof proxyReq.getHeader !== 'function' || typeof proxyReq.setHeader !== 'function') {
    proxyReq.removeHeader('cookie');
    return;
  }

  const rawCookie = proxyReq.getHeader('cookie');
  if (!rawCookie) return;

  const cookieStr = Array.isArray(rawCookie) ? rawCookie.join(';') : String(rawCookie);
  const kept = cookieStr
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith(`${PREVIEW_ACCESS_COOKIE}=`));

  if (kept.length === 0) {
    proxyReq.removeHeader('cookie');
  } else {
    proxyReq.setHeader('cookie', kept.join('; '));
  }
}

/**
 * Turn a kit redirect into a same-origin path under /runtime-preview/:name.
 * Kit web apps (e.g. NiceGUI's trailing-slash redirect) build absolute Location
 * headers from the plain-http hop behind the proxy, so an https page gets sent to
 * http:// and the browser blocks it as mixed content. Absolute URLs pointing at
 * this host or the kit itself become relative; anything else is left alone.
 * @param {string|undefined} location Location header from the kit
 * @param {{ runtimeName: string|null, publicHost?: string, targetUrl?: string|null }} ctx
 * @returns {string|undefined}
 */
function rewritePreviewRedirectLocation(location, { runtimeName, publicHost, targetUrl } = {}) {
  if (typeof location !== 'string' || !location || !runtimeName) return location;

  const isAbsolute = /^https?:\/\//i.test(location);
  const isPathAbsolute = location.startsWith('/') && !location.startsWith('//');
  if (!isAbsolute && !isPathAbsolute) return location;

  let parsed;
  try {
    parsed = new URL(location, 'http://placeholder.invalid');
  } catch {
    return location;
  }

  if (isAbsolute) {
    const ownHosts = new Set();
    if (publicHost) ownHosts.add(String(publicHost).toLowerCase());
    if (targetUrl) {
      try {
        ownHosts.add(new URL(targetUrl).host.toLowerCase());
      } catch {
        // ignore malformed target
      }
    }
    if (!ownHosts.has(parsed.host.toLowerCase())) return location;
  }

  const prefix = `/runtime-preview/${runtimeName}`;
  const path = parsed.pathname.startsWith('/runtime-preview/') ? parsed.pathname : `${prefix}${parsed.pathname}`;
  return `${path}${parsed.search}${parsed.hash}`;
}

module.exports = {
  RUNTIME_NAME_RE,
  PREVIEW_ACCESS_COOKIE,
  runtimeNameFromReq,
  stripAccessTokenQuery,
  rewriteRuntimePreviewPath,
  rewritePreviewRedirectLocation,
  stripKitUpstreamCredentials,
};
