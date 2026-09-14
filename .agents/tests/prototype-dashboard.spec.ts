import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestPrototype,
  goToPrototypeDashboard,
  createTestModelViaApi,
} from './helpers';

test.describe('Prototype Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('4: add built-in Terminal widget and save', async ({ page }) => {
    test.setTimeout(120000);
    const protoName = `E2E_Dashboard_${Date.now()}`;
    const modelId = await createTestModelViaApi(page, `E2E_Dash_Model_${Date.now()}`, 'public');
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);

    await goToPrototypeDashboard(page, modelId, prototypeId);

    const editBtn = page.locator('[data-id="dashboard-edit-button"]');
    await expect(editBtn).toBeVisible({ timeout: 15000 });
    await editBtn.click();
    await page.waitForTimeout(2000);

    const deleteAllBtn = page.locator('[data-id="dashboard-delete-all-widgets"]');
    await expect(deleteAllBtn).toBeVisible({ timeout: 10000 });
    await deleteAllBtn.click();
    await page.waitForTimeout(1500);

    const emptyCell = page.locator('.widget-grid-cell-empty').first();
    await emptyCell.scrollIntoViewIfNeeded();
    await expect(emptyCell).toBeVisible({ timeout: 15000 });
    await emptyCell.click();
    await page.waitForTimeout(500);

    const addWidgetBtn = page.locator('[data-id="dashboard-add-widget-button"]');
    await expect(addWidgetBtn).toBeVisible({ timeout: 10000 });
    await addWidgetBtn.click();
    await page.waitForTimeout(1000);

    await expect(page.getByText('Place new widget to dashboard')).toBeVisible({
      timeout: 10000,
    });

    const terminalWidget = page
      .locator('.cursor-pointer.border')
      .filter({ has: page.locator('.widget-list-item-name', { hasText: 'Terminal' }) })
      .first();
    await expect(terminalWidget).toBeVisible({ timeout: 10000 });
    await terminalWidget.click();

    const addSelectedBtn = page.getByRole('button', { name: 'Add selected widget' });
    await expect(addSelectedBtn).toBeEnabled({ timeout: 20000 });
    await addSelectedBtn.click();
    await page.waitForTimeout(1500);

    const saveBtn = page.locator('[data-id="dashboard-save-button"]');
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
    await saveBtn.click();
    await page.waitForTimeout(3000);

    await page.reload();
    await page.waitForTimeout(4000);

    await expect(page.locator('[data-id="dashboard-edit-button"]')).toBeVisible({
      timeout: 15000,
    });

    await saveScreenshot(page, 'dashboard-terminal-widget-saved');
  });
});
