// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect, Page } from '@playwright/test';
import {
  TEST_USER,
  loginAs,
  loginAsAdmin,
  createTestUserViaApi,
  deleteTestUserViaApi,
  createEditableReleasedModelViaApi,
  createTestPrototypeViaApi,
  deleteModelViaApi,
  deletePrototypeViaApi,
  updateSiteConfigValue,
  goToPrototypeCodeTab,
  expandRuntimePanel,
  CreatedTestUser,
} from './helpers';

function getRuntimeHeaderOptionsTrigger(page: Page) {
  return page
    .locator('[data-id="runtime-control-panel"]')
    .locator('[data-id="btn-add-runtime"]')
    .locator('xpath=../..')
    .locator('[aria-haspopup="menu"]');
}

test.describe('Custom kit-server URL restriction', () => {
  let modelId = '';
  let prototypeId = '';
  let nonAdminUser: CreatedTestUser | null = null;
  const nonAdminPassword = TEST_USER.password;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await updateSiteConfigValue(page, 'KIT_SERVER_ALLOWLIST', '');
      const ts = Date.now();
      nonAdminUser = await createTestUserViaApi(page, {
        email: `e2e_kitserver_${ts}@example.com`,
        password: nonAdminPassword,
        name: `KitServer User ${ts}`,
      });
      modelId = await createEditableReleasedModelViaApi(page, `E2E_KitServerModel_${ts}`);
      const proto = await createTestPrototypeViaApi(page, {
        name: `E2E_KitServerProto_${ts}`,
        modelId,
        // The non-admin user opens this prototype; new prototypes default to private.
        visibility: 'public',
      });
      prototypeId = proto.prototypeId;
    } finally {
      await page.close();
    }
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await updateSiteConfigValue(page, 'KIT_SERVER_ALLOWLIST', '');
      if (prototypeId) {
        await deletePrototypeViaApi(page, prototypeId);
      }
      if (modelId) {
        await deleteModelViaApi(page, modelId);
      }
      if (nonAdminUser?.id) {
        await deleteTestUserViaApi(page, nonAdminUser.id);
      }
    } finally {
      await page.close();
    }
  });

  test('non-admin with empty allowlist cannot configure custom server and planted localStorage value is ignored', async ({
    page,
  }) => {
    test.setTimeout(120000);
    await updateSiteConfigValue(page, 'KIT_SERVER_ALLOWLIST', '');

    const evilRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('evil.example')) {
        evilRequests.push(req.url());
      }
    });
    page.on('websocket', (ws) => {
      if (ws.url().includes('evil.example')) {
        evilRequests.push(ws.url());
      }
    });

    await page.addInitScript(() => {
      localStorage.setItem('customKitServer', 'https://evil.example');
    });

    await loginAs(page, nonAdminUser!.email, nonAdminPassword);
    await goToPrototypeCodeTab(page, modelId, prototypeId);
    await expandRuntimePanel(page);

    await expect(getRuntimeHeaderOptionsTrigger(page)).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Config Runtime Server' })).toHaveCount(0);
    await expect(page.getByTestId('custom-kit-server-warning')).toHaveCount(0);

    await page.waitForTimeout(1500);
    expect(evilRequests).toEqual([]);
  });

  test('non-admin with KIT_SERVER_ALLOWLIST can save allowlisted host and is blocked from disallowed host', async ({
    page,
  }) => {
    test.setTimeout(120000);
    await updateSiteConfigValue(page, 'KIT_SERVER_ALLOWLIST', 'kit.allowed.test');

    await loginAs(page, nonAdminUser!.email, nonAdminPassword);
    await page.evaluate(() => localStorage.removeItem('customKitServer'));
    await goToPrototypeCodeTab(page, modelId, prototypeId);
    await expandRuntimePanel(page);

    const optionsTrigger = getRuntimeHeaderOptionsTrigger(page);
    await expect(optionsTrigger).toBeVisible({ timeout: 15000 });
    await optionsTrigger.click();

    const menuItem = page.getByRole('menuitem', { name: 'Config Runtime Server' });
    await expect(menuItem).toBeVisible({ timeout: 5000 });
    await menuItem.click();

    const dialog = page.getByRole('dialog').filter({
      has: page.getByText('Configure Runtime Server'),
    });
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText(/kit\.allowed\.test/)).toBeVisible();

    const input = dialog.getByPlaceholder('Custom server URL');
    await input.fill('https://kit.allowed.test');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });

    const warningChip = page.getByTestId('custom-kit-server-warning');
    await expect(warningChip).toBeVisible({ timeout: 10000 });
    await expect(warningChip).toContainText('kit.allowed.test');
    expect(await page.evaluate(() => localStorage.getItem('customKitServer'))).toBe(
      'https://kit.allowed.test',
    );

    // Attempt to save disallowed server
    await optionsTrigger.click();
    await page.getByRole('menuitem', { name: 'Config Runtime Server' }).click();
    await expect(dialog).toBeVisible({ timeout: 10000 });

    await input.fill('https://evil.example');
    await dialog.getByRole('button', { name: 'Save' }).click();

    const errorEl = dialog.getByTestId('kit-server-error');
    await expect(errorEl).toBeVisible({ timeout: 5000 });
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('customKitServer'))).toBe(
      'https://kit.allowed.test',
    );

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });

  test('admin with empty allowlist can save an arbitrary custom server URL and see warning chip', async ({
    page,
  }) => {
    test.setTimeout(120000);
    await updateSiteConfigValue(page, 'KIT_SERVER_ALLOWLIST', '');

    await loginAsAdmin(page);
    await page.evaluate(() => localStorage.removeItem('customKitServer'));
    await goToPrototypeCodeTab(page, modelId, prototypeId);
    await expandRuntimePanel(page);

    const optionsTrigger = getRuntimeHeaderOptionsTrigger(page);
    await expect(optionsTrigger).toBeVisible({ timeout: 15000 });
    await optionsTrigger.click();

    const menuItem = page.getByRole('menuitem', { name: 'Config Runtime Server' });
    await expect(menuItem).toBeVisible({ timeout: 5000 });
    await menuItem.click();

    const dialog = page.getByRole('dialog').filter({
      has: page.getByText('Configure Runtime Server'),
    });
    await expect(dialog).toBeVisible({ timeout: 10000 });

    const input = dialog.getByPlaceholder('Custom server URL');
    await input.fill('https://arbitrary-admin-kit.example:8443');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });

    const warningChip = page.getByTestId('custom-kit-server-warning');
    await expect(warningChip).toBeVisible({ timeout: 10000 });
    await expect(warningChip).toContainText('arbitrary-admin-kit.example:8443');
    expect(await page.evaluate(() => localStorage.getItem('customKitServer'))).toBe(
      'https://arbitrary-admin-kit.example:8443',
    );
  });
});
