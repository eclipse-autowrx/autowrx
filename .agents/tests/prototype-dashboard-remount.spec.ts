// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect, type Page, type Route } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestModelViaApi,
  createTestPrototypeViaApi,
  createDashboardTemplateViaApi,
  deleteDashboardTemplateViaApi,
  deleteModelViaApi,
  deletePrototypeViaApi,
  goToPrototypeDashboard,
  setPrototypeDashboardConfigViaApi,
} from './helpers';

/**
 * Widget options are posted into each widget iframe once, at load, and the
 * iframe URL is built in an effect keyed on the widget's `url` alone. A config
 * change that keeps the same `url` and only changes `options` therefore cannot
 * reach a mounted widget by re-render â€” the widget has to remount.
 *
 * These specs pin that down with a stub widget served by the test: the widget
 * echoes whatever `options` its URL carries, so "did the new config reach the
 * widget" is directly observable, and the route handler counts loads so an
 * over-eager remount is observable too.
 */

// Deliberately NOT under /builtin-widgets/ â€” builtin widgets receive options via
// postMessage, while everything else gets them encoded into the iframe URL. The
// URL path is what this fix is about, so the stub has to take that path.
const WIDGET_PATH = '/e2e-dashboard-widget.html';
const WIDGET_GLOB = `**${WIDGET_PATH}*`;

const widgetConfigWithMarker = (marker: string) => [
  {
    boxes: [1, 2, 6, 7],
    url: WIDGET_PATH,
    options: { e2eMarker: marker },
  },
];

/**
 * Serve the stub widget and record every load.
 *
 * `no-store` matters: two loads of the same URL must both reach the handler,
 * otherwise the load count silently under-reports a remount.
 */
async function stubWidget(page: Page, loads: string[]) {
  await page.route(WIDGET_GLOB, async (route: Route) => {
    loads.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      headers: { 'Cache-Control': 'no-store' },
      body: `<!doctype html>
<html>
  <body>
    <div id="marker">unset</div>
    <script>
      const raw = new URLSearchParams(location.search).get('options');
      const options = raw ? JSON.parse(raw) : {};
      document.getElementById('marker').textContent = options.e2eMarker || 'none';
    </script>
  </body>
</html>`,
    });
  });
}

function widgetFrame(page: Page) {
  return page.frameLocator(`iframe[src*="e2e-dashboard-widget.html"]`);
}

test.describe('Prototype Dashboard â€” widget remount on config change', () => {
  let modelId = '';
  let prototypeId = '';
  let templateId = '';
  let loads: string[] = [];

  test.beforeEach(async ({ page }) => {
    loads = [];
    await loginAsAdmin(page);
    await stubWidget(page, loads);

    const stamp = Date.now();
    modelId = await createTestModelViaApi(page, `E2E_Remount_Model_${stamp}`, 'public');
    ({ prototypeId } = await createTestPrototypeViaApi(page, {
      name: `E2E_Remount_${stamp}`,
      modelId,
    }));

    // dashboard_template_id: null records "the user has decided", which stops
    // DaDashboard auto-applying the instance's default template over this config.
    await setPrototypeDashboardConfigViaApi(
      page,
      prototypeId,
      widgetConfigWithMarker('BEFORE'),
      { dashboard_template_id: null },
    );

    // Same url and same boxes as the seeded config â€” only the option differs, so
    // nothing but a remount can carry the new value into the widget.
    templateId = await createDashboardTemplateViaApi(page, {
      name: `E2E_Remount_Template_${stamp}`,
      widget_config: widgetConfigWithMarker('AFTER'),
    });
  });

  test.afterEach(async ({ page }) => {
    if (templateId) await deleteDashboardTemplateViaApi(page, templateId);
    if (prototypeId) await deletePrototypeViaApi(page, prototypeId);
    if (modelId) await deleteModelViaApi(page, modelId);
    templateId = '';
    prototypeId = '';
    modelId = '';
  });

  test('1: applying a dashboard template delivers the new options to the mounted widget', async ({
    page,
  }) => {
    test.setTimeout(120000);

    await goToPrototypeDashboard(page, modelId, prototypeId);

    const marker = widgetFrame(page).locator('#marker');
    await expect(marker).toHaveText('BEFORE', { timeout: 30000 });
    expect(loads).toHaveLength(1);

    // Survives a remount but not a navigation, so it distinguishes "the widget
    // picked up the new config" from "the page reloaded and hid the bug".
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__e2eDashboardSentinel = 'alive';
    });

    const applyBtn = page.locator('[data-id="dashboard-apply-template-button"]');
    await expect(applyBtn).toBeVisible({ timeout: 15000 });
    await applyBtn.click();

    const templateItem = page.getByRole('menuitem', { name: /E2E_Remount_Template_/ });
    await expect(templateItem).toBeVisible({ timeout: 10000 });
    await templateItem.click();

    // The assertion that fails without the fix: before it, the iframe keeps the
    // URL built at mount and the widget still reads BEFORE.
    await expect(marker).toHaveText('AFTER', { timeout: 30000 });

    const sentinel = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__e2eDashboardSentinel,
    );
    expect(sentinel).toBe('alive');

    // Exactly one remount: a counter keyed on something that changes every
    // render would reload the widget repeatedly instead.
    await page.waitForTimeout(3000);
    expect(loads).toHaveLength(2);
    expect(loads[1]).toContain('AFTER');

    await saveScreenshot(page, 'dashboard-widget-remount-after-template');
  });

  test('2: re-rendering the dashboard without a config change does not remount the widget', async ({
    page,
  }) => {
    test.setTimeout(120000);

    await goToPrototypeDashboard(page, modelId, prototypeId);

    const marker = widgetFrame(page).locator('#marker');
    await expect(marker).toHaveText('BEFORE', { timeout: 30000 });
    expect(loads).toHaveLength(1);

    // Fullscreen is a pure presentation toggle: it re-renders the dashboard and
    // the grid, and must not cost the widgets their state. This is the guard for
    // the trade-off the remount counter accepts â€” it is keyed on widget_config
    // specifically, not on every render of the effect that reads it.
    const fullscreenBtn = page.locator('[data-id="dashboard-fullscreen-button"]');
    await expect(fullscreenBtn).toBeVisible({ timeout: 15000 });
    await fullscreenBtn.click();
    await page.waitForTimeout(1500);
    await fullscreenBtn.click();
    await page.waitForTimeout(1500);

    await expect(marker).toHaveText('BEFORE');
    expect(loads).toHaveLength(1);
  });
});
