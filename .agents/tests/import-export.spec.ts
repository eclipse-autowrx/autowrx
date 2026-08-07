import { dirname } from 'path';
import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestModelViaApi,
  createTestPrototype,
  configureHomeModelListSection,
  openModelContextMenu,
  openPrototypeContextMenu,
  downloadViaContextMenuItem,
  deleteModelViaApi,
  deletePrototypeViaApi,
  importModelZipOnHome,
  importPrototypeZip,
  removeTempDownloadDir,
  searchPrototypeLibrary,
  getSiteConfigJson,
  setSiteConfigJson,
  waitForModelInHomeList,
  getHomeModelListSection,
} from './helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Import / Export - Model & Prototype', () => {
  test.setTimeout(120000);

  let originalHomeContent: unknown = null;
  const createdModelIds: string[] = [];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    originalHomeContent = await getSiteConfigJson(page, 'CFG_HOME_CONTENT');
    await configureHomeModelListSection(page);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    if (originalHomeContent !== null) {
      await setSiteConfigJson(page, 'CFG_HOME_CONTENT', originalHomeContent);
    }
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await configureHomeModelListSection(page);
  });

  test.afterEach(async ({ page }) => {
    await loginAsAdmin(page);
    while (createdModelIds.length > 0) {
      const modelId = createdModelIds.pop();
      if (modelId) {
        await deleteModelViaApi(page, modelId).catch(() => {});
      }
    }
  });

  test('export and import model round-trip via home page', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `E2E_ExportModel_${timestamp}`;
    const protoName = `E2E_ExportProto_${timestamp}`;

    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, modelName, 'private');
    createdModelIds.push(modelId);
    await createTestPrototype(page, protoName, modelId);

    await waitForModelInHomeList(page, modelName);

    const section = getHomeModelListSection(page);
    await openModelContextMenu(page, modelName, section);
    const zipPath = await downloadViaContextMenuItem(page, 'Export Model');
    expect(zipPath).toMatch(/model_.*\.zip$/i);

    await deleteModelViaApi(page, modelId);
    createdModelIds.pop();

    await page.goto('/');
    await page.waitForTimeout(3000);
    await importModelZipOnHome(page, zipPath);
    await removeTempDownloadDir(dirname(zipPath));

    await expect(page.getByRole('heading', { name: modelName })).toBeVisible({ timeout: 20000 });
    const importedModelUrl = page.url();
    expect(importedModelUrl).toMatch(/\/model\/.+/);

    const importedModelId = importedModelUrl.split('/model/')[1]?.split('/')[0];
    if (importedModelId) {
      createdModelIds.push(importedModelId);
    }

    await page.goto(`/model/${importedModelId}/library/list`);
    await page.waitForTimeout(3000);
    await searchPrototypeLibrary(page, protoName);
    await expect(page.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`).first()).toBeVisible({
      timeout: 30000,
    });

    await saveScreenshot(page, 'import-export-model-roundtrip');
  });

  test('export and import prototype round-trip via library page', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `E2E_ProtoExportModel_${timestamp}`;
    const protoName = `E2E_ProtoExport_${timestamp}`;

    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, modelName, 'private');
    createdModelIds.push(modelId);
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);

    await page.goto(`/model/${modelId}/library/list`);
    await page.waitForTimeout(3000);
    await searchPrototypeLibrary(page, protoName);

    await openPrototypeContextMenu(page, protoName);
    const zipPath = await downloadViaContextMenuItem(page, 'Export Prototype');
    expect(zipPath).toMatch(/prototype_.*\.zip$/i);

    await deletePrototypeViaApi(page, prototypeId);
    await page.reload();
    await page.waitForTimeout(3000);
    await searchPrototypeLibrary(page, protoName);
    await expect(page.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`)).toHaveCount(0, {
      timeout: 10000,
    });

    await importPrototypeZip(page, zipPath, protoName, modelId);
    await removeTempDownloadDir(dirname(zipPath));

    await searchPrototypeLibrary(page, protoName);
    await expect(page.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`).first()).toBeVisible({
      timeout: 30000,
    });

    await saveScreenshot(page, 'import-export-prototype-roundtrip');
  });
});
