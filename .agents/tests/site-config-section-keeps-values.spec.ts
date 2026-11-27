// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect, type Page } from '@playwright/test';
import { API_URL, getAuthToken, getPublicConfigRow, loginAsAdmin } from './helpers';

// A predefined Model & Prototype key, stored under another category as older
// seeds did. Opening the section must show its value, not reset it.
const KEY = 'DEFAULT_PROTOTYPE_IMAGE';

async function readConfig(page: Page): Promise<{ value: string; category: string }> {
  const token = await getAuthToken(page);
  const res = await page.request.get(`${API_URL}/v2/site-config/key/${KEY}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok(), await res.text()).toBe(true);
  const data = await res.json();
  return { value: String(data.value ?? ''), category: String(data.category ?? '') };
}

async function writeConfig(page: Page, data: { value: string; category: string }) {
  const token = await getAuthToken(page);
  const res = await page.request.patch(`${API_URL}/v2/site-config/key/${KEY}`, {
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok(), await res.text()).toBe(true);
}

test.describe('Site Config sections', () => {
  let original: { value: string; category: string } | undefined;

  test.afterEach(async ({ browser }) => {
    if (!original) return;
    const page = await browser.newPage();
    try {
      await writeConfig(page, original);
      original = undefined;
    } finally {
      await page.close();
    }
  });

  test('opening a section keeps the value of a key stored under another category', async ({ page }) => {
    original = await readConfig(page);
    const custom = `/imgs/e2e-keep-${Date.now()}.png`;
    await writeConfig(page, { value: custom, category: 'general' });

    await loginAsAdmin(page);
    await page.goto('/admin/site-config');
    await page.getByRole('button', { name: 'Model & Prototype', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Model & Prototype Configuration', exact: true })).toBeVisible();

    await expect(getPublicConfigRow(page, KEY)).toContainText(custom, { timeout: 15000 });
    expect((await readConfig(page)).value).toBe(custom);
  });
});
