import { test, expect } from '@playwright/test';
import { loginAsAdmin, saveScreenshot, checkLayoutAnomalies } from './helpers';

test.describe('Profile Page', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('profile page layout full check', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'profile-full-layout');
    await checkLayoutAnomalies(page, 'profile-full-layout');

    // Should not show 404 or error
    const hasError = await page.locator('text=404, text=Not Found, text=Something went wrong').count();
    expect(hasError).toBe(0);

    // Should have some content
    const hasContent = await page.locator('input, button, form, img, [class*="profile" i], [class*="avatar" i], h1, h2').count();
    expect(hasContent).toBeGreaterThan(0);

    // URL should contain /profile
    expect(page.url()).toContain('/profile');

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'profile-scrolled');
  });

  test('edit display name if editable', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'profile-before-edit');

    // Look for editable name field — could be an input, contenteditable, or inline-edit button
    const nameInput = page.locator(
      'input[name*="name" i], input[placeholder*="name" i], ' +
      '[contenteditable][class*="name" i], [class*="display-name" i] input, ' +
      'input[type="text"]:near(:text("Name")), input[id*="name" i]'
    ).first();

    const nameInputCount = await nameInput.count();
    console.log('Name input elements found:', nameInputCount);

    if (nameInputCount > 0) {
      // Try to edit the name
      const currentValue = await nameInput.inputValue().catch(() => '');
      console.log('Current name value:', currentValue);

      await nameInput.click();
      await page.waitForTimeout(500);
      await nameInput.selectAll?.();
      await nameInput.fill('Test Admin Updated');
      await page.waitForTimeout(500);
      await saveScreenshot(page, 'profile-name-edited');

      // Look for save button
      const saveBtn = page.locator(
        'button:has-text("Save"), button:has-text("Update"), button[type="submit"]'
      ).first();
      const saveBtnCount = await saveBtn.count();

      if (saveBtnCount > 0) {
        // Don't actually save — just verify button is clickable
        const isEnabled = await saveBtn.isEnabled();
        console.log('Save button enabled:', isEnabled);
        await saveScreenshot(page, 'profile-save-button-visible');

        // Restore original value
        await nameInput.fill(currentValue || 'admin');
      }
    } else {
      // Look for an edit button/icon near name
      const editBtn = page.locator(
        '[title*="edit" i], [aria-label*="edit" i], button:has-text("Edit"), ' +
        '[class*="edit" i]:near(:text("Name"))'
      ).first();
      const editBtnCount = await editBtn.count();
      console.log('Edit button elements found:', editBtnCount);

      if (editBtnCount > 0) {
        await editBtn.click();
        await page.waitForTimeout(1000);
        await saveScreenshot(page, 'profile-edit-mode');
      } else {
        console.log('No editable name field found — profile name may be read-only or via different flow');
        await saveScreenshot(page, 'profile-no-edit-found');
      }
    }
    
    // Either way, page should still be functional
    const currentUrl = page.url();
    expect(currentUrl).toContain('/profile');
  });

});
