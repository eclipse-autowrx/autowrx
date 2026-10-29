// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { test, expect } from '@playwright/test';
import {
  API_URL,
  getAuthToken,
  goToVehicleApiTab,
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

// Reuse Playwright's bundled ZIP extractor without adding a dependency.
const { extract } = require('playwright-core/lib/zipBundle') as {
  extract: (zipPath: string, options: { dir: string }) => Promise<void>;
};

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
    // ZIP imports require a complete, valid VSS tree rather than a blank model.
    const seeded = await page.request.patch(`${API_URL}/v2/models/${modelId}`, {
      headers: { Authorization: `Bearer ${await getAuthToken(page)}` },
      data: { api_version: 'v5.0' },
    });
    expect(seeded.ok()).toBeTruthy();
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

  test('ZIP round-trip keeps custom VSS elements', async ({ page }) => {
    const modelName = `E2E_CustomVssZip_${Date.now()}`;
    const fixturePath = join(__dirname, 'fixtures', 'custom-vss.json');
    const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
    const modelId = await createTestModelViaApi(page, modelName, 'private');
    createdModelIds.push(modelId);
    let zipPath: string | undefined;

    try {
      await goToVehicleApiTab(page, modelId);
      await page.getByRole('link', { name: 'Replace Vehicle API', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.locator('input[type="file"]').setInputFiles(fixturePath);
      const replaceButton = dialog.getByRole('button', { name: 'Replace Vehicle API', exact: true });
      await expect(replaceButton).toBeEnabled();
      const replaceResponse = page.waitForResponse((response) =>
        response.url().endsWith(`/models/${modelId}/replace-api`) && response.request().method() === 'POST',
      );
      await replaceButton.click();
      expect((await replaceResponse).ok()).toBeTruthy();
      await expect(dialog).not.toBeVisible();

      await waitForModelInHomeList(page, modelName);
      const section = getHomeModelListSection(page);
      await openModelContextMenu(page, modelName, section);
      zipPath = await downloadViaContextMenuItem(page, 'Export Model');
      expect(zipPath).toMatch(/model_.*\.zip$/i);

      const extractedDir = join(dirname(zipPath), 'extracted');
      await extract(zipPath, { dir: extractedDir });
      const exportedVss = JSON.parse(await readFile(join(extractedDir, 'vss.json'), 'utf8'));
      expect(exportedVss).toEqual(fixture);
      expect(Object.keys(exportedVss.Vehicle.children)).toEqual(Object.keys(fixture.Vehicle.children));

      // Remove the source so the home import does not prompt for a duplicate name.
      // Keep its ID registered for afterEach cleanup if anything fails.
      await deleteModelViaApi(page, modelId);
      await page.goto('/');
      await importModelZipOnHome(page, zipPath);
      const importedModelId = new URL(page.url()).pathname.split('/')[2];
      expect(importedModelId).toBeTruthy();
      createdModelIds.push(importedModelId);
      expect(importedModelId).not.toBe(modelId);
      await expect(page.getByRole('heading', { name: modelName })).toBeVisible({ timeout: 20000 });

      await goToVehicleApiTab(page, importedModelId);
      const signals = page.locator('.signal-list-item-name');
      await expect(signals.filter({ hasText: /^Vehicle\.Custom$/ })).toBeVisible({ timeout: 20000 });
      await expect(signals.filter({ hasText: /^Vehicle\.Empty$/ })).toBeVisible();

      const token = await getAuthToken(page);
      const rawResponse = await page.request.get(`${API_URL}/v2/models/${importedModelId}/api?raw=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(rawResponse.ok()).toBeTruthy();
      const importedVss = await rawResponse.json();
      expect(importedVss).toEqual(fixture);
      expect(Object.keys(importedVss.Vehicle.children)).toEqual(Object.keys(fixture.Vehicle.children));
    } finally {
      if (zipPath) {
        await removeTempDownloadDir(dirname(zipPath));
      }
    }
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
