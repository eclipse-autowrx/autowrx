// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

describe('runtimeConfig', () => {
  const ORIGINAL_MAPPINGS = process.env.RUNTIME_SERVICE_MAPPINGS;

  afterEach(() => {
    if (ORIGINAL_MAPPINGS === undefined) {
      delete process.env.RUNTIME_SERVICE_MAPPINGS;
    } else {
      process.env.RUNTIME_SERVICE_MAPPINGS = ORIGINAL_MAPPINGS;
    }
    jest.resetModules();
  });

  test('resolves configured runtime names to target URLs', () => {
    process.env.RUNTIME_SERVICE_MAPPINGS = 'PUBLIC-01:runtime-09,PUBLIC-02:127.0.0.1:8889';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const { getRuntimeTarget } = require('../../../src/config/runtimeConfig');

    expect(getRuntimeTarget('PUBLIC-01')).toBe('http://runtime-09:8080');
    expect(getRuntimeTarget('PUBLIC-02')).toBe('http://127.0.0.1:8889');
    expect(getRuntimeTarget('missing')).toBeNull();
  });

  test('ignores Object.prototype keys on the mapping object', () => {
    process.env.RUNTIME_SERVICE_MAPPINGS = 'PUBLIC-01:runtime-09';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const { getRuntimeTarget } = require('../../../src/config/runtimeConfig');

    expect(getRuntimeTarget('constructor')).toBeNull();
    expect(getRuntimeTarget('toString')).toBeNull();
    expect(getRuntimeTarget('hasOwnProperty')).toBeNull();
    expect(getRuntimeTarget('PUBLIC-01')).toBe('http://runtime-09:8080');
  });
});
