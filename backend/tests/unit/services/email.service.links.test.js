// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #633: emailed reset/verify links must not carry the token in the query string.

jest.mock('../../../src/models', () => ({
  SiteConfig: { findOne: jest.fn().mockResolvedValue(null) },
}));
jest.mock('axios', () => {
  const instance = { post: jest.fn().mockResolvedValue({}) };
  return { __esModule: true, default: instance, post: instance.post };
});

const axios = require('axios').default;
const config = require('../../../src/config/config');
const emailService = require('../../../src/services/email.service');

const sentPayload = () => JSON.stringify(axios.post.mock.calls[axios.post.mock.calls.length - 1][1]);

describe('email links (#633)', () => {
  const originalBaseUrl = config.client.baseUrl;
  beforeAll(() => {
    config.client.baseUrl = 'https://app.example';
  });
  afterAll(() => {
    config.client.baseUrl = originalBaseUrl;
  });
  beforeEach(() => axios.post.mockClear());

  test('verification link uses the client base URL and a fragment token', async () => {
    await emailService.sendVerificationEmail('u@example.com', 'tok.en');

    const payload = sentPayload();
    expect(payload).toContain('https://app.example/verify-email#token=tok.en');
    expect(payload).not.toContain('?token=');
    expect(payload).not.toContain('link-to-app');
  });

  test('reset link uses a fragment token', async () => {
    await emailService.sendResetPasswordEmail('u@example.com', 'tok.en');

    const payload = sentPayload();
    expect(payload).toContain('https://app.example/reset-password#token=tok.en');
    expect(payload).not.toContain('?token=');
  });
});
