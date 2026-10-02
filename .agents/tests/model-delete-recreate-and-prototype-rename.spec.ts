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
  createTestModelViaApi,
  createTestPrototypeViaApi,
  deleteModelViaApi,
  deleteModelViaHomeContextMenu,
  getHomeModelListSection,
  getSiteConfigJson,
  gotoHomeModelList,
  selectHomeModelCategory,
  setSiteConfigJson,
  configureHomeModelListSection,
  goToPrototypeOverview,
  openPrototypeContextMenu,
} from './helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Model delete/recreate and prototype rename regressions', () => {
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

  test.afterEach(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    while (createdModelIds.length > 0) {
      const modelId = createdModelIds.pop();
      if (modelId) {
        await deleteModelViaApi(page, modelId).catch(() => {});
      }
    }
    await page.close();
  });

  test('model deleted via home can be recreated with the same name without duplicate-name error', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const modelName = `E2E-Dup-${timestamp}`;

    await loginAsAdmin(page);
    await gotoHomeModelList(page);
    await selectHomeModelCategory(page, 'My Models');

    const section = getHomeModelListSection(page);

    // Create the first model through the UI so the cached model list
    // (which backs the create-dialog duplicate-name hint) holds the name.
    await section.getByRole('button', { name: /Add Model/i }).click();
    const createDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: 'Create New Model' }),
    });
    await expect(createDialog).toBeVisible({ timeout: 15000 });
    await createDialog.locator('[data-id="form-create-model-input-name"]').fill(modelName);
    await createDialog.locator('[data-id="form-create-model-btn-submit"]').click();
    await page.waitForURL(/\/model\/[^/?]+$/, { timeout: 30000 });
    const firstModelId = new URL(page.url()).pathname.split('/model/')[1];
    createdModelIds.push(firstModelId);

    // Back to home without a full reload so the cached list keeps the name.
    // (History back re-opens the create dialog, so use the navbar logo link.)
    await page.locator('a[href="/"]').first().click();
    await expect(page.getByRole('heading', { name: 'Vehicle Models' })).toBeVisible({
      timeout: 20000,
    });
    await selectHomeModelCategory(page, 'My Models');
    await expect(section.locator(`[aria-label="${modelName}"]`)).toBeVisible({
      timeout: 20000,
    });

    // Delete through the UI.
    await deleteModelViaHomeContextMenu(page, modelName);
    await expect(section.locator(`[aria-label="${modelName}"]`)).toHaveCount(0, {
      timeout: 20000,
    });

    // Recreate the same name WITHOUT reloading the page.
    await section.getByRole('button', { name: /Add Model/i }).click();
    await expect(createDialog).toBeVisible({ timeout: 15000 });
    await createDialog.locator('[data-id="form-create-model-input-name"]').fill(modelName);
    // Let the debounced duplicate-name check (300ms) and the list refetch settle.
    await page.waitForTimeout(1000);
    await expect(
      createDialog.getByText('A model with this name already exists'),
    ).toHaveCount(0);
    const submitBtn = createDialog.locator('[data-id="form-create-model-btn-submit"]');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    await page.waitForURL(/\/model\/[^/?]+$/, { timeout: 30000 });
    const recreatedModelId = new URL(page.url()).pathname.split('/model/')[1];
    createdModelIds.push(recreatedModelId);
    expect(recreatedModelId).not.toBe(firstModelId);

    await saveScreenshot(page, 'model-delete-recreate-same-name');
  });

  test('prototype rename updates header and card immediately without reload', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const modelName = `E2E-RenModel-${timestamp}`;
    const protoName = `E2E-RenOld-${timestamp}`;
    const renamedName = `E2E-RenNew-${timestamp}`;

    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, modelName, 'private');
    createdModelIds.push(modelId);
    const { prototypeId } = await createTestPrototypeViaApi(page, {
      name: protoName,
      modelId,
    });

    // Single full page load: opens the prototype view so the header cache
    // holds the old name.
    await goToPrototypeOverview(page, modelId, prototypeId);

    const protoHeaderHeading = page.locator('h2').filter({ hasText: protoName });
    const protoBreadcrumbLink = page.locator(
      `a[href="/model/${modelId}/library/prototype/${prototypeId}"]`,
    );
    await expect(protoHeaderHeading).toBeVisible({ timeout: 20000 });
    await expect(protoBreadcrumbLink).toHaveText(protoName);

    // Client-side navigation to the prototype library (no reload).
    await page.locator(`a[href="/model/${modelId}/library"]`).click();
    const protoCard = page.locator(`[data-id="prototype-item-${prototypeId}"]`);
    await expect(protoCard).toBeVisible({ timeout: 20000 });

    // Rename through the card context menu.
    await openPrototypeContextMenu(page, protoName);
    await page.getByRole('menuitem', { name: 'Rename' }).click();
    const renameDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: 'Rename Prototype' }),
    });
    await expect(renameDialog).toBeVisible({ timeout: 10000 });
    await renameDialog.locator('input').fill(renamedName);
    await renameDialog.getByRole('button', { name: 'Save' }).click();
    await expect(renameDialog).toBeHidden({ timeout: 15000 });

    // Card shows the new name without a reload.
    await expect(protoCard.locator('.prototype-grid-item-name')).toHaveText(renamedName, {
      timeout: 20000,
    });

    // Open the prototype again (client-side) — header must show the new name.
    await protoCard.click();
    await page.waitForURL(new RegExp(`/library/prototype/${prototypeId}/view`), {
      timeout: 30000,
    });
    await expect(page.locator('h2').filter({ hasText: renamedName })).toBeVisible({
      timeout: 20000,
    });
    await expect(protoBreadcrumbLink).toHaveText(renamedName, { timeout: 20000 });
    await expect(page.locator('h2').filter({ hasText: protoName })).toHaveCount(0);

    await saveScreenshot(page, 'prototype-rename-immediate-update');
  });
});
