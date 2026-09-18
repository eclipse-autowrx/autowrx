import { readFile } from 'fs/promises';
import { join } from 'path';
import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestModelViaApi,
  createTestPrototype,
  createPluginViaAdminUI,
  deletePluginViaApi,
  addPluginTabViaPlusButton,
  expectPluginDetailLoaded,
  E2E_PLUGIN_MARKER,
  type CreatedPlugin,
} from './helpers';

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'e2e-updateprototype-plugin');
const PLUGIN_SCRIPT_URL = 'http://127.0.0.1:18765/e2e-updateprototype-plugin/index.js';
const SUCCESS_TOAST_TEXT = 'Prototype updated successfully';

async function routeUpdatePrototypePluginScript(page: import('@playwright/test').Page) {
  const body = await readFile(join(FIXTURE_DIR, 'index.js'), 'utf-8');
  await page.route(PLUGIN_SCRIPT_URL, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  });
  return {
    url: PLUGIN_SCRIPT_URL,
    unroute: () => page.unroute(PLUGIN_SCRIPT_URL),
  };
}

test.describe('Plugin API - updatePrototype silent option', () => {
  let createdPlugin: CreatedPlugin | null = null;
  let pluginRoute: { unroute: () => Promise<void> } | null = null;

  test.afterEach(async ({ page }) => {
    if (createdPlugin) {
      await deletePluginViaApi(page, createdPlugin.id).catch(() => {});
      createdPlugin = null;
    }
    if (pluginRoute) {
      await pluginRoute.unroute();
      pluginRoute = null;
    }
  });

  test('silent (default) suppresses success toast; silent:false shows it', async ({ page }) => {
    test.setTimeout(120000);

    const timestamp = Date.now();
    const pluginName = `E2E_UpdateProto_${timestamp}`;
    const tabLabel = `UpdateProtoTab_${timestamp}`;
    const modelName = `E2E_Model_${timestamp}`;
    const protoName = `E2E_Proto_${timestamp}`;

    await loginAsAdmin(page);
    pluginRoute = await routeUpdatePrototypePluginScript(page);

    createdPlugin = await createPluginViaAdminUI(page, {
      name: pluginName,
      externalUrl: PLUGIN_SCRIPT_URL,
    });

    const modelId = await createTestModelViaApi(page, modelName, 'public');
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);

    await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/view`);
    await page.waitForTimeout(3000);
    await addPluginTabViaPlusButton(page, pluginName, tabLabel);

    await page.getByRole('link', { name: tabLabel }).click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/plug');
    expect(page.url()).toContain(`plugid=${createdPlugin.slug}`);
    await expectPluginDetailLoaded(page, E2E_PLUGIN_MARKER, `Prototype: ${protoName}`);

    // Silent case: default options, no toast expected.
    await page.getByTestId('e2e-update-silent-btn').click();
    await expect(page.getByTestId('e2e-update-status')).toHaveText('done', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await expect(page.getByText(SUCCESS_TOAST_TEXT)).toHaveCount(0);
    await saveScreenshot(page, 'update-prototype-silent');

    // Verbose case: silent:false, toast expected.
    await page.getByTestId('e2e-update-verbose-btn').click();
    await expect(page.getByText(SUCCESS_TOAST_TEXT)).toBeVisible({ timeout: 15000 });
    await saveScreenshot(page, 'update-prototype-verbose');
  });
});
