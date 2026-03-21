import { test, expect } from '@playwright/test';
import { loginAsAdmin, saveScreenshot, checkLayoutAnomalies } from './helpers';

test.describe('Prototypes - CRUD', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('prototype library page loads', async ({ page }) => {
    await page.goto('/model');
    await page.waitForTimeout(2000);

    // Navigate into first model
    const firstModel = page.locator('a[href*="/model/"]').first();
    if (await firstModel.count() === 0) {
      console.log('No models found — skipping');
      test.skip();
      return;
    }

    await firstModel.click();
    await page.waitForTimeout(2000);

    // Go to library tab
    const libraryTab = page.locator('a:has-text("Library"), button:has-text("Library"), [href*="library"]').first();
    if (await libraryTab.count() > 0) {
      await libraryTab.click();
      await page.waitForTimeout(2000);
    }

    await saveScreenshot(page, 'prototype-library');
    await checkLayoutAnomalies(page, 'prototype-library');
  });

  test('create a new prototype', async ({ page }) => {
    await page.goto('/new-prototype');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'prototype-create-page');

    const nameInput = page.locator('input[placeholder*="name" i], input[name="name"]').first();
    if (await nameInput.count() === 0) {
      console.log('No create form found — skipping');
      test.skip();
      return;
    }

    const protoName = `TestProto_${Date.now()}`;
    await nameInput.fill(protoName);
    await page.waitForTimeout(500);
    await saveScreenshot(page, 'prototype-create-filled');

    const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await saveScreenshot(page, 'prototype-after-create');
    }
  });

  test('my assets page loads', async ({ page }) => {
    await page.goto('/my-assets');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'prototype-my-assets');
    await checkLayoutAnomalies(page, 'my-assets');

    const hasContent = await page.locator('main, [role="main"]').count();
    expect(hasContent).toBeGreaterThan(0);
  });

});
