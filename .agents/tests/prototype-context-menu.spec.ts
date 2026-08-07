import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  loginAs,
  logout,
  saveScreenshot,
  createTestUserViaApi,
  createTestModelViaApi,
  createTestPrototype,
  deleteModelViaApi,
  deleteTestUserViaApi,
  openPrototypeContextMenu,
  confirmNameDialog,
  searchPrototypeLibrary,
  TEST_USER,
} from './helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Prototype Context Menu - Admin Delete', () => {
  test.setTimeout(90000);

  let testUserId: string | null = null;
  let modelId: string | null = null;

  test.afterEach(async ({ page }) => {
    await loginAsAdmin(page);
    if (modelId) {
      await deleteModelViaApi(page, modelId).catch(() => {});
      modelId = null;
    }
    if (testUserId) {
      await deleteTestUserViaApi(page, testUserId).catch(() => {});
      testUserId = null;
    }
  });

  test('admin can delete another user prototype via context menu', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `E2E_AdminDeleteModel_${timestamp}`;
    const protoName = `E2E_AdminDeleteProto_${timestamp}`;

    await loginAsAdmin(page);
    const testUser = await createTestUserViaApi(page, {
      email: `e2e_admin_delete_${timestamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E User ${timestamp}`,
    });
    testUserId = testUser.id;

    await logout(page);
    await loginAs(page, testUser.email, TEST_USER.password);
    modelId = await createTestModelViaApi(page, modelName, 'private');
    await createTestPrototype(page, protoName, modelId);

    await logout(page);
    await loginAsAdmin(page);

    await page.goto(`/model/${modelId}/library/list`);
    await page.waitForTimeout(3000);
    await searchPrototypeLibrary(page, protoName);

    const protoCard = page.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`).first();
    await expect(protoCard).toBeVisible({ timeout: 20000 });

    await openPrototypeContextMenu(page, protoName);
    await expect(page.getByRole('menuitem', { name: 'Delete Prototype' })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('menuitem', { name: 'Delete Prototype' }).click();
    await confirmNameDialog(page, protoName);

    await page.reload();
    await page.waitForTimeout(3000);
    await searchPrototypeLibrary(page, protoName);
    await expect(page.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`)).toHaveCount(0, {
      timeout: 15000,
    });

    await saveScreenshot(page, 'prototype-admin-context-delete');
  });
});
