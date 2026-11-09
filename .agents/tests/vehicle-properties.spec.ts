// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect, Page } from '@playwright/test';
import {
  loginAsAdmin,
  createTestModelViaApi,
  deleteModelViaApi,
  getModelViaApi,
  saveScreenshot,
} from './helpers';

// #57: saving vehicle properties must give clear feedback.
test.describe('Vehicle Properties save feedback', () => {
  test.setTimeout(90000);

  const createdModelIds: string[] = [];

  test.afterEach(async ({ page }) => {
    while (createdModelIds.length > 0) {
      const modelId = createdModelIds.pop();
      if (modelId) await deleteModelViaApi(page, modelId).catch(() => {});
    }
  });

  async function openUpdateDialogAndAddProperty(page: Page, name: string, value: string) {
    await page.getByRole('button', { name: 'Update property' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Update vehicle properties' });
    await expect(dialog).toBeVisible({ timeout: 20000 });
    await dialog.getByRole('button', { name: 'Add Property' }).click();
    await dialog.getByPlaceholder('Property Name').last().fill(name);
    await dialog.getByPlaceholder('Value').last().fill(value);
    return dialog;
  }

  test('TC1: success toast and dialog closes after save', async ({ page }) => {
    const ts = Date.now();
    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, `E2E_VehicleProps_${ts}`, 'private');
    createdModelIds.push(modelId);

    await page.goto(`/model/${modelId}`);
    const dialog = await openUpdateDialogAndAddProperty(page, 'e2e_prop', 'e2e_value');
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Vehicle properties saved').first()).toBeVisible({
      timeout: 15000,
    });
    await expect(dialog).toBeHidden();

    const model = await getModelViaApi(page, modelId);
    expect(JSON.parse(model.property ?? '[]')).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'e2e_prop', value: 'e2e_value' })]),
    );
    await saveScreenshot(page, 'vehicle-properties-tc1-saved');
  });

  test('TC2: error toast and dialog stays open when save fails', async ({ page }) => {
    const ts = Date.now();
    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, `E2E_VehiclePropsErr_${ts}`, 'private');
    createdModelIds.push(modelId);

    await page.goto(`/model/${modelId}`);
    const dialog = await openUpdateDialogAndAddProperty(page, 'e2e_prop', 'e2e_value');

    await page.route(`**/v2/models/${modelId}`, (route) =>
      route.request().method() === 'PATCH'
        ? route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ code: 500, message: 'E2E forced failure' }),
          })
        : route.continue(),
    );
    await dialog.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Failed to save vehicle properties').first()).toBeVisible({
      timeout: 15000,
    });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeEnabled();
    await saveScreenshot(page, 'vehicle-properties-tc2-error');
  });
});
