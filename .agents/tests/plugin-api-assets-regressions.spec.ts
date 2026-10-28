// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { join } from 'path';
import { test, expect, type Page } from '@playwright/test';
import {
  API_URL,
  TEST_USER,
  loginAs,
  loginAsAdmin,
  getAdminToken,
  getTokenForUser,
  createTestUserViaApi,
  deleteTestUserViaApi,
  createTestModelViaApi,
  deleteModelViaApi,
  deletePluginViaApi,
  goToVehicleApiTab,
  routeExternalPluginScript,
  saveScreenshot,
  E2E_PLUGIN_MARKER,
  type CreatedTestUser,
} from './helpers';

const REPLACE_PLUGIN_DIR = join(process.cwd(), 'tests', 'fixtures', 'e2e-replaceapis-plugin');
const NEW_SIGNAL = 'E2EPluginSignal';

async function modelApiJson(page: Page, modelId: string): Promise<string> {
  const res = await page.request.get(`${API_URL}/v2/models/${modelId}/api?raw=true`, {
    headers: { Authorization: `Bearer ${await getAdminToken(page)}` },
  });
  expect(res.ok()).toBeTruthy();
  return JSON.stringify(await res.json());
}

test.describe('Plugin API on model-level plugin pages (#365)', () => {
  const stamp = Date.now();
  const modelIds: string[] = [];
  const userIds: string[] = [];
  let pluginId = '';
  let pluginSlug = '';
  let owner: CreatedTestUser;
  let outsider: CreatedTestUser;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      // Admin-created plugin => trusted, so the full PluginAPI (incl. replaceAPIs) is exposed.
      const res = await page.request.post(`${API_URL}/v2/system/plugin`, {
        data: {
          name: `E2E_ReplaceApis_${stamp}`,
          is_internal: false,
          url: 'http://127.0.0.1:18765/e2e-simple-plugin/index.js',
        },
        headers: { Authorization: `Bearer ${await getAdminToken(page)}` },
      });
      expect(res.status()).toBe(201);
      const plugin = await res.json();
      pluginId = plugin.id;
      pluginSlug = plugin.slug;
      owner = await createTestUserViaApi(page, { email: `e2e-rapi-owner-${stamp}@example.com` });
      userIds.push(owner.id);
      outsider = await createTestUserViaApi(page, { email: `e2e-rapi-other-${stamp}@example.com` });
      userIds.push(outsider.id);
    } finally {
      await page.close();
    }
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      for (const id of modelIds) await deleteModelViaApi(page, id).catch(() => {});
      for (const id of userIds) await deleteTestUserViaApi(page, id).catch(() => {});
      if (pluginId) await deletePluginViaApi(page, pluginId).catch(() => {});
    } finally {
      await page.close();
    }
  });

  async function openModelPlugin(page: Page, user: CreatedTestUser, modelId: string) {
    await routeExternalPluginScript(page, REPLACE_PLUGIN_DIR);
    await loginAs(page, user.email, TEST_USER.password);
    await page.goto(`/model/${modelId}/plugin?plugid=${pluginSlug}`);
    await expect(page.getByText(E2E_PLUGIN_MARKER)).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId('e2e-plugin-context')).toContainText('Model: E2E_', {
      timeout: 15000,
    });
  }

  // #365: replaceAPIs/uploadFile work from a model-level plugin page, not only inside a prototype.
  test('#365 model-level plugin replaces the Vehicle API of a model the user can write', async ({
    page,
  }) => {
    test.setTimeout(120000);
    const modelId = await createTestModelViaApi(page, `E2E_ReplaceApisOwn_${stamp}`, 'public', {
      email: owner.email,
      password: TEST_USER.password,
    });
    modelIds.push(modelId);
    expect(await modelApiJson(page, modelId)).not.toContain(NEW_SIGNAL);

    await openModelPlugin(page, owner, modelId);
    await page.getByTestId('e2e-replace-btn').click();
    await expect(page.getByTestId('e2e-replace-status')).toHaveText('done', { timeout: 30000 });
    await expect(page.getByText('Vehicle APIs replaced successfully')).toBeVisible();

    expect(await modelApiJson(page, modelId)).toContain(NEW_SIGNAL);
    await goToVehicleApiTab(page, modelId);
    await expect(
      page.locator('.signal-list-item-name').filter({ hasText: `Vehicle.${NEW_SIGNAL}` }),
    ).toBeVisible({ timeout: 20000 });
    await saveScreenshot(page, 'plugin-model-replace-apis');
  });

  // #365: the model permission is enforced, so a user without write access is rejected and nothing changes.
  test('#365 model-level plugin replaceAPIs is rejected for a user without model write access', async ({
    page,
  }) => {
    test.setTimeout(120000);
    const modelId = await createTestModelViaApi(page, `E2E_ReplaceApisDeny_${stamp}`, 'public', {
      email: owner.email,
      password: TEST_USER.password,
    });
    modelIds.push(modelId);
    const before = await modelApiJson(page, modelId);

    await openModelPlugin(page, outsider, modelId);
    await page.getByTestId('e2e-replace-btn').click();
    await expect(page.getByTestId('e2e-replace-status')).toHaveText(/^error:.*\b403\b/, { timeout: 30000 });
    await expect(page.getByText('Vehicle APIs replaced successfully')).toHaveCount(0);

    const after = await modelApiJson(page, modelId);
    expect(after).not.toContain(NEW_SIGNAL);
    expect(after).toBe(before);
  });
});

// #390: the signal detail pane of the Vehicle API tab must scroll when its content is taller than the panel.
test.describe('Signal details scrolling (#390)', () => {
  test.use({ viewport: { width: 1280, height: 600 } });
  let modelId = '';

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      if (modelId) await deleteModelViaApi(page, modelId).catch(() => {});
    } finally {
      await page.close();
    }
  });

  test('#390 signal details view scrolls when its content is taller than the panel', async ({
    page,
  }) => {
    test.setTimeout(90000);
    await loginAsAdmin(page);
    const vss = {
      Vehicle: {
        type: 'branch',
        description: 'E2E scroll fixture',
        children: {
          Speed: {
            type: 'sensor',
            datatype: 'float',
            unit: 'km/h',
            description: 'Vehicle speed. '.repeat(60),
          },
        },
      },
    };
    const res = await page.request.post(`${API_URL}/v2/models`, {
      data: {
        name: `E2E_SignalScroll_${Date.now()}`,
        main_api: 'Vehicle',
        cvi: JSON.stringify(vss),
        visibility: 'public',
      },
      headers: { Authorization: `Bearer ${await getAdminToken(page)}` },
    });
    expect(res.ok()).toBeTruthy();
    const created = await res.json();
    modelId = String(created.id || created._id || created);
    await goToVehicleApiTab(page, modelId);

    await page.locator('[data-id="search-signal-input"]').fill('Vehicle.Speed');
    await page.locator('.signal-list-item-name').filter({ hasText: /^Vehicle\.Speed$/ }).click();
    await expect(page.getByText('VSS Specification', { exact: true })).toBeVisible({
      timeout: 15000,
    });

    // Innermost overflow-auto ancestor of the detail content = the detail pane's scroll container.
    const pane = page
      .locator('.da-page-vehicle-api div.overflow-auto')
      .filter({ has: page.getByText('VSS Specification', { exact: true }) })
      .last();
    const metrics = () =>
      pane.evaluate((el) => ({
        overflowY: getComputedStyle(el).overflowY,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        scrollTop: el.scrollTop,
      }));

    const before = await metrics();
    expect(['auto', 'scroll']).toContain(before.overflowY);
    expect(before.scrollHeight).toBeGreaterThan(before.clientHeight);
    expect(before.scrollTop).toBe(0);

    await pane.hover();
    await page.mouse.wheel(0, 5000);
    await expect.poll(async () => (await metrics()).scrollTop).toBeGreaterThan(0);
    const after = await metrics();
    expect(after.scrollTop + after.clientHeight).toBeGreaterThanOrEqual(after.scrollHeight - 2);

    // The very last piece of content is now inside the pane's visible area (not clipped below it).
    const bottomVisible = await pane.evaluate((el) => {
      const content = el.firstElementChild as HTMLElement;
      const last = content.lastElementChild as HTMLElement;
      return last.getBoundingClientRect().bottom <= el.getBoundingClientRect().bottom + 2;
    });
    expect(bottomVisible).toBe(true);
    await saveScreenshot(page, 'signal-details-scrolled');
  });
});

// #382: with more than 10 assets the My Assets layout must stay intact.
test.describe('My Assets with many assets (#382)', () => {
  const stamp = Date.now();
  const ASSET_COUNT = 12;
  let user: CreatedTestUser | null = null;
  let userToken = '';
  const assetIds: string[] = [];

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      for (const id of assetIds) {
        await page.request
          .delete(`${API_URL}/v2/assets/${id}`, { headers: { Authorization: `Bearer ${userToken}` } })
          .catch(() => {});
      }
      if (user) await deleteTestUserViaApi(page, user.id).catch(() => {});
    } finally {
      await page.close();
    }
  });

  test('#382 My Assets lists all 12 assets without breaking the page layout', async ({ page }) => {
    test.setTimeout(120000);
    await loginAsAdmin(page);
    user = await createTestUserViaApi(page, { email: `e2e-assets-${stamp}@example.com` });
    userToken = await getTokenForUser(page, user.email, TEST_USER.password);
    const names: string[] = [];
    for (let i = 1; i <= ASSET_COUNT; i++) {
      const name = `E2E_Asset_${stamp}_${String(i).padStart(2, '0')}`;
      const res = await page.request.post(`${API_URL}/v2/assets`, {
        data: { name, type: 'CLOUD_RUNTIME', data: '' },
        headers: { Authorization: `Bearer ${userToken}` },
      });
      expect(res.ok()).toBeTruthy();
      assetIds.push((await res.json()).id);
      names.push(name);
    }

    await loginAs(page, user.email, TEST_USER.password);
    // In-app navigation (user menu): a hard load of /my-assets can fire the list request before auth hydrates.
    await page.locator('img[alt="User profile"]').first().click();
    await page.getByRole('menuitem', { name: 'My Assets' }).click();
    await expect(page).toHaveURL(/\/my-assets/);
    await expect(page.getByRole('heading', { name: 'My Assets' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(`All (${ASSET_COUNT})`)).toBeVisible({ timeout: 15000 });

    const rows = page
      .locator('div.flex.w-full.items-center.text-md')
      .filter({ hasText: `E2E_Asset_${stamp}_` });
    await expect(rows).toHaveCount(ASSET_COUNT);
    for (const name of names) {
      await expect(rows.filter({ hasText: name })).toHaveCount(1);
    }

    // The list scrolls inside its own container; the last row is reachable and the header stays put.
    await expect
      .poll(() =>
        rows.first().evaluate((el) => {
          const list = el.closest('.overflow-y-auto');
          return !!list && list.scrollHeight > list.clientHeight;
        }),
      )
      .toBe(true);
    await rows.last().scrollIntoViewIfNeeded();
    await expect(rows.last()).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Create New Asset' })).toBeInViewport();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    await saveScreenshot(page, 'my-assets-12-assets');
  });
});
