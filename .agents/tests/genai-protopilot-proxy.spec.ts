// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect, Request } from '@playwright/test';
import {
  API_URL,
  loginAsAdmin,
  getSiteConfigValue,
  updateSiteConfigValue,
  createTestModelViaApi,
  createTestPrototypeViaApi,
  goToPrototypeCodeTab,
  deleteModelViaApi,
  deletePrototypeViaApi,
} from './helpers';

test.describe.configure({ mode: 'serial' });

// Ticket #14 / P-7a: ProtoPilot generation must go through the authenticated
// backend proxy (POST /v2/genai/generate), never straight from the browser.
const GENERATED_CODE = 'print("generated via /v2/genai/generate")';
const PROMPT = 'Turn on the low beam when the car starts';

test.describe('GenAI ProtoPilot via /v2/genai proxy', () => {
  test.setTimeout(120000);

  let modelId = '';
  let prototypeId = '';
  let originalProtoPilotFlag = '';

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    originalProtoPilotFlag = await getSiteConfigValue(page, 'SHOW_SDV_PROTOPILOT_BUTTON');
    await updateSiteConfigValue(page, 'SHOW_SDV_PROTOPILOT_BUTTON', 'true');
    const stamp = Date.now();
    modelId = await createTestModelViaApi(page, `e2e-genai-${stamp}`, 'private');
    ({ prototypeId } = await createTestPrototypeViaApi(page, { name: `e2e-genai-proto-${stamp}`, modelId }));
  });

  test.afterEach(async ({ page }) => {
    if (prototypeId) await deletePrototypeViaApi(page, prototypeId);
    if (modelId) await deleteModelViaApi(page, modelId);
    await updateSiteConfigValue(page, 'SHOW_SDV_PROTOPILOT_BUTTON', originalProtoPilotFlag || 'false');
  });

  test('anonymous POST /v2/genai/generate is rejected with 401', async ({ playwright }) => {
    const anon = await playwright.request.newContext();
    const res = await anon.post(`${API_URL}/v2/genai/generate`, {
      data: { source: 'sdv-copilot', type: 'GenAI_Python', prompt: PROMPT },
    });
    expect(res.status()).toBe(401);
    await anon.dispose();
  });

  test('SDV Copilot generation calls only the backend proxy, with no endpoint or key from the client', async ({
    page,
  }) => {
    // Keep the marketplace listing hermetic (it is still fetched by the picker until P-7b).
    await page.route('**/package?type=*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) }),
    );

    const generateBodies: Record<string, unknown>[] = [];
    await page.route('**/v2/genai/generate', async (route) => {
      generateBodies.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: GENERATED_CODE }),
      });
    });

    await goToPrototypeCodeTab(page, modelId, prototypeId);
    await page.evaluate(() => localStorage.removeItem('lastUsed_GenAIGenerator'));

    await page.getByRole('button', { name: 'SDV ProtoPilot' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('Enter your prompt to generate SDV App').fill(PROMPT);

    // Any non-GET call leaving for a non-local host during generation would mean the
    // browser is still talking to a generator directly.
    const externalCalls: string[] = [];
    const onRequest = (req: Request) => {
      const { hostname } = new URL(req.url());
      if (req.method() !== 'GET' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        externalCalls.push(`${req.method()} ${req.url()}`);
      }
    };
    page.on('request', onRequest);

    await dialog.getByRole('button', { name: 'Generate SDV App' }).click();
    await expect.poll(() => generateBodies.length, { timeout: 15000 }).toBe(1);
    await expect(dialog.getByText('generated via /v2/genai/generate')).toBeVisible({ timeout: 15000 });
    page.off('request', onRequest);

    const body = generateBodies[0];
    expect(body).toMatchObject({ source: 'sdv-copilot', type: 'GenAI_Python', prompt: PROMPT, modelId });
    for (const forbidden of ['endpointUrl', 'url', 'apiKey', 'accessToken', 'method']) {
      expect(body).not.toHaveProperty(forbidden);
    }
    expect(externalCalls).toEqual([]);
  });
});
