// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

describe('config.isAllowedOrigin', () => {
  const ORIGINAL_CORS_ORIGINS = process.env.CORS_ORIGINS;
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = process.env.NODE_ENV || 'test';
    process.env.CORS_ORIGINS = 'app\\.example\\.com,localhost:\\d+';
    jest.resetModules();
  });

  afterEach(() => {
    if (ORIGINAL_CORS_ORIGINS === undefined) {
      delete process.env.CORS_ORIGINS;
    } else {
      process.env.CORS_ORIGINS = ORIGINAL_CORS_ORIGINS;
    }
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    jest.resetModules();
  });

  test('allows an origin that matches a configured pattern', () => {
    // eslint-disable-next-line global-require
    const config = require('../../../src/config/config');

    expect(config.isAllowedOrigin('https://app.example.com')).toBe(true);
    expect(config.isAllowedOrigin('http://localhost:3000')).toBe(true);
  });

  test('rejects an attacker-controlled origin used for a redirect target', () => {
    // eslint-disable-next-line global-require
    const config = require('../../../src/config/config');

    // This is the exact class of value that reached res.redirect() unchecked
    // before the fix: any origin the caller supplies in the query string.
    expect(config.isAllowedOrigin('https://evil.example')).toBe(false);
    expect(config.isAllowedOrigin('https://app.example.com.evil.example')).toBe(false);
  });

  test('rejects a missing origin', () => {
    // eslint-disable-next-line global-require
    const config = require('../../../src/config/config');

    expect(config.isAllowedOrigin(undefined)).toBe(false);
    expect(config.isAllowedOrigin('')).toBe(false);
  });
});
