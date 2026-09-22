// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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

const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'e2e-notifytab-plugin');
const PLUGIN_SCRIPT_URL = 'http://127.0.0.1:18765/e2e-notifytab-plugin/index.js';

async function routeNotifyTabPluginScript(page: import('@playwright/test').Page) {
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

test.describe('Plugin API - notifyTab', () => {
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

  test('flags the Code tab without navigating, and clears the badge once opened', async ({ page }) => {
    test.setTimeout(120000);

    const timestamp = Date.now();
    const pluginName = `E2E_NotifyTab_${timestamp}`;
    const tabLabel = `NotifyTabTest_${timestamp}`;
    const modelName = `E2E_Model_${timestamp}`;
    const protoName = `E2E_Proto_${timestamp}`;

    await loginAsAdmin(page);
    pluginRoute = await routeNotifyTabPluginScript(page);

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

    const codeTabBadge = page
      .locator('[data-id="tab-code"]')
      .getByTestId('tab-notification-badge');

    // Badge starts hidden (not notified yet).
    await expect(codeTabBadge).toHaveAttribute('data-visible', 'false');

    // notifyTab must not navigate away from the plugin tab.
    await page.getByTestId('e2e-notify-code-tab-btn').click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/plug');
    expect(page.url()).toContain(`plugid=${createdPlugin.slug}`);

    // The Code tab is now flagged.
    await expect(codeTabBadge).toHaveAttribute('data-visible', 'true');
    await saveScreenshot(page, 'notify-tab-badge-visible');

    // Opening the flagged tab clears its badge.
    await page.locator('[data-id="tab-code"]').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/code');
    await expect(codeTabBadge).toHaveAttribute('data-visible', 'false');
    await saveScreenshot(page, 'notify-tab-badge-cleared');
  });

  test('is a no-op when the target tab is already active', async ({ page }) => {
    test.setTimeout(120000);

    const timestamp = Date.now();
    const pluginName = `E2E_NotifyTabNoop_${timestamp}`;
    const tabLabel = `NotifyTabNoopTest_${timestamp}`;
    const modelName = `E2E_Model_${timestamp}`;
    const protoName = `E2E_Proto_${timestamp}`;

    await loginAsAdmin(page);
    pluginRoute = await routeNotifyTabPluginScript(page);

    createdPlugin = await createPluginViaAdminUI(page, {
      name: pluginName,
      externalUrl: PLUGIN_SCRIPT_URL,
    });

    const modelId = await createTestModelViaApi(page, modelName, 'public');
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);

    await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/view`);
    await page.waitForTimeout(3000);
    await addPluginTabViaPlusButton(page, pluginName, tabLabel);

    const pluginTabLink = page.getByRole('link', { name: tabLabel });
    await pluginTabLink.click();
    await page.waitForTimeout(2000);
    await expectPluginDetailLoaded(page, E2E_PLUGIN_MARKER, `Prototype: ${protoName}`);

    // Flag the plugin's own tab while it's the active one.
    await page.getByTestId('e2e-notify-own-tab-btn').click();
    await page.waitForTimeout(500);

    // Since the tab is already active, no badge should appear on it.
    const ownTabBadge = pluginTabLink.getByTestId('tab-notification-badge');
    await expect(ownTabBadge).toHaveAttribute('data-visible', 'false');
    await saveScreenshot(page, 'notify-tab-noop-active-tab');
  });
});
