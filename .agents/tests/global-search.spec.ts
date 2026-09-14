import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestPrototype,
  configureGlobalSearchNavAction,
  openGlobalSearchDialog,
  getNavBarActionsViaApi,
  setNavBarActionsViaApi,
  createTestModelViaApi,
  type NavBarActionConfig,
} from './helpers';

test.describe('Global Search', () => {
  let originalNavBarActions: NavBarActionConfig[] = [];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    originalNavBarActions = await getNavBarActionsViaApi(page);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    await setNavBarActionsViaApi(page, originalNavBarActions);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    await setNavBarActionsViaApi(page, originalNavBarActions);
  });

  test('3: find prototype and navigate to detail page', async ({ page }) => {
    const protoName = `E2E_GlobalSearch_${Date.now()}`;
    const modelId = await createTestModelViaApi(page, `E2E_GS_Model_${Date.now()}`, 'public');
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);

    await configureGlobalSearchNavAction(page);
    await openGlobalSearchDialog(page);

    const searchInput = page.getByPlaceholder('Search Model or Prototype');
    await searchInput.fill(protoName);
    await searchInput.press('Enter');
    await page.waitForTimeout(3000);

    const result = page
      .locator('div.cursor-pointer')
      .filter({ hasText: protoName })
      .filter({ hasText: 'Prototype' })
      .first();
    await expect(result).toBeVisible({ timeout: 15000 });
    await result.click();
    await page.waitForTimeout(3000);

    expect(page.url()).toContain(`/model/${modelId}/library/prototype/${prototypeId}`);

    await saveScreenshot(page, 'global-search-navigate-prototype');
  });
});
