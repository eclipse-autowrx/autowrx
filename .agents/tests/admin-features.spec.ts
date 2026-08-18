import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestUserViaApi,
  deleteTestUserViaApi,
  fetchFeatureRolesViaApi,
  removeRoleFromUserViaApi,
} from './helpers';

test.describe('Feature Management', () => {
  let testUserId: string | undefined;
  let assignedRoleId: string | undefined;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    if (testUserId && assignedRoleId) {
      await removeRoleFromUserViaApi(page, testUserId, assignedRoleId).catch(() => {});
    }
    if (testUserId) {
      await deleteTestUserViaApi(page, testUserId).catch(() => {});
    }
    testUserId = undefined;
    assignedRoleId = undefined;
  });

  test('8: assign user to feature via UI', async ({ page }) => {
    const testUser = await createTestUserViaApi(page);
    testUserId = testUser.id;

    const features = await fetchFeatureRolesViaApi(page);
    expect(features.length).toBeGreaterThan(0);
    const feature = features[0];
    assignedRoleId = feature.id;

    await page.goto('/manage-features');
    await page.waitForTimeout(3000);

    await expect(page.getByRole('heading', { name: 'Feature Management' })).toBeVisible({
      timeout: 15000,
    });

    await page.locator('div.cursor-pointer').filter({ hasText: feature.name }).first().click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Add User' }).click();
    await expect(page.getByText('Select user')).toBeVisible({ timeout: 10000 });

    const userRow = page.locator('div.cursor-pointer').filter({ hasText: testUser.email }).first();
    await expect(userRow).toBeVisible({ timeout: 15000 });
    await userRow.click();
    await page.waitForTimeout(2000);

    await expect(page.getByText(testUser.email)).toBeVisible({ timeout: 10000 });

    await page.reload();
    await page.waitForTimeout(3000);
    await page.locator('div.cursor-pointer').filter({ hasText: feature.name }).first().click();
    await page.waitForTimeout(500);
    await expect(page.getByText(testUser.email)).toBeVisible({ timeout: 10000 });

    await saveScreenshot(page, 'feature-user-assigned');
  });
});
