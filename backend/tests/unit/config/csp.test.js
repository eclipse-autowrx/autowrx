// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { createCspConfig, parseOrigins } = require('../../../src/config/csp');

describe('CSP origin allowlists', () => {
  test('defaults to no external hosts and deduplicates explicit origins', () => {
    expect(createCspConfig({ CSP_MODE: 'report-only' }).scriptOrigins).toEqual([]);
    expect(parseOrigins('https://example.com, https://example.com/')).toEqual(['https://example.com']);
  });

  test.each([
    '*',
    'https:',
    'https://*.example.com',
    'https://example.com/path',
    'https://example.com?token=secret',
    'https://example.com#hash',
    'https://user:password@example.com',
    "'unsafe-inline'",
    "'unsafe-eval'",
    'data:',
    ['javascript', 'alert(1)'].join(':'),
    'http://external.example',
    'wss://example.com',
  ])('rejects unsafe script source %s', (value) => {
    expect(() => parseOrigins(value)).toThrow(/CSP allowlists/);
  });

  test('accepts exact secure WebSocket hosts and explicit loopback test hosts', () => {
    const config = createCspConfig({
      CSP_MODE: 'enforce',
      CSP_CONNECT_ORIGINS: 'wss://kit.example.com,ws://127.0.0.1:3090',
      CSP_SCRIPT_ORIGINS: 'http://localhost:18765',
    });
    expect(config.connectOrigins).toEqual(['wss://kit.example.com', 'ws://127.0.0.1:3090']);
    expect(config.scriptOrigins).toEqual(['http://localhost:18765']);
    expect(() => createCspConfig({ CSP_CONNECT_ORIGINS: 'ws://external.example' })).toThrow();
  });
});
