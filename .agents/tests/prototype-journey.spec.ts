import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestPrototype,
  goToPrototypeJourneyTab,
  createTestModelViaApi,
} from './helpers';

test.describe('Prototype Customer Journey', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('7: add row and save journey matrix', async ({ page }) => {
    const protoName = `E2E_Journey_${Date.now()}`;
    const rowLabel = `E2E_Row_${Date.now()}`;
    const modelId = await createTestModelViaApi(page, `E2E_Journey_Model_${Date.now()}`, 'public');
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);

    await goToPrototypeJourneyTab(page, modelId, prototypeId);

    await expect(page.getByRole('heading', { name: 'Customer Journey' })).toBeVisible({
      timeout: 15000,
    });

    const editBtn = page.locator('[data-id="prototype-edit-button"]');
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();
    await expect(page.locator('[data-id="prototype-save-button"]')).toBeVisible({
      timeout: 10000,
    });

    await page.locator('[data-id="journey-edit-add-row-btn"]').click();
    await page.waitForTimeout(500);

    await page.locator('.journey-edit-row-name').last().click();
    const rowInput = page.locator('[data-id="journey-edit-row-input"]');
    await expect(rowInput).toBeVisible({ timeout: 10000 });
    await rowInput.fill(rowLabel);

    await page.locator('[data-id="prototype-save-button"]').click();
    await page.waitForTimeout(3000);

    await expect(page.locator('[data-id="prototype-save-button"]')).toBeHidden({
      timeout: 15000,
    });
    await expect(page.getByText(rowLabel)).toBeVisible({ timeout: 10000 });

    await saveScreenshot(page, 'journey-row-saved');
  });
});
