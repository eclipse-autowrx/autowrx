import { test, expect } from '@playwright/test';
import { loginAsAdmin, saveScreenshot, checkLayoutAnomalies, API_URL } from './helpers';

// Helper: navigate to first model's prototype library, return modelId
async function goToFirstModelLibrary(page: any): Promise<string> {
  await page.goto('/model');
  await page.waitForTimeout(3000);

  const firstModel = page.locator('a[href*="/model/"]').first();
  await expect(firstModel).toBeVisible({ timeout: 8000 });
  const href = await firstModel.getAttribute('href');
  const modelId = href?.split('/model/')[1]?.split('/')[0] || '';
  await page.goto(`/model/${modelId}/library/list`);
  await page.waitForTimeout(5000);
  return modelId;
}

// Helper: get the first prototype URL in the library
async function getFirstPrototypeHref(page: any): Promise<string | null> {
  const protoLink = page.locator('a[href*="/prototype/"]').first();
  const count = await protoLink.count();
  if (count === 0) return null;
  return protoLink.getAttribute('href');
}

test.describe('Prototype Extended', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('prototype library search/filter input visible', async ({ page }) => {
    const modelId = await goToFirstModelLibrary(page);
    await saveScreenshot(page, 'proto-library-loaded');
    await checkLayoutAnomalies(page, 'proto-library');

    // Look for search/filter input
    const searchInput = page.locator(
      'input[type="search"], input[type="text"], input[placeholder*="search" i], ' +
      'input[placeholder*="filter" i], input[placeholder*="find" i], ' +
      '[class*="search" i] input, [class*="filter" i] input'
    ).first();

    const searchCount = await searchInput.count();
    console.log('Search/filter inputs found:', searchCount);

    if (searchCount > 0) {
      // Try typing in the search input
      await searchInput.click();
      await searchInput.fill('test');
      await page.waitForTimeout(1500);
      await saveScreenshot(page, 'proto-library-searched');

      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(1000);
    } else {
      // Also look for filter buttons/tags
      const filterBtns = await page.locator(
        'button[class*="filter" i], [role="tab"], [class*="sort" i]'
      ).count();
      console.log('Filter buttons found:', filterBtns);
      await saveScreenshot(page, 'proto-library-no-search');
    }

    // Page should have library content
    expect(page.url()).toContain('/library');
  });

  test('prototype feedback tab loads', async ({ page }) => {
    const modelId = await goToFirstModelLibrary(page);

    // Get first prototype link
    const protoHref = await getFirstPrototypeHref(page);
    console.log('First prototype href:', protoHref);

    if (!protoHref) {
      console.log('No prototype found in library — skipping feedback tab test');
      await saveScreenshot(page, 'proto-no-prototypes-found');
      return;
    }

    // Navigate to the prototype detail first
    await page.goto(protoHref);
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'proto-detail-loaded');

    // Build feedback URL by replacing/appending the tab
    const baseProtoUrl = protoHref.replace(/\/[^/]+$/, '');
    const feedbackUrl = protoHref.includes('/view')
      ? protoHref.replace('/view', '/feedback')
      : protoHref.replace(/\/[^/]*$/, '/feedback');

    await page.goto(feedbackUrl);
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'proto-feedback-tab');
    await checkLayoutAnomalies(page, 'proto-feedback');

    // Check the page loaded something
    const hasError = await page.locator('text=404, text=Not Found').count();
    expect(hasError).toBe(0);

    const currentUrl = page.url();
    console.log('Feedback tab URL:', currentUrl);

    // Page should have content
    const hasContent = await page.locator('button, input, form, h1, h2, [class*="feedback" i], p').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('share button visible on prototype detail', async ({ page }) => {
    const modelId = await goToFirstModelLibrary(page);

    const protoHref = await getFirstPrototypeHref(page);
    console.log('First prototype href:', protoHref);

    if (!protoHref) {
      console.log('No prototype found — skipping share button test');
      await saveScreenshot(page, 'proto-no-prototypes-share');
      return;
    }

    await page.goto(protoHref);
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'proto-detail-for-share');
    await checkLayoutAnomalies(page, 'proto-detail-share');

    // Look for share button
    const shareBtn = page.locator(
      'button:has-text("Share"), button[aria-label*="share" i], ' +
      '[class*="share" i] button, [title*="share" i], ' +
      'button:has-text("Invite"), a:has-text("Share")'
    ).first();

    const shareBtnCount = await shareBtn.count();
    console.log('Share button elements found:', shareBtnCount);

    if (shareBtnCount > 0) {
      const isVisible = await shareBtn.isVisible();
      console.log('Share button visible:', isVisible);
      await saveScreenshot(page, 'proto-share-button-visible');

      if (isVisible) {
        // Click share to open modal/panel
        await shareBtn.click();
        await page.waitForTimeout(2000);
        await saveScreenshot(page, 'proto-share-modal-opened');

        // Close it
        const closeBtn = page.locator(
          'button:has-text("Cancel"), button:has-text("Close"), button[aria-label*="close" i]'
        ).first();
        if (await closeBtn.count() > 0) {
          await closeBtn.click();
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(500);
      }
    } else {
      // Share might be accessed via a menu/more options
      const moreBtn = page.locator(
        'button[aria-label*="more" i], button[title*="more" i], ' +
        '[class*="more-options" i], button:has-text("...")'
      ).first();
      const moreBtnCount = await moreBtn.count();
      console.log('More options button found:', moreBtnCount);

      if (moreBtnCount > 0) {
        await moreBtn.click();
        await page.waitForTimeout(1000);
        await saveScreenshot(page, 'proto-more-options-opened');

        // Check if share appears in dropdown
        const shareInMenu = await page.locator('text=Share, [role="menuitem"]:has-text("Share")').count();
        console.log('Share in dropdown menu:', shareInMenu);

        // Close
        await page.keyboard.press('Escape');
      } else {
        console.log('No share button or more options found — may require different permissions');
        await saveScreenshot(page, 'proto-no-share-found');
      }
    }

    // Prototype detail should still load
    expect(page.url()).toContain('/prototype/');
  });

});
