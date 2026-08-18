import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  getSiteConfigValue,
  updateSiteConfigValue,
  openPublicSiteConfig,
  editPublicConfigValueViaUI,
  getPublicConfigRow,
} from './helpers';

const CONFIG_KEY = 'SITE_TITLE';

test.describe('Public Config - Restore Default', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('restore default reverts modified public config', async ({ page }) => {
    await openPublicSiteConfig(page);
    const baseline = await getSiteConfigValue(page, CONFIG_KEY);
    const modifiedValue = `E2E_RESTORE_${Date.now()}`;

    await editPublicConfigValueViaUI(page, CONFIG_KEY, modifiedValue);
    await expect.poll(() => getSiteConfigValue(page, CONFIG_KEY)).toBe(modifiedValue);

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Restore all public configs');
      await dialog.accept();
    });

    await page.getByRole('button', { name: 'Restore default' }).click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    await expect.poll(() => getSiteConfigValue(page, CONFIG_KEY)).toBe(baseline);

    await openPublicSiteConfig(page);
    const row = getPublicConfigRow(page, CONFIG_KEY);
    await expect(row).toContainText(baseline);
  });

  test('restore default cancel keeps modified value', async ({ page }) => {
    await openPublicSiteConfig(page);
    const baseline = await getSiteConfigValue(page, CONFIG_KEY);
    const modifiedValue = `E2E_RESTORE_CANCEL_${Date.now()}`;

    await editPublicConfigValueViaUI(page, CONFIG_KEY, modifiedValue);
    await expect.poll(() => getSiteConfigValue(page, CONFIG_KEY)).toBe(modifiedValue);

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Restore all public configs');
      await dialog.dismiss();
    });

    await page.getByRole('button', { name: 'Restore default' }).click();
    await page.waitForTimeout(1000);

    expect(await getSiteConfigValue(page, CONFIG_KEY)).toBe(modifiedValue);

    // Teardown: restore baseline so later tests are unaffected
    await updateSiteConfigValue(page, CONFIG_KEY, baseline);
  });
});
