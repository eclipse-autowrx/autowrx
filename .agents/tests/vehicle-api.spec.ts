import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestModelViaApi,
  goToVehicleApiTab,
} from './helpers';

test.describe('Vehicle API', () => {
  let modelId: string;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    const modelName = `E2E_VehicleAPI_${Date.now()}`;
    modelId = await createTestModelViaApi(page, modelName, 'public');
  });

  test('1: signal list loads on Vehicle API tab', async ({ page }) => {
    await goToVehicleApiTab(page, modelId);

    await expect(page.locator('.da-page-vehicle-api-tab-bar')).toBeVisible();
    const signals = page.locator('.signal-list-item-name');
    await expect(signals.first()).toBeVisible({ timeout: 20000 });
    expect(await signals.count()).toBeGreaterThan(0);

    await saveScreenshot(page, 'vehicle-api-signal-list');
  });

  test('2: search filters signals by name', async ({ page }) => {
    await goToVehicleApiTab(page, modelId);

    const signals = page.locator('.signal-list-item-name');
    await expect(signals.first()).toBeVisible({ timeout: 20000 });
    const initialCount = await signals.count();
    expect(initialCount).toBeGreaterThan(0);

    const firstSignalName = (await signals.first().textContent())?.trim() || '';
    const searchTerm = firstSignalName.split('.')[0] || 'Vehicle';

    const searchInput = page.locator('[data-id="search-signal-input"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(800);

    const filteredNames = await signals.allTextContents();
    expect(filteredNames.length).toBeGreaterThan(0);
    expect(filteredNames.length).toBeLessThanOrEqual(initialCount);
    for (const name of filteredNames) {
      expect(name.toLowerCase()).toContain(searchTerm.toLowerCase());
    }

    expect(page.url()).toContain(`search=${encodeURIComponent(searchTerm)}`);

    await saveScreenshot(page, 'vehicle-api-search-filtered');
  });
});
