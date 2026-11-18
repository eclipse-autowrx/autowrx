// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect } from '@playwright/test';
import {
  API_URL,
  TEST_USER,
  loginAsAdmin,
  getTokenForUser,
  createTestUserViaApi,
  deleteTestUserViaApi,
  CreatedTestUser,
} from './helpers';

test.describe.configure({ mode: 'serial' });

// The /v2/genai/* proxy forwards to the third-party GenAI service that extensions
// (genai-wizard chat) call. Every signed-in user must get through it; only
// POST /v2/genai/generate (AutoWRX's own code generation) is gated by the
// generativeAI permission. This regressed twice, blocking the AI chat for everyone
// but admins.
//
// The upstream may be unconfigured or down in the test env (503/502 are fine):
// the assertion is only that the permission layer does not reject a normal user.
const PROXY_CALLS: { method: 'GET' | 'POST'; path: string }[] = [
  { method: 'GET', path: '/v2/genai/actuator/info' },
  { method: 'POST', path: '/v2/genai/generation' },
  { method: 'GET', path: '/v2/genai/token?service=azure-speech' },
];

test.describe('GenAI third-party proxy for normal users', () => {
  test.setTimeout(60000);

  const stamp = Date.now();
  let normalUser: CreatedTestUser;
  let normalToken = '';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    normalUser = await createTestUserViaApi(page, {
      email: `e2e_genai_user_${stamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E GenAI User ${stamp}`,
    });
    normalToken = await getTokenForUser(page, normalUser.email, TEST_USER.password);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    if (normalUser) await deleteTestUserViaApi(page, normalUser.id).catch(() => {});
    await page.close();
  });

  for (const { method, path } of PROXY_CALLS) {
    test(`${method} ${path} is not blocked for a normal user`, async ({ request }) => {
      const res = await request.fetch(`${API_URL}${path}`, {
        method,
        headers: { Authorization: `Bearer ${normalToken}` },
        ...(method === 'POST' ? { data: { messages: [{ role: 'user', content: 'hello' }] } } : {}),
      });
      expect(res.status(), await res.text()).not.toBe(401);
      expect(res.status(), await res.text()).not.toBe(403);
    });

    test(`${method} ${path} still rejects anonymous calls with 401`, async ({ playwright }) => {
      const anon = await playwright.request.newContext();
      const res = await anon.fetch(`${API_URL}${path}`, { method });
      expect(res.status()).toBe(401);
      await anon.dispose();
    });
  }

  test('POST /v2/genai/generate stays gated (403) for the same normal user', async ({ request }) => {
    const res = await request.post(`${API_URL}/v2/genai/generate`, {
      headers: { Authorization: `Bearer ${normalToken}` },
      data: { source: 'sdv-copilot', type: 'GenAI_Python', prompt: 'hello' },
    });
    expect(res.status()).toBe(403);
  });
});
