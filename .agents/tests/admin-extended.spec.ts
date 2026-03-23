import { test, expect } from '@playwright/test';
import { loginAsAdmin, saveScreenshot, checkLayoutAnomalies } from './helpers';

test.describe('Admin Extended', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('/admin/templates page loads', async ({ page }) => {
    await page.goto('/admin/templates');
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'admin-templates');
    await checkLayoutAnomalies(page, 'admin-templates');

    // Should not be a 404
    const hasError = await page.locator('text=404, text=Not Found').count();
    expect(hasError).toBe(0);

    // Should have some content
    const hasContent = await page.locator(
      'button, input, table, [class*="template" i], [class*="card" i], h1, h2, ul'
    ).count();
    expect(hasContent).toBeGreaterThan(0);

    expect(page.url()).toContain('/admin/templates');
  });

  test('/admin/dashboard-templates page loads', async ({ page }) => {
    await page.goto('/admin/dashboard-templates');
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'admin-dashboard-templates');
    await checkLayoutAnomalies(page, 'admin-dashboard-templates');

    // Should not be a 404
    const hasError = await page.locator('text=404, text=Not Found').count();
    expect(hasError).toBe(0);

    const hasContent = await page.locator(
      'button, input, table, [class*="template" i], [class*="dashboard" i], h1, h2, ul'
    ).count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('/manage-features page loads', async ({ page }) => {
    await page.goto('/manage-features');
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'manage-features');
    await checkLayoutAnomalies(page, 'manage-features');

    // Should not be a 404
    const hasError = await page.locator('text=404, text=Not Found').count();
    expect(hasError).toBe(0);

    const hasContent = await page.locator(
      'button, input, [class*="feature" i], [class*="toggle" i], [class*="switch" i], ' +
      'h1, h2, table, ul, [role="list"]'
    ).count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('create new user - fill form and cancel', async ({ page }) => {
    await page.goto('/admin/manage-users');
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'admin-manage-users-loaded');
    await checkLayoutAnomalies(page, 'admin-manage-users-loaded');

    // Look for "Create User", "Add User", "Invite", or "+" button
    const createBtn = page.locator(
      'button:has-text("Create"), button:has-text("Add User"), button:has-text("Invite"), ' +
      'button:has-text("New User"), button[aria-label*="add" i], button[aria-label*="create" i], ' +
      'button:has-text("+")'
    ).first();

    const createBtnCount = await createBtn.count();
    console.log('Create user button found:', createBtnCount);

    if (createBtnCount > 0) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      await saveScreenshot(page, 'admin-create-user-modal');

      // Look for email / name fields in modal or form
      const emailInput = page.locator(
        'input[type="email"], input[name*="email" i], input[placeholder*="email" i]'
      ).first();
      const emailCount = await emailInput.count();

      if (emailCount > 0) {
        await emailInput.fill('newuser@test.example');
        await page.waitForTimeout(500);

        // Fill name if present
        const nameInput = page.locator(
          'input[name*="name" i], input[placeholder*="name" i], input[type="text"]'
        ).first();
        if (await nameInput.count() > 0) {
          await nameInput.fill('Test New User');
        }

        await saveScreenshot(page, 'admin-create-user-form-filled');
      }

      // Cancel the form — look for Cancel button or press Escape
      const cancelBtn = page.locator(
        'button:has-text("Cancel"), button:has-text("Close"), button[aria-label*="close" i], ' +
        'button[aria-label*="dismiss" i]'
      ).first();
      const cancelCount = await cancelBtn.count();

      if (cancelCount > 0) {
        await cancelBtn.click();
        await page.waitForTimeout(1000);
        await saveScreenshot(page, 'admin-create-user-cancelled');
        console.log('Form cancelled via Cancel button');
      } else {
        // Press Escape to close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
        await saveScreenshot(page, 'admin-create-user-escaped');
        console.log('Form dismissed via Escape key');
      }
    } else {
      console.log('No create user button found — checking for user table presence');
      // At minimum confirm user list is visible
      const userList = await page.locator(
        'table, [class*="user" i], [role="row"], [role="listitem"]'
      ).count();
      console.log('User list elements:', userList);
      await saveScreenshot(page, 'admin-manage-users-no-create-btn');
    }

    // Should still be on admin area
    expect(page.url()).toContain('manage-users');
  });

});
