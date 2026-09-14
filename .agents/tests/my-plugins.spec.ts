import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  deletePluginViaApi,
  EXTERNAL_PLUGIN_SCRIPT_URL,
  routeExternalPluginScript,
  findMyPluginByNameViaApi,
} from './helpers';

test.describe('My Plugins', () => {
  let createdPluginName: string | undefined;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await routeExternalPluginScript(page);
  });

  test.afterEach(async ({ page }) => {
    if (createdPluginName) {
      const plugin = await findMyPluginByNameViaApi(page, createdPluginName);
      if (plugin?.id) {
        await deletePluginViaApi(page, plugin.id).catch(() => {});
      }
      createdPluginName = undefined;
    }
  });

  test('5: create plugin via UI', async ({ page }) => {
    const pluginName = `E2E_MyPlugin_${Date.now()}`;
    createdPluginName = pluginName;

    await page.goto('/me/plugins');
    await page.waitForTimeout(3000);

    await expect(page.getByRole('heading', { name: 'Plugins' })).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole('button', { name: 'New' }).click();
    await expect(page.getByRole('heading', { name: 'Create Plugin' })).toBeVisible({
      timeout: 10000,
    });

    const dialog = page.locator('[role="dialog"]').filter({
      has: page.getByRole('heading', { name: 'Create Plugin' }),
    });
    await dialog.getByPlaceholder('Name *').fill(pluginName);
    await dialog.locator('textarea').first().fill('E2E test plugin description');
    await dialog.locator('label:has-text("URL")').locator('..').locator('textarea').fill(
      EXTERNAL_PLUGIN_SCRIPT_URL,
    );

    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Create Plugin' })).toBeHidden({
      timeout: 15000,
    });
    await page.waitForTimeout(2000);

    const card = page.locator('h3', { hasText: pluginName });
    await expect(card).toBeVisible({ timeout: 15000 });

    await saveScreenshot(page, 'my-plugins-created');
  });
});
