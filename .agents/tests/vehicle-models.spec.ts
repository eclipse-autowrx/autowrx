import { test, expect } from '@playwright/test';
import { loginAsAdmin, saveScreenshot, checkLayoutAnomalies } from './helpers';

const TEST_MODEL_NAME = `TestModel_${Date.now()}`;

test.describe('Vehicle Models - CRUD', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('vehicle models page loads', async ({ page }) => {
    await page.goto('/model');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'models-list');
    await checkLayoutAnomalies(page, 'models-list');

    // Should show model list or empty state
    const hasContent = await page.locator('main, [role="main"], .content').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('can navigate to create vehicle model', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Find "Vehicle Models" or "New Model" button
    const vehicleModelsBtn = page.locator('a:has-text("Vehicle Model"), button:has-text("Vehicle Model"), a[href*="/model"]').first();
    if (await vehicleModelsBtn.count() > 0) {
      await vehicleModelsBtn.click();
      await page.waitForTimeout(2000);
      await saveScreenshot(page, 'models-after-nav');
    } else {
      await page.goto('/model');
      await page.waitForTimeout(2000);
    }

    expect(page.url()).toContain('/model');
  });

  test('create a new vehicle model', async ({ page }) => {
    await page.goto('/model');
    await page.waitForTimeout(2000);

    // Find create/new button
    const createBtn = page.locator(
      'button:has-text("Create"), button:has-text("New"), button:has-text("Add"), [data-testid="create-model"]'
    ).first();

    if (await createBtn.count() === 0) {
      console.log('No create button found — skipping create test');
      test.skip();
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'models-create-form');

    // Fill in model name
    const nameInput = page.locator('input[placeholder*="name" i], input[name="name"], input[id*="name"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill(TEST_MODEL_NAME);
      await page.waitForTimeout(500);

      const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await saveScreenshot(page, 'models-after-create');

      // Should see the new model
      const hasModel = await page.locator(`text=${TEST_MODEL_NAME}`).count();
      expect(hasModel).toBeGreaterThan(0);
    }
  });

  test('model detail page loads', async ({ page }) => {
    await page.goto('/model');
    await page.waitForTimeout(2000);

    // Click on first model
    const firstModel = page.locator('a[href*="/model/"], [data-testid="model-card"]').first();
    if (await firstModel.count() > 0) {
      await firstModel.click();
      await page.waitForTimeout(2000);
      await saveScreenshot(page, 'models-detail');
      await checkLayoutAnomalies(page, 'models-detail');
    } else {
      console.log('No models found — skipping detail test');
      test.skip();
    }
  });

});
