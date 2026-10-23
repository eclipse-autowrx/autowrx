// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect } from '@playwright/test';
import {
  API_URL,
  loginAsAdmin,
  getAuthToken,
  createTestModelViaApi,
  createTestPrototypeViaApi,
  setPrototypeCodeViaApi,
  deleteModelViaApi,
  deletePrototypeViaApi,
} from './helpers';

const UNKNOWN_MESSAGE =
  'Unknown signals: Vehicle.Engine.UnknownSignal. Fix them before deploying.';

test.describe('Prototype unknown signal deployment guard', () => {
  let modelId = '';
  let prototypeId = '';

  test.afterEach(async ({ page }) => {
    if (prototypeId) await deletePrototypeViaApi(page, prototypeId);
    if (modelId) await deleteModelViaApi(page, modelId);
    prototypeId = '';
    modelId = '';
  });

  for (const variant of ['tab', 'primary'] as const) {
    test(`blocks unknown signals and allows valid code with a ${variant} staging action`, async ({ page }) => {
      test.setTimeout(120000);
      await loginAsAdmin(page);
      modelId = await createTestModelViaApi(page, `E2E_SignalGuard_${Date.now()}`, 'public');
      ({ prototypeId } = await createTestPrototypeViaApi(page, {
        name: `E2E_SignalGuard_${variant}_${Date.now()}`,
        modelId,
      }));

      const token = await getAuthToken(page);
      const response = await page.request.patch(`${API_URL}/v2/models/${modelId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          api_version: null,
          custom_apis: JSON.stringify([
            { name: 'Vehicle.Wishlist.CustomSignal', type: 'sensor', datatype: 'float', description: 'E2E wishlist signal' },
          ]),
          custom_template: {
            prototype_right_nav_buttons: [{
              builtin: 'staging',
              type: 'builtin',
              label: variant === 'tab' ? 'Staging' : 'Deploy',
              variant,
              openMode: variant === 'tab' ? 'page' : 'dialog',
            }],
          },
        },
      });
      expect(response.ok(), await response.text()).toBeTruthy();

      // Keep the model deterministic without depending on a site's VSS version.
      await page.route(`**/v2/models/${modelId}/api`, async (route) => {
        await route.fulfill({ json: {
          Vehicle: { type: 'branch', children: {
            Engine: { type: 'branch', children: {
              Speed: { type: 'sensor', datatype: 'float' },
            } },
          } },
        } });
      });

      const base = `/model/${modelId}/library/prototype/${prototypeId}`;
      await setPrototypeCodeViaApi(page, prototypeId, 'Vehicle.Engine.UnknownSignal.get()\n');
      await page.goto(`${base}/dashboard`);
      const blockedAction = page.locator(`[title="${UNKNOWN_MESSAGE}"]`).first();
      await expect(blockedAction).toBeVisible({ timeout: 20000 });
      if (variant === 'tab') {
        await expect(blockedAction).toHaveAttribute('aria-disabled', 'true');
        await expect(blockedAction.locator('a')).toHaveCount(0);
      } else {
        await expect(blockedAction.getByRole('button')).toBeDisabled();
      }

      // Direct staging URLs must not bypass the disabled action.
      await page.goto(`${base}/staging`);
      await expect(page.getByRole('alert').filter({ hasText: UNKNOWN_MESSAGE })).toBeVisible();

      // Cards validate against their own model without an active-model store.
      await page.goto(`/model/${modelId}/library/list`);
      const card = page.locator(`[data-id="prototype-item-${prototypeId}"]`);
      await card.getByRole('button', { name: 'Deploy prototype' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('alert')).toHaveText(UNKNOWN_MESSAGE);
      await page.keyboard.press('Escape');

      // Known leaves, branches and wishlist/custom APIs remain deployable.
      // Markdown and comments mentioning unknown signals do not block projects.
      const validCode = JSON.stringify([
        { type: 'file', name: 'main.py', content: [
          'engine = Vehicle.Engine',
          'Vehicle.Engine.Speed.get()',
          'vehicle.Wishlist.CustomSignal.get()',
          '# Vehicle.Engine.UnknownSignal.get()',
        ].join('\n') },
        { type: 'file', name: 'README.md', content: 'Vehicle.Engine.UnknownSignal' },
      ]);
      await setPrototypeCodeViaApi(page, prototypeId, validCode);
      await page.goto(`${base}/dashboard`);
      if (variant === 'tab') {
        await expect(page.getByRole('link').filter({ has: page.locator('[data-id="tab-staging"]') }))
          .toHaveAttribute('href', `${base}/staging`);
      } else {
        await expect(page.getByRole('button', { name: 'Deploy', exact: true })).toBeEnabled();
      }
      await expect(page.locator('[title^="Unknown signals:"]')).toHaveCount(0);

      await page.goto(`/model/${modelId}/library/list`);
      await card.getByRole('button', { name: 'Deploy prototype' }).click();
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('Stages', { exact: true })).toBeVisible();
      await expect(dialog.getByRole('alert')).toHaveCount(0);
    });
  }
});
