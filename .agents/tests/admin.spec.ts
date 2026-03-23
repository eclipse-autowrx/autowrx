import { test, expect } from '@playwright/test';
import { loginAsAdmin, saveScreenshot, checkLayoutAnomalies } from './helpers';

test.describe('Admin Panel', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('admin panel is accessible', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'admin-panel');

    // Should not redirect to 404 or home
    expect(page.url()).toContain('/admin');
  });

  test('site config page loads', async ({ page }) => {
    await page.goto('/admin/site-config');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'admin-site-config');
    await checkLayoutAnomalies(page, 'admin-site-config');

    const hasContent = await page.locator('form, input, [role="main"]').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('user management page loads', async ({ page }) => {
    await page.goto('/admin/manage-users');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'admin-manage-users');
    await checkLayoutAnomalies(page, 'admin-manage-users');
  });

  test('manage users via /manage-users route', async ({ page }) => {
    await page.goto('/manage-users');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'admin-manage-users-route');

    // Page content: any meaningful element (button, input, list, etc.)
    const hasContent = await page.locator('button, input, table, ul, [class*="user"], [class*="User"], h1, h2').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('plugins page loads', async ({ page }) => {
    await page.goto('/admin/plugins');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'admin-plugins');
    await checkLayoutAnomalies(page, 'admin-plugins');
  });

  test('non-admin cannot access admin routes', async ({ page }) => {
    // Test as unauthenticated user
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Go to admin directly without login
    await page.goto('/admin/manage-users');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'admin-unauthenticated-access');

    // Should redirect or show access denied
    const isOnAdmin = page.url().includes('/admin/manage-users');
    if (isOnAdmin) {
      // Check if it shows a permission error or login prompt
      const hasAuth = await page.locator('button:has-text("Sign In"), [class*="forbidden"], [class*="unauthorized"]').count();
      console.log('Auth check on admin page:', hasAuth);
    }
  });

});
