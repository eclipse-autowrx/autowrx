import { test, expect } from '@playwright/test';

test('debug login - press Enter', async ({ page }) => {
  await page.goto('http://192.168.1.6:3210');
  await page.waitForTimeout(2000);

  // Click Sign In
  await page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first().click();
  await page.waitForTimeout(1500);

  // Fill credentials
  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
  const passInput = page.locator('input[type="password"]').first();

  await emailInput.fill('admin89@email.com');
  await passInput.fill('789789789');
  await page.waitForTimeout(500);

  // Press Enter to submit
  await passInput.press('Enter');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'tests/screenshots/login-enter-result.png' });

  const signInStillVisible = await page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first().isVisible().catch(() => false);
  console.log('Sign In still visible:', signInStillVisible);
  console.log('LOGIN SUCCESS:', !signInStillVisible);

  // Check console for errors
});

test('debug login - via API then set cookie/storage', async ({ page }) => {
  // Login via API directly
  const response = await page.request.post('http://192.168.1.6:3200/v2/auth/login', {
    data: { email: 'admin89@email.com', password: '789789789' }
  });
  const data = await response.json();
  console.log('API login status:', response.status());
  console.log('Token received:', !!data?.tokens?.access?.token);

  if (data?.tokens?.access?.token) {
    // Set token in localStorage
    await page.goto('http://192.168.1.6:3210');
    await page.waitForTimeout(1500);
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('access_token', token);
      // Common key names
      sessionStorage.setItem('token', token);
    }, data.tokens.access.token);

    await page.reload();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/login-api-result.png' });

    const signInVisible = await page.locator('button:has-text("Sign In")').isVisible().catch(() => false);
    console.log('Sign In visible after token inject:', signInVisible);
  }
});
