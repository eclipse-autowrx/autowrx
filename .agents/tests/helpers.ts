import { Page, expect } from '@playwright/test';

export const ADMIN = {
  email: process.env.ADMIN_EMAIL || 'admin89@email.com',
  password: process.env.ADMIN_PASSWORD || '789789789',
};

export const TEST_USER = {
  email: 'testuser@autowrx.test',
  password: 'TestPass123!',
  name: 'Test User',
};

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.waitForTimeout(1500);

  // Open login modal
  const signInBtn = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
  await signInBtn.click();
  await page.waitForTimeout(1000);

  await page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  // Press Enter to submit (more reliable than clicking button with overlay)
  await page.locator('input[type="password"]').first().press('Enter');
  await page.waitForTimeout(2500);
}

export async function loginAsAdmin(page: Page) {
  await loginAs(page, ADMIN.email, ADMIN.password);
}

export async function logout(page: Page) {
  // Click user avatar (img[alt="User profile"] inside a ghost button)
  await page.locator('img[alt="User profile"]').first().click();
  await page.waitForTimeout(800);
  // Click Logout in dropdown
  await page.locator('[role="menuitem"]:has-text("Logout")').first().click();
  await page.waitForTimeout(1500);
}

export async function saveScreenshot(page: Page, name: string) {
  // Wait for network to be idle and any animations to settle before capturing
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);
  const path = `tests/screenshots/${name}-${Date.now()}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 Screenshot saved: ${path}`);
  return path;
}

export async function checkLayoutAnomalies(page: Page, testName: string) {
  // Check for common layout issues (skip hidden inputs — they're intentionally zero-size)
  const overlapping = await page.evaluate(() => {
    const elements = document.querySelectorAll('button, a, input:not([type="hidden"])');
    let issues: string[] = [];
    elements.forEach(el => {
      const input = el as HTMLInputElement;
      if (input.type === 'hidden') return;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        issues.push(`Zero-size visible element: ${el.tagName} "${el.textContent?.slice(0,30)}"`);
      }
    });
    return issues;
  });

  if (overlapping.length > 0) {
    await saveScreenshot(page, `layout-anomaly-${testName}`);
    console.warn('⚠️ Layout anomalies detected:', overlapping);
  }
  return overlapping;
}
