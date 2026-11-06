// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const { rewritePreviewRedirectLocation } = require('../../../src/utils/runtimePreviewProxy');

describe('rewritePreviewRedirectLocation', () => {
  const ctx = {
    runtimeName: 'PUBLIC-02-abc',
    publicHost: 'playground.example.com',
    targetUrl: 'http://runtime-09:8080',
  };

  test('turns an http:// redirect on the public host into a relative path', () => {
    expect(rewritePreviewRedirectLocation('http://playground.example.com/runtime-preview/PUBLIC-02-abc/', ctx)).toBe(
      '/runtime-preview/PUBLIC-02-abc/',
    );
  });

  test('keeps query and hash', () => {
    expect(rewritePreviewRedirectLocation('http://playground.example.com/runtime-preview/PUBLIC-02-abc/?a=1#x', ctx)).toBe(
      '/runtime-preview/PUBLIC-02-abc/?a=1#x',
    );
  });

  test('maps a redirect on the kit host back under the preview prefix', () => {
    expect(rewritePreviewRedirectLocation('http://runtime-09:8080/default/', ctx)).toBe(
      '/runtime-preview/PUBLIC-02-abc/default/',
    );
  });

  test('prefixes a root-relative path from a prefix-unaware kit', () => {
    expect(rewritePreviewRedirectLocation('/default/', ctx)).toBe('/runtime-preview/PUBLIC-02-abc/default/');
  });

  test('keeps a root-relative path that already has the preview prefix', () => {
    expect(rewritePreviewRedirectLocation('/runtime-preview/PUBLIC-02-abc/', ctx)).toBe('/runtime-preview/PUBLIC-02-abc/');
  });

  test('matches hosts case-insensitively', () => {
    expect(rewritePreviewRedirectLocation('HTTP://Playground.Example.com/runtime-preview/PUBLIC-02-abc/', ctx)).toBe(
      '/runtime-preview/PUBLIC-02-abc/',
    );
  });

  test('leaves redirects to other hosts alone', () => {
    expect(rewritePreviewRedirectLocation('https://login.example.org/auth', ctx)).toBe('https://login.example.org/auth');
  });

  test('leaves document-relative and protocol-relative locations alone', () => {
    expect(rewritePreviewRedirectLocation('default/', ctx)).toBe('default/');
    expect(rewritePreviewRedirectLocation('//evil.example/x', ctx)).toBe('//evil.example/x');
  });

  test('is a no-op without a location or runtime name', () => {
    expect(rewritePreviewRedirectLocation(undefined, ctx)).toBeUndefined();
    expect(rewritePreviewRedirectLocation('/x', { ...ctx, runtimeName: null })).toBe('/x');
  });
});
