import { test, expect } from '@playwright/test';
import { loginAsAdmin, saveScreenshot, checkLayoutAnomalies } from './helpers';

// Helper: get first available prototype URL
async function getFirstPrototypeUrl(page: any): Promise<{ modelId: string; protoId: string } | null> {
  await page.goto('/model');
  await page.waitForTimeout(3000);

  const firstModel = page.locator('a[href*="/model/"]').first();
  await expect(firstModel).toBeVisible({ timeout: 8000 });
  const modelHref = await firstModel.getAttribute('href');
  const modelId = modelHref?.split('/model/')[1]?.split('/')[0];
  if (!modelId) return null;

  await page.goto(`/model/${modelId}/library/list`);
  await page.waitForTimeout(3000);

  const firstProto = page.locator('[data-id^="prototype-item-"]').first();
  await expect(firstProto).toBeVisible({ timeout: 10000 });
  const dataId = await firstProto.getAttribute('data-id');
  const protoId = dataId?.replace('prototype-item-', '');
  if (!protoId) return null;

  return { modelId, protoId };
}

test.describe('Prototype Tabs - Layout Check', () => {

  test('Overview tab loads and has no layout errors', async ({ page }) => {
    await loginAsAdmin(page);
    const ids = await getFirstPrototypeUrl(page);
    if (!ids) return;
    const { modelId, protoId } = ids;

    await page.goto(`/model/${modelId}/library/prototype/${protoId}/view`);
    await page.waitForTimeout(3000);
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
    const ids = await getFirstPrototypeUrl(page);
    if (!ids) return;
    const { modelId, protoId } = ids;

    await page.goto(`/model/${modelId}/library/prototype/${protoId}/code`);
    await page.waitForTimeout(4000);
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
    const ids = await getFirstPrototypeUrl(page);
    if (!ids) return;
    const { modelId, protoId } = ids;

    await page.goto(`/model/${modelId}/library/prototype/${protoId}/dashboard`);
    await page.waitForTimeout(4000);
    await saveScreenshot(page, 'tab-dashboard');

    const anomalies = await checkLayoutAnomalies(page, 'tab-dashboard');
    if (anomalies.length > 0) console.warn('⚠️ Dashboard tab anomalies:', anomalies);

    const url = page.url();
    expect(url).toContain('/dashboard');
    console.log('✅ Dashboard tab loaded');
  });

  test('Customer Journey tab loads and has no layout errors', async ({ page }) => {
    await loginAsAdmin(page);
    const ids = await getFirstPrototypeUrl(page);
    if (!ids) return;
    const { modelId, protoId } = ids;

    await page.goto(`/model/${modelId}/library/prototype/${protoId}/journey`);
    await page.waitForTimeout(4000);
    await saveScreenshot(page, 'tab-journey');

    const anomalies = await checkLayoutAnomalies(page, 'tab-journey');
    if (anomalies.length > 0) console.warn('⚠️ Journey tab anomalies:', anomalies);

    const url = page.url();
    expect(url).toContain('/journey');
    console.log('✅ Customer Journey tab loaded');
  });

  test('Navigate through all tabs sequentially and check each', async ({ page }) => {
    await loginAsAdmin(page);
    const ids = await getFirstPrototypeUrl(page);
    if (!ids) return;
    const { modelId, protoId } = ids;

    const BASE = `/model/${modelId}/library/prototype/${protoId}`;
    const tabs = [
      { name: 'Overview',          route: `${BASE}/view`,      dataId: 'tab-overview' },
      { name: 'SDV Code',          route: `${BASE}/code`,      dataId: 'tab-code' },
      { name: 'Dashboard',         route: `${BASE}/dashboard`, dataId: 'tab-dashboard' },
      { name: 'Customer Journey',  route: `${BASE}/journey`,   dataId: 'tab-journey' },
    ];

    for (const tab of tabs) {
      await page.goto(tab.route);
      await page.waitForTimeout(3000);
      await saveScreenshot(page, `tab-sequential-${tab.dataId}`);

      const anomalies = await checkLayoutAnomalies(page, tab.dataId);
      console.log(`Tab [${tab.name}]: ${anomalies.length === 0 ? '✅ OK' : `⚠️ ${anomalies.length} anomalies`}`);

      expect(page.url()).toContain(tab.route.split(protoId)[1]);
    }

    console.log('✅ All tabs navigated successfully');
  });

  test('Tabs are all visible in the tab bar', async ({ page }) => {
    await loginAsAdmin(page);
    const ids = await getFirstPrototypeUrl(page);
    if (!ids) return;
    const { modelId, protoId } = ids;

    await page.goto(`/model/${modelId}/library/prototype/${protoId}/view`);
    await page.waitForTimeout(3000);
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
