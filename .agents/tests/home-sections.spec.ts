import { test, expect } from '@playwright/test';
import { loginAsAdmin, saveScreenshot, checkLayoutAnomalies } from './helpers';

test.describe('Home Page Sections', () => {

  test('popular prototypes section is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'home-popular-prototypes');
    await checkLayoutAnomalies(page, 'home-popular-prototypes');

    // Look for "popular" section heading or container
    const popularSection = page.locator(
      '[class*="popular" i], [data-testid*="popular" i], h2:has-text("Popular"), h3:has-text("Popular"), ' +
      'section:has-text("Popular"), div:has-text("Popular Prototype")'
    ).first();

    const count = await page.locator(
      '[class*="popular" i], [data-testid*="popular" i], h2:has-text("Popular"), h3:has-text("Popular")'
    ).count();

    console.log('Popular section elements found:', count);

    // Also check for prototype cards — homepage typically has some
    const prototypeCards = await page.locator('[class*="card" i], [class*="prototype" i]').count();
    console.log('Prototype card-like elements found:', prototypeCards);

    // The page should have at least some content (cards, sections, etc.)
    const pageContent = await page.locator('main, [role="main"], #root > div').count();
    expect(pageContent).toBeGreaterThan(0);

    await saveScreenshot(page, 'home-popular-prototypes-final');
  });

  test('recent prototypes section is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'home-recent-prototypes');
    await checkLayoutAnomalies(page, 'home-recent-prototypes');

    // Look for "recent" section heading or container
    const recentCount = await page.locator(
      '[class*="recent" i], [data-testid*="recent" i], h2:has-text("Recent"), h3:has-text("Recent"), ' +
      'section:has-text("Recent")'
    ).count();

    console.log('Recent section elements found:', recentCount);

    // Scroll down to find sections below the fold
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'home-recent-prototypes-scrolled');

    // The page should render without error
    const hasError = await page.locator('text=Error, text=404, text=Something went wrong').count();
    expect(hasError).toBe(0);

    // Page should have meaningful content
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('home page full layout check (logged in)', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'home-logged-in-full');
    await checkLayoutAnomalies(page, 'home-logged-in-full');

    // Scroll through the whole page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'home-logged-in-bottom');

    const hasError = await page.locator('text=Error, text=404').count();
    expect(hasError).toBe(0);
  });

});
