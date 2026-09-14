import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestModelViaApi,
  createTestPrototype,
  routeExternalPluginScript,
  createPluginViaAdminUI,
  createInternalPluginViaAdminZip,
  deletePluginViaApi,
  addPluginTabViaPlusButton,
  expectPluginDetailLoaded,
  E2E_PLUGIN_MARKER,
  type ExternalPluginRoute,
  type CreatedPlugin,
} from './helpers';

test.describe('Plugin Management', () => {
  let externalPluginRoute: ExternalPluginRoute | null = null;
  let createdPlugin: CreatedPlugin | null = null;

  test.afterEach(async ({ page }) => {
    if (createdPlugin) {
      await deletePluginViaApi(page, createdPlugin.id).catch(() => {});
      createdPlugin = null;
    }
    if (externalPluginRoute) {
      await externalPluginRoute.unroute();
      externalPluginRoute = null;
    }
  });

  test('external plugin via routed script: create, attach to model/prototype, load detail page', async ({
    page,
  }) => {
    test.setTimeout(120000);

    const timestamp = Date.now();
    const pluginName = `E2E_Ext_${timestamp}`;
    const tabLabel = `ExtTab_${timestamp}`;
    const modelName = `E2E_Model_${timestamp}`;
    const protoName = `E2E_Proto_${timestamp}`;

    await loginAsAdmin(page);
    externalPluginRoute = await routeExternalPluginScript(page);

    createdPlugin = await createPluginViaAdminUI(page, {
      name: pluginName,
      externalUrl: externalPluginRoute.url,
    });

    const modelId = await createTestModelViaApi(page, modelName, 'public');
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);

    await page.goto(`/model/${modelId}`);
    await page.waitForTimeout(3000);
    await addPluginTabViaPlusButton(page, pluginName, tabLabel);

    await page.getByRole('link', { name: tabLabel }).click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/plugin');
    expect(page.url()).toContain(`plugid=${createdPlugin.slug}`);
    await expectPluginDetailLoaded(page, E2E_PLUGIN_MARKER, `Model: ${modelName}`);
    await saveScreenshot(page, 'plugin-model-external');

    await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/view`);
    await page.waitForTimeout(3000);
    await addPluginTabViaPlusButton(page, pluginName, tabLabel);

    await page.getByRole('link', { name: tabLabel }).click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/plug');
    expect(page.url()).toContain(`plugid=${createdPlugin.slug}`);
    await expectPluginDetailLoaded(page, E2E_PLUGIN_MARKER, `Prototype: ${protoName}`);
    await saveScreenshot(page, 'plugin-prototype-external');
  });

  test('internal plugin via ZIP upload: create, attach to model/prototype, load detail page', async ({
    page,
  }) => {
    test.setTimeout(120000);

    const timestamp = Date.now();
    const pluginName = `E2E_Zip_${timestamp}`;
    const tabLabel = `ZipTab_${timestamp}`;
    const modelName = `E2E_Model_${timestamp}`;
    const protoName = `E2E_Proto_${timestamp}`;

    await loginAsAdmin(page);

    createdPlugin = await createInternalPluginViaAdminZip(page, pluginName);

    expect(createdPlugin.slug).toBeTruthy();

    const modelId = await createTestModelViaApi(page, modelName, 'public');
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);

    await page.goto(`/model/${modelId}`);
    await page.waitForTimeout(3000);
    await addPluginTabViaPlusButton(page, pluginName, tabLabel);

    await page.getByRole('link', { name: tabLabel }).click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/plugin');
    expect(page.url()).toContain(`plugid=${createdPlugin.slug}`);
    await expectPluginDetailLoaded(page, E2E_PLUGIN_MARKER, `Model: ${modelName}`);
    await saveScreenshot(page, 'plugin-model-zip');

    await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/view`);
    await page.waitForTimeout(3000);
    await addPluginTabViaPlusButton(page, pluginName, tabLabel);

    await page.getByRole('link', { name: tabLabel }).click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/plug');
    expect(page.url()).toContain(`plugid=${createdPlugin.slug}`);
    await expectPluginDetailLoaded(page, E2E_PLUGIN_MARKER, `Prototype: ${protoName}`);
    await saveScreenshot(page, 'plugin-prototype-zip');
  });
});
