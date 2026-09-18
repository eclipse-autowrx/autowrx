// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect, Page } from '@playwright/test';
import {
  loginAs,
  loginAsAdmin,
  createTestModelViaApi,
  createTestPrototypeViaApi,
  createTestUserViaApi,
  deleteModelViaApi,
  deletePrototypeViaApi,
  deleteTestUserViaApi,
  getSiteConfigJson,
  setSiteConfigJson,
  TEST_USER,
} from './helpers';

const CONFIG_KEY = 'ENABLE_MODEL_CUSTOMIZATION';

const MODEL_MENU_TRIGGER = '[data-id="btn-model-more-menu"]';
const PROTOTYPE_MENU_TRIGGER = '[data-id="btn-prototype-more-menu"]';

test.describe.configure({ mode: 'serial' });

test.describe('Model Customization Menu', () => {
  test.setTimeout(120000);

  let baseline: boolean | null = null;
  let modelId: string | null = null;
  let prototypeId: string | null = null;
  let ownerUserId: string | null = null;

  // Site config is global, so capture the baseline once and restore it at the end.
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    baseline = await getSiteConfigJson<boolean>(page, CONFIG_KEY);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    await setSiteConfigJson(page, CONFIG_KEY, baseline ?? true).catch(() => {});
    if (prototypeId) await deletePrototypeViaApi(page, prototypeId).catch(() => {});
    if (modelId) await deleteModelViaApi(page, modelId).catch(() => {});
    if (ownerUserId) await deleteTestUserViaApi(page, ownerUserId).catch(() => {});
    await page.close();
  });

  async function setFlag(page: Page, value: boolean) {
    await setSiteConfigJson(page, CONFIG_KEY, value);
  }

  async function gotoModelPage(page: Page, id: string) {
    await page.goto(`/model/${id}`);
    await expect(page.locator('.da-model-detail-tab-bar')).toBeVisible({ timeout: 30000 });
  }

  async function gotoPrototypePage(page: Page, mId: string, pId: string) {
    await page.goto(`/model/${mId}/library/prototype/${pId}/view`);
    await expect(page.locator('.da-page-prototype-detail-tab-bar')).toBeVisible({
      timeout: 30000,
    });
  }

  async function openMenuItems(page: Page, trigger: string): Promise<string[]> {
    await page.locator(trigger).click();
    const items = page.locator('[role="menuitem"]');
    await expect(items.first()).toBeVisible({ timeout: 10000 });
    const labels = await items.allTextContents();
    return labels.map((label) => label.trim()).filter(Boolean);
  }

  // Shared fixtures: one admin-owned model + prototype reused across the suite.
  test('setup: create model and prototype owned by admin', async ({ page }) => {
    const timestamp = Date.now();
    await loginAsAdmin(page);
    modelId = await createTestModelViaApi(page, `E2E_CustomizationMenu_${timestamp}`, 'public');
    const created = await createTestPrototypeViaApi(page, {
      name: `E2E_CustomizationProto_${timestamp}`,
      modelId,
    });
    prototypeId = created.prototypeId;
    expect(modelId).toBeTruthy();
    expect(prototypeId).toBeTruthy();
  });

  test('TC1: flag on - model page menu shows Manage Addons then Save Model as Template', async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await setFlag(page, true);
    await gotoModelPage(page, modelId!);

    await expect(page.locator(MODEL_MENU_TRIGGER)).toBeVisible({ timeout: 15000 });
    const labels = await openMenuItems(page, MODEL_MENU_TRIGGER);
    expect(labels).toEqual(['Manage Addons', 'Save Model as Template']);
  });

  test('TC2: flag on - prototype page menu shows layout, model template, prototype template', async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await setFlag(page, true);
    await gotoPrototypePage(page, modelId!, prototypeId!);

    await expect(page.locator(PROTOTYPE_MENU_TRIGGER)).toBeVisible({ timeout: 15000 });
    const labels = await openMenuItems(page, PROTOTYPE_MENU_TRIGGER);
    expect(labels).toEqual([
      'Customize Prototype Layout',
      'Save Model as Template',
      'Save Prototype as Template',
    ]);
  });

  test('TC3: flag off - model page menu is hidden even for admin', async ({ page }) => {
    await loginAsAdmin(page);
    await setFlag(page, false);
    await gotoModelPage(page, modelId!);

    await expect(page.locator(MODEL_MENU_TRIGGER)).toHaveCount(0);
  });

  test('TC4: flag off - prototype page menu is hidden even for admin', async ({ page }) => {
    await loginAsAdmin(page);
    await setFlag(page, false);
    await gotoPrototypePage(page, modelId!, prototypeId!);

    await expect(page.locator(PROTOTYPE_MENU_TRIGGER)).toHaveCount(0);
  });

  test('TC5: Save Model as Template on prototype page opens the Create Template dialog', async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await setFlag(page, true);
    await gotoPrototypePage(page, modelId!, prototypeId!);

    await page.locator(PROTOTYPE_MENU_TRIGGER).click();
    await page.locator('[data-id="btn-prototype-save-model-as-template"]').click();

    await expect(page.getByRole('heading', { name: 'Create Template' })).toBeVisible({
      timeout: 15000,
    });
  });

  test('TC6: admin sees the menu on a model they do not own', async ({ page }) => {
    const timestamp = Date.now();
    await loginAsAdmin(page);
    const owner = await createTestUserViaApi(page, {
      email: `e2e_customization_owner_${timestamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E Customization Owner ${timestamp}`,
    });
    ownerUserId = owner.id;

    await setFlag(page, true);
    // Model created by the secondary user, so the admin is not the owner.
    const foreignModelId = await createTestModelViaApi(
      page,
      `E2E_CustomizationForeign_${timestamp}`,
      'public',
      { email: owner.email, password: TEST_USER.password },
    );

    try {
      await gotoModelPage(page, foreignModelId);
      await expect(page.locator(MODEL_MENU_TRIGGER)).toBeVisible({ timeout: 15000 });
    } finally {
      await loginAsAdmin(page);
      await deleteModelViaApi(page, foreignModelId).catch(() => {});
    }
  });

  test('TC7: non-admin owner sees customization items but not Save Prototype as Template', async ({
    page,
  }) => {
    const timestamp = Date.now();
    await loginAsAdmin(page);
    await setFlag(page, true);

    const owner = await createTestUserViaApi(page, {
      email: `e2e_customization_nonadmin_${timestamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E Customization NonAdmin ${timestamp}`,
    });
    const auth = { email: owner.email, password: TEST_USER.password };
    const ownModelId = await createTestModelViaApi(
      page,
      `E2E_CustomizationOwn_${timestamp}`,
      'public',
      auth,
    );
    const ownProto = await createTestPrototypeViaApi(page, {
      name: `E2E_CustomizationOwnProto_${timestamp}`,
      modelId: ownModelId,
      auth,
    });

    try {
      await loginAs(page, owner.email, TEST_USER.password);
      await gotoPrototypePage(page, ownModelId, ownProto.prototypeId);

      await expect(page.locator(PROTOTYPE_MENU_TRIGGER)).toBeVisible({ timeout: 15000 });
      const labels = await openMenuItems(page, PROTOTYPE_MENU_TRIGGER);
      expect(labels).toContain('Customize Prototype Layout');
      // Saving a prototype template stays admin-only.
      expect(labels).not.toContain('Save Prototype as Template');
    } finally {
      await loginAsAdmin(page);
      await deletePrototypeViaApi(page, ownProto.prototypeId).catch(() => {});
      await deleteModelViaApi(page, ownModelId).catch(() => {});
      await deleteTestUserViaApi(page, owner.id).catch(() => {});
    }
  });

  test('TC8: flag off hides the menu for a non-admin owner too', async ({ page }) => {
    const timestamp = Date.now();
    await loginAsAdmin(page);

    const owner = await createTestUserViaApi(page, {
      email: `e2e_customization_off_${timestamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E Customization Off ${timestamp}`,
    });
    const auth = { email: owner.email, password: TEST_USER.password };
    const ownModelId = await createTestModelViaApi(
      page,
      `E2E_CustomizationOff_${timestamp}`,
      'public',
      auth,
    );

    try {
      await setFlag(page, false);
      await loginAs(page, owner.email, TEST_USER.password);
      await gotoModelPage(page, ownModelId);

      await expect(page.locator(MODEL_MENU_TRIGGER)).toHaveCount(0);
    } finally {
      await loginAsAdmin(page);
      await deleteModelViaApi(page, ownModelId).catch(() => {});
      await deleteTestUserViaApi(page, owner.id).catch(() => {});
    }
  });
});
