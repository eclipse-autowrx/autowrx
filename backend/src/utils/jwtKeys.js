// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const jwt = require('jsonwebtoken');
const config = require('../config/config');

const JWT_ALGORITHM = 'HS256';

/**
 * Key currently used to sign new tokens
 * @returns {{kid: string, secret: string}}
 */
const getSigningKey = () => {
  const kid = config.jwt.activeKid;
  return { kid, secret: config.jwt.keys[kid] };
};

/**
 * Pick the secret to verify a token with, based on its `kid` header.
 * Tokens without a `kid` were issued before key rotation and fall back to JWT_SECRET
 * while JWT_ACCEPT_LEGACY_SECRET is on.
 * @param {string} token
 * @returns {string}
 */
const resolveVerificationKey = (token) => {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header) {
    throw new jwt.JsonWebTokenError('jwt malformed');
  }
  const { kid } = decoded.header;
  if (kid === undefined) {
    if (!config.jwt.acceptLegacySecret) {
      throw new jwt.JsonWebTokenError('Tokens without kid are not accepted');
    }
    return config.jwt.secret;
  }
  if (typeof kid !== 'string' || !Object.prototype.hasOwnProperty.call(config.jwt.keys, kid)) {
    throw new jwt.JsonWebTokenError('Unknown key id');
  }
  return config.jwt.keys[kid];
};

/**
 * Verify a token against the key ring
 * @param {string} token
 * @returns {Object} payload
 */
const verifyJwt = (token) => jwt.verify(token, resolveVerificationKey(token), { algorithms: [JWT_ALGORITHM] });

module.exports = {
  JWT_ALGORITHM,
  getSigningKey,
  resolveVerificationKey,
  verifyJwt,
};
