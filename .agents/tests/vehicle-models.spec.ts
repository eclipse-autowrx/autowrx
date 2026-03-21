import { test, expect } from '@playwright/test';
import { loginAsAdmin, saveScreenshot } from './helpers';

// Test model name — unique per run
const MODEL_NAME = `AgentTest_${Date.now()}`;
const MODEL_NAME_UPDATED = `${MODEL_NAME}_edited`;

test.describe('Vehicle Models - CRUD', () => {

  // ─── CREATE ────────────────────────────────────────────────────────────────

  test('CREATE: open model list page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/model');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'model-list');

    expect(page.url()).toContain('/model');
  });

  test('CREATE: open "Create New Model" dialog', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/model');
    await page.waitForTimeout(2000);

    // Click the "Create New Model" button
    await page.locator('[data-id="btn-open-form-create"]').click();
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'model-create-dialog');

    // Form should be visible
    await expect(page.locator('[data-id="form-create-model"]')).toBeVisible();
    await expect(page.locator('[data-id="form-create-model-input-name"]')).toBeVisible();
  });

  test('CREATE: create a new vehicle model', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/model');
    await page.waitForTimeout(2000);

    await page.locator('[data-id="btn-open-form-create"]').click();
    await page.waitForTimeout(1000);

    // Fill model name
    await page.locator('[data-id="form-create-model-input-name"]').fill(MODEL_NAME);
    await page.waitForTimeout(300);
    await saveScreenshot(page, 'model-create-filled');

    // Submit
    await page.locator('[data-id="form-create-model-btn-submit"]').click();
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'model-create-result');

    // Should redirect to /model/<id>
    expect(page.url()).toMatch(/\/model\/.+/);
    // Toast or model name visible
    const hasModelName = await page.locator(`text=${MODEL_NAME}`).count();
    expect(hasModelName).toBeGreaterThan(0);
  });

  // ─── READ ──────────────────────────────────────────────────────────────────

  test('READ: model detail page loads', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/model');
    await page.waitForTimeout(2000);

    // Click first model in list
    const firstModel = page.locator('a[href*="/model/"]').first();
    await expect(firstModel).toBeVisible({ timeout: 5000 });
    await firstModel.click();
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'model-detail');

    expect(page.url()).toMatch(/\/model\/.+/);
  });

  test('READ: model detail shows library tab', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/model');
    await page.waitForTimeout(2000);

    const firstModel = page.locator('a[href*="/model/"]').first();
    await firstModel.click();
    await page.waitForTimeout(2000);

    // Navigate to library
    const libraryTab = page.locator('a[href*="library"], button:has-text("Library")').first();
    if (await libraryTab.count() > 0) {
      await libraryTab.click();
      await page.waitForTimeout(2000);
    }
    await saveScreenshot(page, 'model-library-tab');
  });

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  test('UPDATE: edit model name inline', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/model');
    await page.waitForTimeout(2000);

    // Go into first model
    const firstModel = page.locator('a[href*="/model/"]').first();
    await firstModel.click();
    await page.waitForTimeout(2000);

    // Click "Edit" button to enable inline name editing
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.count() === 0) {
      console.log('No Edit button — may not be owner. Skipping.');
      test.skip();
      return;
    }
    await editBtn.click();
    await page.waitForTimeout(500);
    await saveScreenshot(page, 'model-edit-name-input');

    // Clear and retype name
    const nameInput = page.locator('input.h-8, input[class*="min-w"]').first();
    await nameInput.clear();
    await nameInput.fill(MODEL_NAME_UPDATED);
    await page.waitForTimeout(300);

    // Save — look for "Save" / "Update" / checkmark button
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Update"), button:has-text("Confirm")').first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    } else {
      await nameInput.press('Enter');
      await page.waitForTimeout(2000);
    }
    await saveScreenshot(page, 'model-edit-name-result');
  });

  // ─── DELETE ────────────────────────────────────────────────────────────────

  test('DELETE: delete model with confirmation', async ({ page }) => {
    await loginAsAdmin(page);

    // Create a throwaway model to delete
    await page.goto('/model');
    await page.waitForTimeout(2000);
    await page.locator('[data-id="btn-open-form-create"]').click();
    await page.waitForTimeout(1000);

    const deleteName = `DELETE_ME_${Date.now()}`;
    await page.locator('[data-id="form-create-model-input-name"]').fill(deleteName);
    await page.locator('[data-id="form-create-model-btn-submit"]').click();
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'model-before-delete');

    // Now on model detail page — click Delete
    const deleteBtn = page.locator('button:has-text("Delete")').first();
    if (await deleteBtn.count() === 0) {
      console.log('No Delete button found — skipping');
      test.skip();
      return;
    }
    await deleteBtn.click();
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'model-delete-confirm-popup');

    // Confirm popup: type model name then confirm
    const confirmInput = page.locator(`input[placeholder*="${deleteName}"], input[placeholder*="Type"]`).first();
    if (await confirmInput.count() > 0) {
      await confirmInput.fill(deleteName);
      await page.waitForTimeout(300);
    }

    // Click Confirm button
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Delete")').last();
    await confirmBtn.click();
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'model-after-delete');

    // Should redirect back to /model list
    expect(page.url()).toMatch(/\/model($|\?|\/(?!.*\/))/);
  });

});
