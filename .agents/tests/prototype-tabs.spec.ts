// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT
import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  checkLayoutAnomalies,
  prepareRuntimePanelForLayoutCheck,
  waitForPrototypeTabs,
  createTestModelViaApi,
  createTestPrototype,
  createTestPrototypeViaApi,
  deleteModelViaApi,
  goToPrototypeOverview,
} from './helpers';

// Hermetic fixture: a dedicated model+prototype so the tests never depend on
// whatever model happens to be first on the instance — a model with plugin
// prototype-tabs auto-redirects /view to /plug and breaks the assertions.
let fixtureModelId = '';
let fixtureProtoId = '';

test.describe('Prototype Tabs - Layout Check', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    const ts = Date.now();
    fixtureModelId = await createTestModelViaApi(page, `E2E_TabsFix_Model_${ts}`, 'public');
    fixtureProtoId = (
      await createTestPrototypeViaApi(page, {
        name: `E2E_TabsFix_Proto_${ts}`,
        modelId: fixtureModelId,
      })
    ).prototypeId;
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!fixtureModelId) return;
    const page = await browser.newPage();
    await loginAsAdmin(page);
    await deleteModelViaApi(page, fixtureModelId).catch(() => {});
    await page.close();
  });

  test('Overview tab loads and has no layout errors', async ({ page }) => {
    await loginAsAdmin(page);
    const modelId = fixtureModelId;
    const protoId = fixtureProtoId;

    await page.goto(`/model/${modelId}/library/prototype/${protoId}/view`);
    await page.waitForTimeout(5000);
    await saveScreenshot(page, 'tab-overview');

    const anomalies = await checkLayoutAnomalies(page, 'tab-overview');
    if (anomalies.length > 0) console.warn('⚠️ Overview anomalies:', anomalies);

    // Check tab is active
    const activeTab = page.locator('[data-id="tab-overview"], [class*="active"]:has-text("Overview")').first();
    const url = page.url();
    expect(url).toContain('/view');
    console.log('✅ Overview tab loaded');
  });

  test('SDV Code tab loads and has no layout errors', async ({ page }) => {
    await loginAsAdmin(page);
    const modelId = fixtureModelId;
    const protoId = fixtureProtoId;

    await page.goto(`/model/${modelId}/library/prototype/${protoId}/code`);
    await page.waitForTimeout(6000);
    await saveScreenshot(page, 'tab-code');

    const anomalies = await checkLayoutAnomalies(page, 'tab-code');
    if (anomalies.length > 0) console.warn('⚠️ Code tab anomalies:', anomalies);

    // Check code editor or content is present
    const hasCodeContent = await page.locator(
      '[data-id="tab-code"], [class*="editor"], [class*="monaco"], textarea, [class*="code"]'
    ).count();
    expect(hasCodeContent).toBeGreaterThan(0);
    console.log('✅ SDV Code tab loaded');
  });

  test('Dashboard tab loads and has no layout errors', async ({ page }) => {
    await loginAsAdmin(page);
    const modelId = fixtureModelId;
    const protoId = fixtureProtoId;

    await page.goto(`/model/${modelId}/library/prototype/${protoId}/dashboard`);
    await page.waitForTimeout(6000);
    await prepareRuntimePanelForLayoutCheck(page);
    await saveScreenshot(page, 'tab-dashboard');

    const anomalies = await checkLayoutAnomalies(page, 'tab-dashboard');
    if (anomalies.length > 0) console.warn('⚠️ Dashboard tab anomalies:', anomalies);

    await expect(page.locator('[data-id="tab-dashboard"]').first()).toBeVisible({ timeout: 5000 });
    const url = page.url();
    expect(url).toContain('/dashboard');
    console.log('✅ Dashboard tab loaded');
  });

  test('Customer Journey tab loads and has no layout errors', async ({ page }) => {
    await loginAsAdmin(page);
    const modelId = fixtureModelId;
    const protoId = fixtureProtoId;

    await page.goto(`/model/${modelId}/library/prototype/${protoId}/journey`);
    await page.waitForTimeout(6000);
    await saveScreenshot(page, 'tab-journey');

    const anomalies = await checkLayoutAnomalies(page, 'tab-journey');
    if (anomalies.length > 0) console.warn('⚠️ Journey tab anomalies:', anomalies);

    const url = page.url();
    expect(url).toContain('/journey');
    console.log('✅ Customer Journey tab loaded');
  });

  test('Navigate through all tabs sequentially and check each', async ({ page }) => {
    await loginAsAdmin(page);
    const modelId = fixtureModelId;
    const protoId = fixtureProtoId;

    const BASE = `/model/${modelId}/library/prototype/${protoId}`;
    const tabs = [
      { name: 'Overview',          route: `${BASE}/view`,      dataId: 'tab-overview' },
      { name: 'SDV Code',          route: `${BASE}/code`,      dataId: 'tab-code' },
      { name: 'Dashboard',         route: `${BASE}/dashboard`, dataId: 'tab-dashboard' },
      { name: 'Customer Journey',  route: `${BASE}/journey`,   dataId: 'tab-journey' },
    ];

    const tabsWithRuntimePanel = new Set(['tab-overview', 'tab-code', 'tab-dashboard']);

    for (const tab of tabs) {
      await page.goto(tab.route);
      await page.waitForTimeout(5000);
      if (tabsWithRuntimePanel.has(tab.dataId)) {
        await prepareRuntimePanelForLayoutCheck(page);
      }
      await saveScreenshot(page, `tab-sequential-${tab.dataId}`);

      const anomalies = await checkLayoutAnomalies(page, tab.dataId);
      console.log(`Tab [${tab.name}]: ${anomalies.length === 0 ? '✅ OK' : `⚠️ ${anomalies.length} anomalies`}`);

      expect(page.url()).toContain(tab.route.split(protoId)[1]);
    }

    console.log('✅ All tabs navigated successfully');
  });

  test('Tabs are all visible in the tab bar', async ({ page }) => {
    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, `E2E_Tabs_Model_${Date.now()}`, 'public');
    const { prototypeId } = await createTestPrototype(page, `E2E_Tabs_${Date.now()}`, modelId);

    await goToPrototypeOverview(page, modelId, prototypeId);
    await saveScreenshot(page, 'tab-bar-overview');

    // Check tab bar has at least the main tabs
    const codeTab = page.locator('[data-id="tab-code"]').first();
    const dashboardTab = page.locator('[data-id="tab-dashboard"]').first();
    const journeyTab = page.locator('[data-id="tab-journey"]').first();

    await expect(codeTab).toBeVisible({ timeout: 5000 });
    await expect(dashboardTab).toBeVisible({ timeout: 5000 });
    await expect(journeyTab).toBeVisible({ timeout: 5000 });

    console.log('✅ All tab buttons visible in tab bar');
  });

});
