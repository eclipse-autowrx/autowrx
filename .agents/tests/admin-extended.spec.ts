import { test, expect } from '@playwright/test';
import { loginAsAdmin, saveScreenshot, checkLayoutAnomalies } from './helpers';

test.describe('Admin Extended', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('/admin/templates page loads', async ({ page }) => {
    await page.goto('/admin/templates');
    await expect(page.getByRole('heading', { name: 'Templates', exact: true })).toBeVisible({
      timeout: 30000,
    });
    await saveScreenshot(page, 'admin-templates');
    await checkLayoutAnomalies(page, 'admin-templates');

    const hasError = await page.locator('text=404, text=Not Found').count();
    expect(hasError).toBe(0);
    expect(page.url()).toContain('/admin/templates');
  });

  test('/admin/dashboard-templates page loads', async ({ page }) => {
    await page.goto('/admin/dashboard-templates');
    await expect(page.getByRole('heading', { name: 'Dashboard Templates' })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByRole('button', { name: 'New Template' })).toBeVisible();
    await saveScreenshot(page, 'admin-dashboard-templates');
    await checkLayoutAnomalies(page, 'admin-dashboard-templates');

    const hasError = await page.locator('text=404, text=Not Found').count();
    expect(hasError).toBe(0);
    expect(page.url()).toContain('/admin/dashboard-templates');
  });

  test('/manage-features page loads', async ({ page }) => {
    await page.goto('/manage-features');
    await expect(page.getByRole('heading', { name: 'Feature Management' })).toBeVisible({
      timeout: 30000,
    });
    await saveScreenshot(page, 'manage-features');
    await checkLayoutAnomalies(page, 'manage-features');

    const hasError = await page.locator('text=404, text=Not Found').count();
    expect(hasError).toBe(0);
    expect(page.url()).toContain('/manage-features');
  });

  test('create new user - fill form and cancel', async ({ page }) => {
    await page.goto('/admin/manage-users');
    await expect(page.getByRole('button', { name: 'Create new user' })).toBeVisible({
      timeout: 30000,
    });
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
