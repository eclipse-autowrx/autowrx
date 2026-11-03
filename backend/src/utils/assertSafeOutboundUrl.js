// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const dns = require('dns');
const net = require('net');
const httpStatus = require('http-status');
const ApiError = require('./ApiError');

const NOT_ALLOWED = 'Generator endpoint is not allowed';

/**
 * Extract the embedded IPv4 address from an IPv4-mapped IPv6 address (::ffff:a.b.c.d or ::ffff:hhhh:hhhh).
 * @param {string} address lowercase IPv6 address
 * @returns {string|null}
 */
const unmapIPv4 = (address) => {
  const dotted = address.match(/^(?:0{0,4}:){0,5}:?ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dotted) {
    return dotted[1];
  }
  const hex = address.match(/^(?:0{0,4}:){0,5}:?ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const high = parseInt(hex[1], 16);
    const low = parseInt(hex[2], 16);
    return `${Math.floor(high / 256)}.${high % 256}.${Math.floor(low / 256)}.${low % 256}`;
  }
  return null;
};

/**
 * @param {string} address
 * @returns {boolean} true for loopback, link-local and unspecified addresses
 */
const isBlockedAddress = (address) => {
  const family = net.isIP(address);
  if (family === 4) {
    const [a, b] = address.split('.').map(Number);
    return a === 127 || a === 0 || (a === 169 && b === 254);
  }
  if (family === 6) {
    const lower = address.toLowerCase();
    const mapped = unmapIPv4(lower);
    if (mapped) {
      return isBlockedAddress(mapped);
    }
    if (lower === '::' || lower === '::1') {
      return true;
    }
    // fe80::/10
    return /^fe[89ab][0-9a-f]:/.test(lower);
  }
  return true;
};

/**
 * Reject outbound URLs that would let a user reach loopback / link-local / unspecified hosts
 * (e.g. cloud metadata at 169.254.169.254). RFC1918 private ranges are allowed.
 * @param {string} url
 * @returns {Promise<void>}
 */
const assertSafeOutboundUrl = async (url) => {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw new ApiError(httpStatus.BAD_REQUEST, NOT_ALLOWED);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ApiError(httpStatus.BAD_REQUEST, NOT_ALLOWED);
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  let addresses;
  try {
    addresses = await dns.promises.lookup(hostname, { all: true });
  } catch (e) {
    throw new ApiError(httpStatus.BAD_REQUEST, NOT_ALLOWED);
  }
  if (!addresses || addresses.length === 0 || addresses.some(({ address }) => isBlockedAddress(address))) {
    throw new ApiError(httpStatus.BAD_REQUEST, NOT_ALLOWED);
  }
};

module.exports = {
  assertSafeOutboundUrl,
  isBlockedAddress,
};
