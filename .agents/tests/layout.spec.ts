import { test, expect } from '@playwright/test';
import { loginAsAdmin, saveScreenshot, checkLayoutAnomalies } from './helpers';

test.describe('Layout & Visual', () => {

  test('homepage - full layout snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const anomalies = await checkLayoutAnomalies(page, 'homepage');
    await saveScreenshot(page, 'layout-homepage');

    if (anomalies.length > 0) {
      console.warn('⚠️ LAYOUT ANOMALY on homepage:', anomalies);
    }
    expect(anomalies.length).toBe(0);
  });

  test('navigation bar is visible and intact', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    const navbar = page.locator('nav, header, [role="navigation"], [class*="navbar"], [class*="header"]').first();
    await expect(navbar).toBeVisible();

    const navRect = await navbar.boundingBox();
    expect(navRect?.height).toBeGreaterThan(30);
    await saveScreenshot(page, 'layout-navbar');
  });

  test('footer is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    const footer = page.locator('footer, [class*="footer"]').first();
    if (await footer.count() > 0) {
      const isVisible = await footer.isVisible();
      console.log('Footer visible:', isVisible);
    }
    await saveScreenshot(page, 'layout-footer');
  });

  test('logged-in layout has no broken elements', async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForTimeout(1500);

    const anomalies = await checkLayoutAnomalies(page, 'logged-in-homepage');
    await saveScreenshot(page, 'layout-logged-in');

    if (anomalies.length > 0) {
      console.warn('⚠️ LAYOUT ANOMALY (logged in):', anomalies);
    }
    expect(anomalies.length).toBe(0);
  });

  test('model list page layout', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/model');
    await page.waitForTimeout(2000);

    const anomalies = await checkLayoutAnomalies(page, 'models-page');
    await saveScreenshot(page, 'layout-models');

    if (anomalies.length > 0) {
      console.warn('⚠️ LAYOUT ANOMALY on models page:', anomalies);
    }
    expect(anomalies.length).toBe(0);
  });

  test('profile page layout', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/profile');
    await page.waitForTimeout(2000);

    await saveScreenshot(page, 'layout-profile');
    await checkLayoutAnomalies(page, 'profile');
  });

  test('responsive - full HD desktop (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'layout-fullhd');

    const anomalies = await checkLayoutAnomalies(page, 'fullhd');
    if (anomalies.length > 0) {
      console.warn('⚠️ FULL HD LAYOUT ANOMALY:', anomalies);
    }
  });

});
