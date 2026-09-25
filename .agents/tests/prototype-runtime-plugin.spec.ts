// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { readFile } from 'fs/promises';
import { join } from 'path';
import { test, expect, type Page } from '@playwright/test';
import {
  API_URL,
  loginAsAdmin,
  saveScreenshot,
  getAuthToken,
  createTestModelViaApi,
  createTestPrototype,
  createPluginViaAdminUI,
  deletePluginViaApi,
  type CreatedPlugin,
} from './helpers';

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'e2e-runtime-panel-plugin');
const PLUGIN_SCRIPT_URL = 'http://127.0.0.1:18765/e2e-runtime-panel-plugin/index.js';
const MARKER = 'E2E_RUNTIME_PANEL_LOADED_OK';

async function routeRuntimePanelPluginScript(page: Page) {
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

async function setRuntimePluginViaApi(page: Page, modelId: string, slug: string) {
  const token = await getAuthToken(page);
  const res = await page.request.patch(`${API_URL}/v2/models/${modelId}`, {
    data: { custom_template: { prototype_runtime_plugin: slug } },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to set runtime plugin: ${res.status()} ${await res.text()}`);
  }
}

test.describe('Prototype runtime panel plugin', () => {
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

  test('replaces the built-in panel and bridges runtime state and widget writes', async ({ page }) => {
    test.setTimeout(120000);

    const timestamp = Date.now();
    const pluginName = `E2E_RuntimePanel_${timestamp}`;
    const modelName = `E2E_Model_${timestamp}`;
    const protoName = `E2E_Proto_${timestamp}`;

    await loginAsAdmin(page);
    pluginRoute = await routeRuntimePanelPluginScript(page);

    createdPlugin = await createPluginViaAdminUI(page, {
      name: pluginName,
      externalUrl: PLUGIN_SCRIPT_URL,
    });

    const modelId = await createTestModelViaApi(page, modelName, 'public');
    await setRuntimePluginViaApi(page, modelId, createdPlugin.slug);
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);

    // The runtime panel is shown on the dashboard tab.
    await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/dashboard`);
    await page.waitForTimeout(3000);

    const panel = page.locator('[data-id="runtime-control-panel"]');
    await expect(panel).toHaveCount(1);
    await expect(panel).toHaveAttribute('data-runtime-plugin', createdPlugin.slug);
    await expect(panel.getByText(MARKER)).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('e2e-runtime-can-run')).toHaveText('canRun: true');
    await expect(page.getByTestId('e2e-runtime-remount')).toHaveText('remountWidgets: function');

    // setRuntimeState writes the shared store; getRuntimeState reads it back.
    await page.getByTestId('e2e-runtime-set-state-btn').click();
    await expect(page.getByTestId('e2e-runtime-state')).toHaveText(
      JSON.stringify({ apisValue: { 'Vehicle.Speed': 42 }, isAppRunning: true }),
    );

    // Widget write requests are forwarded to the plugin.
    await page.evaluate(() => {
      window.postMessage(
        JSON.stringify({ cmd: 'set-api-value', api: 'Vehicle.Speed', value: 7 }),
        '*',
      );
    });
    await expect(page.getByTestId('e2e-runtime-last-write')).toHaveText(
      JSON.stringify({ 'Vehicle.Speed': 7 }),
    );
    await saveScreenshot(page, 'runtime-panel-plugin-loaded');
  });

  test('keeps the built-in panel when no runtime plugin is configured', async ({ page }) => {
    test.setTimeout(120000);

    const timestamp = Date.now();
    const modelName = `E2E_Model_${timestamp}`;
    const protoName = `E2E_Proto_${timestamp}`;

    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, modelName, 'public');
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);

    await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/dashboard`);
    await page.waitForTimeout(3000);

    const panel = page.locator('[data-id="runtime-control-panel"]');
    await expect(panel).toHaveCount(1);
    await expect(panel).not.toHaveAttribute('data-runtime-plugin', /.*/);
  });
});
