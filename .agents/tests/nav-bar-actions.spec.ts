import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  getNavBarActionsViaApi,
  setNavBarActionsViaApi,
  getNavBar,
  getNavBarCustomLinks,
  getNavBarCustomSearchButtons,
  openSiteConfigNavBarActions,
  reloadForNavBarConfig,
  getNavBarActionsEditorSection,
  type NavBarActionConfig,
} from './helpers';

test.describe('Navigation Bar Actions', () => {
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

  test('1: Navigation Bar Actions editor loads in site config', async ({ page }) => {
    await openSiteConfigNavBarActions(page);

    await expect(page.getByText('Left Actions', { exact: true })).toBeVisible();
    await expect(page.getByText('Right Actions', { exact: true })).toBeVisible();
    await expect(getNavBarActionsEditorSection(page, 'Left Actions').getByRole('button', { name: 'Add Items' })).toBeVisible();
    await expect(getNavBarActionsEditorSection(page, 'Right Actions').getByRole('button', { name: 'Add Items' })).toBeVisible();

    await saveScreenshot(page, 'nav-bar-actions-editor');
  });

  test('2: left link action appears in navbar and navigates', async ({ page }) => {
    const label = `E2E_Models_${Date.now()}`;

    await setNavBarActionsViaApi(page, [
      {
        type: 'link',
        label,
        url: '/model',
        position: 'left',
        openTarget: '_self',
        icon: '',
      },
    ]);
    await reloadForNavBarConfig(page);

    const link = getNavBarCustomLinks(page).filter({ hasText: label });
    await expect(link).toBeVisible({ timeout: 10000 });
    await link.click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/model');

    await saveScreenshot(page, 'nav-bar-left-link');
  });

  test('3: right link action opens in new tab', async ({ page }) => {
    const label = `E2E_External_${Date.now()}`;
    const externalUrl = 'https://example.com';

    await setNavBarActionsViaApi(page, [
      {
        type: 'link',
        label,
        url: externalUrl,
        position: 'right',
        openTarget: '_blank',
        icon: '',
      },
    ]);
    await reloadForNavBarConfig(page);

    const link = getNavBarCustomLinks(page).filter({ hasText: label });
    await expect(link).toBeVisible({ timeout: 10000 });
    await expect(link).toHaveAttribute('href', externalUrl);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    await saveScreenshot(page, 'nav-bar-right-link-blank');
  });

  test('4: search action opens global search dialog', async ({ page }) => {
    const placeholder = `Search_${Date.now()}`;

    await setNavBarActionsViaApi(page, [
      {
        type: 'search',
        label: '',
        url: '',
        placeholder,
        position: 'right',
        icon: '',
      },
    ]);
    await reloadForNavBarConfig(page);

    const searchBtn = getNavBarCustomSearchButtons(page).first();
    await expect(searchBtn).toBeVisible({ timeout: 10000 });
    await expect(searchBtn).toHaveAttribute('title', placeholder);
    await searchBtn.click();

    await expect(page.getByPlaceholder('Search Model or Prototype')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();

    await saveScreenshot(page, 'nav-bar-search-dialog');
  });

  test('5: empty config hides custom navbar actions', async ({ page }) => {
    await setNavBarActionsViaApi(page, []);
    await reloadForNavBarConfig(page);

    await expect(getNavBarCustomLinks(page)).toHaveCount(0);
    await expect(getNavBarCustomSearchButtons(page)).toHaveCount(0);
    await expect(getNavBar(page)).toBeVisible();
    await expect(page.locator('img[alt="Logo"]')).toBeVisible();

    await saveScreenshot(page, 'nav-bar-empty-actions');
  });

  test('6: save via admin UI persists after reload', async ({ page }) => {
    const label = `E2E_UI_Save_${Date.now()}`;

    await setNavBarActionsViaApi(page, []);
    await openSiteConfigNavBarActions(page);

    const leftSection = getNavBarActionsEditorSection(page, 'Left Actions');
    await leftSection.getByRole('button', { name: 'Add Items' }).click();
    await page.waitForTimeout(500);

    const actionCard = page.locator('div.border.border-border.rounded-md').filter({ hasText: 'Action 1' }).first();
    await actionCard.locator('input[type="text"]').first().fill(label);
    await actionCard.locator('input[type="url"]').fill('/model');

    await page.getByRole('button', { name: 'Save Navigation Bar Actions' }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    const savedLink = getNavBarCustomLinks(page).filter({ hasText: label });
    await expect(savedLink).toBeVisible({ timeout: 15000 });

    await openSiteConfigNavBarActions(page);
    await expect(page.locator('div.border.border-border.rounded-md input[type="text"]').first()).toHaveValue(label);

    await saveScreenshot(page, 'nav-bar-ui-save-persist');
  });

  test('7: reorder actions via move down reflects in navbar', async ({ page }) => {
    const nameA = `AAA_${Date.now()}`;
    const nameZ = `ZZZ_${Date.now()}`;

    await setNavBarActionsViaApi(page, [
      {
        type: 'link',
        label: nameA,
        url: '/model',
        position: 'left',
        openTarget: '_self',
        icon: '',
      },
      {
        type: 'link',
        label: nameZ,
        url: '/model',
        position: 'left',
        openTarget: '_self',
        icon: '',
      },
    ]);
    await reloadForNavBarConfig(page);

    let linkTexts = await getNavBarCustomLinks(page).allTextContents();
    expect(linkTexts.map((t) => t.trim()).join(' ')).toMatch(new RegExp(`${nameA}.*${nameZ}`));

    await openSiteConfigNavBarActions(page);
    const leftSection = getNavBarActionsEditorSection(page, 'Left Actions');
    const firstActionCard = leftSection.locator('div.border.border-border.rounded-md').first();
    await firstActionCard.getByRole('button').nth(1).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: 'Save Navigation Bar Actions' }).click();
    await page.waitForLoadState('load');
    await page.waitForTimeout(3000);

    linkTexts = await getNavBarCustomLinks(page).allTextContents();
    const combined = linkTexts.map((t) => t.trim()).join(' ');
    expect(combined).toMatch(new RegExp(`${nameZ}.*${nameA}`));

    await saveScreenshot(page, 'nav-bar-reorder');
  });
});
