// Copyright (c) 2026 Eclipse Foundation.
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
  goToVehicleApiTab,
  deleteModelViaApi,
} from './helpers';

test.describe('Vehicle API', () => {
  let modelId: string;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    const modelName = `E2E_VehicleAPI_${Date.now()}`;
    modelId = await createTestModelViaApi(page, modelName, 'public');
  });

  test('1: signal list loads on Vehicle API tab', async ({ page }) => {
    await goToVehicleApiTab(page, modelId);

    await expect(page.getByRole('link', { name: 'List View' })).toBeVisible();
    const signals = page.locator('.signal-list-item-name');
    await expect(signals.first()).toBeVisible({ timeout: 20000 });
    expect(await signals.count()).toBeGreaterThan(0);

    await saveScreenshot(page, 'vehicle-api-signal-list');
  });

  test('2: search filters signals by name', async ({ page }) => {
    await goToVehicleApiTab(page, modelId);

    const signals = page.locator('.signal-list-item-name');
    await expect(signals.first()).toBeVisible({ timeout: 20000 });
    const initialCount = await signals.count();
    expect(initialCount).toBeGreaterThan(0);

    const firstSignalName = (await signals.first().textContent())?.trim() || '';
    const searchTerm = firstSignalName.split('.')[0] || 'Vehicle';

    const searchInput = page.locator('[data-id="search-signal-input"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(800);

    const filteredNames = await signals.allTextContents();
    expect(filteredNames.length).toBeGreaterThan(0);
    expect(filteredNames.length).toBeLessThanOrEqual(initialCount);
    for (const name of filteredNames) {
      expect(name.toLowerCase()).toContain(searchTerm.toLowerCase());
    }

    expect(page.url()).toContain(`search=${encodeURIComponent(searchTerm)}`);

    await saveScreenshot(page, 'vehicle-api-search-filtered');
  });

  test('3: custom VSS elements render and download without changes', async ({ page }) => {
    const fixturePath = join(__dirname, 'fixtures', 'custom-vss.json');
    const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));

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

      const customSignal = page.locator('.signal-list-item-name').filter({ hasText: /^Vehicle\.Custom$/ });
      await expect(customSignal).toBeVisible({ timeout: 20000 });
      await expect(page.locator('.signal-list-item-name').filter({ hasText: /^Vehicle\.Empty$/ })).toBeVisible();
      await customSignal.click();
      await expect(page.getByText('e2e-custom-uuid', { exact: true })).toBeVisible();
      await expect(page.getByText('x-vendor', { exact: true })).toBeVisible();
      await expect(page.getByText(/"feature": "custom-metadata"/)).toBeVisible();
      await expect(page.getByText('default', { exact: true })).toBeVisible();
      await expect(page.getByText('false', { exact: true })).toBeVisible();
      await expect(page.getByText('Vendor lifecycle notice', { exact: true })).toBeVisible();

      await page.getByRole('button', { name: 'Filter', exact: true }).click();
      const customFilter = page.locator('label').filter({ hasText: /^x-custom$/ }).getByRole('checkbox');
      await expect(customFilter).toBeChecked();
      await customFilter.click();
      await expect(customSignal).not.toBeVisible();
      await customFilter.click();
      await expect(customSignal).toBeVisible();
      await page.getByRole('button', { name: 'Filter', exact: true }).click();

      await page.getByRole('link', { name: 'Tree View', exact: true }).click();
      const treeLabels = page.locator('svg foreignObject');
      const customNode = treeLabels.filter({ hasText: /^Custom >$/ });
      await expect(customNode).toBeVisible();
      await expect(treeLabels.filter({ hasText: /^Empty$/ })).toBeVisible();
      await expect(treeLabels.filter({ hasText: /^Attribute$/ })).toHaveCount(0);
      await expect(treeLabels.filter({ hasText: /^Reading$/ })).toHaveCount(0);
      await customNode.dispatchEvent('click'); // the footer overlaps the tree at the default viewport
      await expect(treeLabels.filter({ hasText: /^Reading$/ })).toBeVisible();
      await customNode.dispatchEvent('click');
      await expect(treeLabels.filter({ hasText: /^Reading$/ })).toHaveCount(0);

      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('link', { name: 'Download as JSON', exact: true }).click();
      const download = await downloadPromise;
      const downloadPath = await download.path();
      expect(downloadPath).not.toBeNull();
      const downloaded = JSON.parse(await readFile(downloadPath!, 'utf8'));
      expect(downloaded).toEqual(fixture);
      expect(Object.keys(downloaded.Vehicle.children)).toEqual(Object.keys(fixture.Vehicle.children));
    } finally {
      await deleteModelViaApi(page, modelId);
    }
  });
});
