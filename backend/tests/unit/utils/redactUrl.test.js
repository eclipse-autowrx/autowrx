// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #633: secret-bearing query values must not reach request logs.

const { redactUrl } = require('../../../src/utils/redactUrl');

describe('redactUrl', () => {
  test('redacts token and keeps other params', () => {
    expect(redactUrl('/v2/auth/verify-email?token=abc.def&x=1')).toBe('/v2/auth/verify-email?token=[REDACTED]&x=1');
  });

  test('redacts every sensitive key, case-insensitively', () => {
    expect(redactUrl('/cb?code=123&ID_TOKEN=jwt&Access_Token=a&state=s')).toBe(
      '/cb?code=[REDACTED]&ID_TOKEN=[REDACTED]&Access_Token=[REDACTED]&state=s',
    );
  });

  test('redacts percent-encoded keys and repeated keys', () => {
    expect(redactUrl('/a?%74oken=x&token=y')).toBe('/a?%74oken=[REDACTED]&token=[REDACTED]');
  });

  test('works on absolute URLs and keeps the fragment', () => {
    expect(redactUrl('https://h.example/p?password=p&q=1#frag')).toBe('https://h.example/p?password=[REDACTED]&q=1#frag');
  });

  test('leaves URLs without a query unchanged', () => {
    expect(redactUrl('/v2/health/live')).toBe('/v2/health/live');
    expect(redactUrl('/reset-password#token=abc')).toBe('/reset-password#token=abc');
  });

  test('does not touch keys that only contain a sensitive word', () => {
    expect(redactUrl('/search?tokenizer=x&keyword=y')).toBe('/search?tokenizer=x&keyword=y');
  });

  test('never throws on odd input', () => {
    expect(redactUrl('/a?%E0%A4%A=1&token=z')).toBe('/a?%E0%A4%A=1&token=[REDACTED]');
    expect(redactUrl(undefined)).toBeUndefined();
    expect(redactUrl('?')).toBe('?');
  });
});
