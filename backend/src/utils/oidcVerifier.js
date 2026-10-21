// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const axios = require('axios');
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');

const DISCOVERY_TTL_MS = 60 * 60 * 1000; // 1 hour
const CLOCK_TOLERANCE_SECONDS = 60;

const discoveryCache = new Map(); // base authority -> { expires, value }
const jwksClients = new Map(); // jwks_uri -> jwksRsa client

const normalizeAuthority = (authority) => {
  if (!authority || typeof authority !== 'string') {
    throw new Error('SSO provider authority is not configured');
  }
  return authority
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/v2\.0$/, '');
};

/**
 * Fetch (and cache for 1h) the OIDC discovery document for an authority.
 * @param {string} authority - e.g. https://login.microsoftonline.com/<tenant>[/v2.0]
 * @returns {Promise<{issuer: string, jwks_uri: string}>}
 */
const getDiscovery = async (authority) => {
  const base = normalizeAuthority(authority);
  const cached = discoveryCache.get(base);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  const { data } = await axios.get(`${base}/v2.0/.well-known/openid-configuration`, { timeout: 10000 });
  if (!data || typeof data.issuer !== 'string' || typeof data.jwks_uri !== 'string') {
    throw new Error('OIDC discovery document is missing issuer or jwks_uri');
  }
  const value = { issuer: data.issuer, jwks_uri: data.jwks_uri };
  discoveryCache.set(base, { expires: Date.now() + DISCOVERY_TTL_MS, value });
  return value;
};

/**
 * Get (cached) JWKS client for a jwks_uri.
 * @param {string} jwksUri
 */
const getJwksClient = (jwksUri) => {
  let client = jwksClients.get(jwksUri);
  if (!client) {
    client = jwksRsa({ jwksUri, cache: true, rateLimit: true });
    jwksClients.set(jwksUri, client);
  }
  return client;
};

/**
 * Verify an OIDC ID token: RS256 signature against the provider's JWKS,
 * audience = clientId, issuer = discovery issuer, exp/nbf.
 * @param {string} idToken
 * @param {{authority: string, clientId: string}} options
 * @returns {Promise<object>} verified payload
 * @throws {Error} with a reason when the token is not valid
 */
const verifyIdToken = async (idToken, { authority, clientId } = {}) => {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('ID token is missing or invalid format');
  }
  if (!clientId) {
    throw new Error('SSO provider clientId is not configured');
  }

  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || !decoded.header || !decoded.payload || typeof decoded.payload !== 'object') {
    throw new Error('ID token is not a valid JWT');
  }
  if (decoded.header.alg !== 'RS256') {
    throw new Error(`Unsupported ID token algorithm: ${decoded.header.alg}`);
  }
  if (!decoded.header.kid) {
    throw new Error('ID token header has no kid');
  }

  const discovery = await getDiscovery(authority);
  const signingKey = await getJwksClient(discovery.jwks_uri).getSigningKey(decoded.header.kid);
  const publicKey = signingKey.getPublicKey();

  const payload = jwt.verify(idToken, publicKey, {
    algorithms: ['RS256'],
    audience: clientId,
    clockTolerance: CLOCK_TOLERANCE_SECONDS,
  });

  let expectedIssuer = discovery.issuer;
  if (expectedIssuer.includes('{tenantid}')) {
    // Multi-tenant authorities (common/organizations) publish a templated issuer.
    if (!payload.tid || typeof payload.tid !== 'string') {
      throw new Error('ID token has no tid claim for templated issuer');
    }
    expectedIssuer = expectedIssuer.replace('{tenantid}', payload.tid);
  }
  if (payload.iss !== expectedIssuer) {
    throw new Error(`ID token issuer mismatch: ${payload.iss}`);
  }

  return payload;
};

/** Clear caches (tests only). */
const _resetCache = () => {
  discoveryCache.clear();
  jwksClients.clear();
};

module.exports = {
  getDiscovery,
  getJwksClient,
  verifyIdToken,
  _resetCache,
};
