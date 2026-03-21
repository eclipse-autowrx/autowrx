import { test, expect } from '@playwright/test';
import { loginAsAdmin, saveScreenshot, checkLayoutAnomalies } from './helpers';

test.describe('My Assets Page', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('my-assets page loads with content', async ({ page }) => {
    await page.goto('/my-assets');
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'my-assets-loaded');
    await checkLayoutAnomalies(page, 'my-assets-loaded');

    // Should not show 404 or error
    const hasError = await page.locator('text=404, text=Not Found').count();
    expect(hasError).toBe(0);

    // Should be on the assets page
    expect(page.url()).toContain('/my-assets');

    // Page should have some content
    const hasContent = await page.locator(
      'button, input, [class*="card" i], [class*="asset" i], [class*="item" i], ' +
      'h1, h2, ul, table, [role="list"]'
    ).count();
    expect(hasContent).toBeGreaterThan(0);

    // Scroll through the page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'my-assets-scrolled');
  });

  test('filter tabs are visible if any', async ({ page }) => {
    await page.goto('/my-assets');
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'my-assets-tabs');

    // Look for tabs / filter buttons
    const tabsCount = await page.locator(
      '[role="tab"], [class*="tab" i], button:has-text("Model"), button:has-text("Prototype"), ' +
      'button:has-text("All"), [class*="filter" i]'
    ).count();

    console.log('Filter tab elements found:', tabsCount);

    if (tabsCount > 0) {
      // Click first tab to see if it filters
      const firstTab = page.locator(
        '[role="tab"], [class*="tab" i], button:has-text("Model"), button:has-text("Prototype"), ' +
        'button:has-text("All")'
      ).first();
      await firstTab.click();
      await page.waitForTimeout(2000);
      await saveScreenshot(page, 'my-assets-tab-clicked');

      // Try second tab if there are multiple
      if (tabsCount >= 2) {
        const secondTab = page.locator(
          '[role="tab"], [class*="tab" i], button:has-text("Model"), button:has-text("Prototype"), ' +
          'button:has-text("All")'
        ).nth(1);
        await secondTab.click();
        await page.waitForTimeout(2000);
        await saveScreenshot(page, 'my-assets-tab2-clicked');
      }
    } else {
      console.log('No filter tabs found — page may show all assets without filtering');
      await saveScreenshot(page, 'my-assets-no-tabs');
    }

    // Page should remain functional
    expect(page.url()).toContain('/my-assets');
  });

});
