// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const dns = require('dns');
const { assertSafeOutboundUrl } = require('../../../src/utils/assertSafeOutboundUrl');

const mockLookup = (...addresses) =>
  jest
    .spyOn(dns.promises, 'lookup')
    .mockResolvedValue(addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 })));

describe('assertSafeOutboundUrl', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each([
    ['loopback', 'http://localhost/x', ['127.0.0.1']],
    ['loopback range', 'http://a.example.com/x', ['127.5.5.5']],
    ['link-local metadata', 'http://169.254.169.254/x', ['169.254.169.254']],
    ['unspecified', 'http://0.0.0.0/x', ['0.0.0.0']],
    ['ipv6 loopback', 'http://[::1]/x', ['::1']],
    ['ipv6 unspecified', 'http://a.example.com/x', ['::']],
    ['ipv6 link-local', 'http://a.example.com/x', ['fe80::1']],
    ['ipv4-mapped loopback', 'http://a.example.com/x', ['::ffff:127.0.0.1']],
    ['ipv4-mapped loopback (hex)', 'http://a.example.com/x', ['::ffff:7f00:1']],
    ['ipv4-mapped metadata', 'http://a.example.com/x', ['::ffff:169.254.169.254']],
    ['any blocked address among several', 'http://a.example.com/x', ['93.184.216.34', '127.0.0.1']],
  ])('rejects %s', async (_name, url, addresses) => {
    mockLookup(...addresses);
    await expect(assertSafeOutboundUrl(url)).rejects.toMatchObject({
      statusCode: 400,
      message: 'Generator endpoint is not allowed',
    });
  });

  test('rejects non-http(s) protocols without resolving', async () => {
    const spy = mockLookup('93.184.216.34');
    await expect(assertSafeOutboundUrl('ftp://example.com/x')).rejects.toMatchObject({ statusCode: 400 });
    expect(spy).not.toHaveBeenCalled();
  });

  test('rejects malformed urls', async () => {
    await expect(assertSafeOutboundUrl('not a url')).rejects.toMatchObject({ statusCode: 400 });
  });

  test('rejects hosts that fail to resolve', async () => {
    jest.spyOn(dns.promises, 'lookup').mockRejectedValue(new Error('ENOTFOUND'));
    await expect(assertSafeOutboundUrl('https://nope.example.com')).rejects.toMatchObject({ statusCode: 400 });
  });

  test.each([
    ['RFC1918 10.x', 'http://internal.example.com/x', ['10.1.2.3']],
    ['RFC1918 192.168.x', 'http://internal.example.com/x', ['192.168.1.10']],
    ['public ipv4', 'https://example.com/x', ['93.184.216.34']],
    ['public ipv6', 'https://example.com/x', ['2606:2800:220:1:248:1893:25c8:1946']],
  ])('allows %s', async (_name, url, addresses) => {
    mockLookup(...addresses);
    await expect(assertSafeOutboundUrl(url)).resolves.toBeUndefined();
  });
});
