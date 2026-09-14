import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, saveScreenshot, ADMIN } from './helpers';

test.describe('Authentication', () => {

  test('homepage loads and shows Sign In button', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'auth-homepage');

    const signInBtn = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    await expect(signInBtn).toBeVisible();
  });

  test('login modal opens on Sign In click', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    await page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first().click();
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'auth-login-modal');

    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]').first()).toBeVisible();
  });

  test('admin can login successfully', async ({ page }) => {
    await loginAsAdmin(page);
    await saveScreenshot(page, 'auth-after-login');

    // Should no longer show Sign In button — user is logged in
    const signInBtn = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    await expect(signInBtn).not.toBeVisible({ timeout: 5000 });
  });

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    await page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first().click();
    await page.waitForTimeout(1000);

    const passInput = page.locator('input[type="password"]').first();
    await page.locator('input[type="email"], input[placeholder*="email" i]').first().fill(ADMIN.email);
    await passInput.fill('wrongpassword123');
    // Use Enter key — modal overlay blocks button click
    await passInput.press('Enter');
    await page.waitForTimeout(2500);
    await saveScreenshot(page, 'auth-wrong-password');

    // Should still show password field (login failed) or show error toast
    const stillOnLogin = await page.locator('input[type="password"]').isVisible().catch(() => false);
    const hasError = await page.locator('[role="alert"], .toast, [class*="error" i], [class*="toast"]').count() > 0;
    expect(hasError || stillOnLogin).toBeTruthy();
  });

  test('admin can logout', async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForTimeout(1000);
    await logout(page);
    await saveScreenshot(page, 'auth-after-logout');

    const signInBtn = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    await expect(signInBtn).toBeVisible({ timeout: 5000 });
  });

});
