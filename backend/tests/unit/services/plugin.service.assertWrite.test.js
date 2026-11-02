// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #641: every branch of plugin.service.assertPluginWriteAllowed (issue #626 guard).

jest.mock('../../../src/models', () => ({ Plugin: {}, Role: {}, UserRole: {} }));

const httpStatus = require('http-status');
const { assertPluginWriteAllowed } = require('../../../src/services/plugin.service');

const scriptUrl = ['javascript', 'alert(1)'].join(':'); // built at runtime to satisfy no-script-url

const user = { isAdmin: false };
const admin = { isAdmin: true };
const internal = { is_internal: true, url: '/plugin/legacy/index.js' };
const external = { is_internal: false, url: 'https://example.com/p.js' };

const outcome = (body, actor, existing) => {
  try {
    assertPluginWriteAllowed(body, actor, existing);
    return 'ok';
  } catch (err) {
    return err.statusCode;
  }
};

describe('assertPluginWriteAllowed', () => {
  test.each([
    ['admin creating an internal plugin', { is_internal: true, url: '/plugin/x/index.js' }, admin, undefined],
    ['admin switching external → internal', { is_internal: true, url: '/plugin/x/index.js' }, admin, external],
    ['admin setting a relative url', { url: '/d/file.js' }, admin, external],
    ['body without url or is_internal', { name: 'n' }, user, undefined],
    ['explicit is_internal false', { is_internal: false, url: 'https://example.com/p.js' }, user, undefined],
    ['http url', { url: 'http://example.com/p.js' }, user, undefined],
    ['https url change', { url: 'https://cdn.example/p2.js' }, user, external],
    ['keeping internal on a legacy internal plugin', { is_internal: true }, user, internal],
    ['unchanged relative url on a legacy plugin', { url: internal.url }, user, internal],
  ])('allows %s', (_label, body, actor, existing) => {
    expect(outcome(body, actor, existing)).toBe('ok');
  });

  test.each([
    ['non-admin creating an internal plugin', { is_internal: true }, user, undefined, httpStatus.FORBIDDEN],
    ['missing actor creating an internal plugin', { is_internal: true }, undefined, undefined, httpStatus.FORBIDDEN],
    ['null actor creating an internal plugin', { is_internal: true }, null, undefined, httpStatus.FORBIDDEN],
    ['switching an external plugin to internal', { is_internal: true }, user, external, httpStatus.FORBIDDEN],
    ['a relative url', { url: '/plugin/x/index.js' }, user, undefined, httpStatus.BAD_REQUEST],
    ['changing a legacy url to another relative path', { url: '/plugin/other.js' }, user, internal, httpStatus.BAD_REQUEST],
    ['a script url', { url: scriptUrl }, user, undefined, httpStatus.BAD_REQUEST],
    ['a data: url', { url: 'data:text/javascript,alert(1)' }, user, undefined, httpStatus.BAD_REQUEST],
    ['an ftp url', { url: 'ftp://example.com/p.js' }, user, undefined, httpStatus.BAD_REQUEST],
    ['an unparsable url', { url: 'not a url' }, user, undefined, httpStatus.BAD_REQUEST],
    ['an empty url', { url: '' }, user, external, httpStatus.BAD_REQUEST],
    ['a null url', { url: null }, user, external, httpStatus.BAD_REQUEST],
  ])('rejects %s', (_label, body, actor, existing, status) => {
    expect(outcome(body, actor, existing)).toBe(status);
  });
});
