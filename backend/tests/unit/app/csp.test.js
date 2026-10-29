// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

jest.mock('../../../src/config/logger', () => ({ info: jest.fn() }));

const http = require('http');
const express = require('express');
const { createCspConfig } = require('../../../src/config/csp');
const { createSecurityHeaders, cspNonce } = require('../../../src/middlewares/contentSecurityPolicy');
const reports = require('../../../src/routes/v2/system/cspReport.route');
const logger = require('../../../src/config/logger');
const { errorConverter, errorHandler } = require('../../../src/middlewares/error');

const makeApp = (env = 'production', mode = 'report-only') => {
  const app = express();
  app.use(cspNonce);
  app.use(createSecurityHeaders({ env, csp: createCspConfig({ CSP_MODE: mode }) }));
  app.use('/v2/security/csp-reports', reports);
  app.get('/', (_req, res) => res.send('ok'));
  app.use(errorConverter);
  app.use(errorHandler);
  return app;
};

const request = (app, { method = 'GET', body, type = 'application/csp-report', path = '/', raw = false } = {}) =>
  new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const req = http.request(
        {
          host: '127.0.0.1',
          port: server.address().port,
          path,
          method,
          headers: { 'Content-Type': type },
        },
        (res) => {
          res.resume();
          res.on('end', () => server.close(() => resolve({ status: res.statusCode, headers: res.headers })));
        },
      );
      req.on('error', (err) => server.close(() => reject(err)));
      const payload = body === undefined ? undefined : JSON.stringify(body);
      req.end(raw ? body : payload);
    });
  });

const report = {
  'csp-report': {
    'effective-directive': 'script-src-elem',
    'document-uri': 'https://app.example/private/model?token=SECRET',
    'blocked-uri': 'https://attacker.example/stolen?token=SECRET',
    'source-file': 'https://app.example/path?secret=SECRET',
    'script-sample': 'PRIVATE SCRIPT',
    referrer: 'PRIVATE REFERRER',
  },
};

describe('CSP security headers', () => {
  test('ships the strict policy as Report-Only by default', async () => {
    const res = await request(makeApp());
    expect(res.headers['content-security-policy']).toBeUndefined();
    const policy = res.headers['content-security-policy-report-only'];
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("script-src 'self' 'nonce-");
    expect(policy).toContain("script-src-attr 'none'");
    expect(policy).toContain('report-uri /v2/security/csp-reports');
    expect(policy).not.toMatch(/unsafe-eval|script-src[^;]*unsafe-inline|\*/);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('enforce mode blocks unsafe script sources and generates a fresh nonce per response', async () => {
    const app = makeApp('production', 'enforce');
    const a = await request(app);
    const b = await request(app);
    expect(a.headers['content-security-policy-report-only']).toBeUndefined();
    expect(a.headers['content-security-policy']).toContain("connect-src 'self';");
    expect(a.headers['content-security-policy']).toContain("worker-src 'self';");
    expect(a.headers['content-security-policy']).not.toEqual(b.headers['content-security-policy']);
  });

  test('development retains HMR support without upgrading localhost to HTTPS', async () => {
    const res = await request(makeApp('development'));
    expect(res.headers['content-security-policy']).toContain("'unsafe-eval'");
    expect(res.headers['content-security-policy']).not.toContain('upgrade-insecure-requests');
  });
});

describe('public CSP report collector', () => {
  const app = makeApp();
  const post = (body, type) => request(app, { method: 'POST', path: '/v2/security/csp-reports', body, type });

  test('accepts unauthenticated legacy browser reports and logs only safe fields', async () => {
    expect((await post(report)).status).toBe(204);
    const message = logger.info.mock.calls.at(-1)[0];
    expect(message).toContain('script-src-elem');
    expect(message).toContain('https://attacker.example');
    expect(message).not.toMatch(/SECRET|PRIVATE|token|private|path/);
  });

  test('accepts Reporting API batches', async () => {
    expect(
      (
        await post(
          [
            {
              type: 'csp-violation',
              body: {
                effectiveDirective: 'script-src-elem',
                blockedURL: 'inline',
                disposition: 'enforce',
              },
            },
          ],
          'application/reports+json',
        )
      ).status,
    ).toBe(204);
    expect(logger.info.mock.calls.at(-1)[0]).toContain('"blockedOrigin":"inline"');
  });

  test.each([{}, [], { 'csp-report': [] }, { 'csp-report': { 'effective-directive': 'bad\nlog' } }, Array(21).fill(report)])(
    'rejects malformed or excessive report batches',
    async (body) => {
      expect((await post(body)).status).toBe(400);
    },
  );

  test('caps request body size independently of the app JSON limit', async () => {
    expect((await post({ ...report, padding: 'x'.repeat(17000) })).status).toBe(413);
  });

  test('rejects malformed JSON without logging the payload', async () => {
    logger.info.mockClear();
    const response = await request(app, {
      method: 'POST',
      path: '/v2/security/csp-reports',
      raw: true,
      body: '{"PRIVATE":',
    });
    expect(response.status).toBe(400);
    expect(logger.info).not.toHaveBeenCalled();
  });

  test('rate limits unauthenticated report traffic', async () => {
    const responses = await Promise.all(Array.from({ length: 61 }, () => post(report)));
    expect(responses.some((response) => response.status === 429)).toBe(true);
  });
});
