// Copyright (c) 2025 Eclipse Foundation.
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
  updatePrototypeViaApi,
  getPrototypeViaApi,
  deleteModelViaApi,
  deletePrototypeViaApi,
  openPrototypeContextMenu,
  searchPrototypeLibrary,
  getPrototypeIdFromUrl,
  getSiteConfigValue,
  updateSiteConfigValue,
} from './helpers';

const NEW_PROTOTYPE_PAGE_KEY = 'ENABLE_NEW_PROTOTYPE_PAGE';
const COPY_MENU_ITEM = 'Copy Prototype';

// Distinctive content so the assertions cannot pass on a default/empty prototype.
const SOURCE_CODE = 'from sdv_model import Vehicle\n\nvehicle = Vehicle()\n# E2E_COPY_MARKER\n';
const SOURCE_WIDGET_CONFIG = JSON.stringify([
  { widget: 'E2E Copy Widget', boxes: [1], options: { marker: 'E2E_COPY_WIDGET' } },
]);
const SOURCE_IMAGE = '/imgs/default_prototype_cover.jpg';
// dashboard_template_id must NOT survive the copy: carrying it over makes the
// copy's simulation tab load the template instead of the copied widget config.
const SOURCE_DASHBOARD_TEMPLATE_ID = 'e2e-copy-dashboard-template';

// Every content field the copy is expected to carry over. Values are chosen to
// differ from what the create step produces, so an assertion cannot pass just
// because the new prototype happened to be built from a matching template.
const SOURCE_CONTENT = {
  code: SOURCE_CODE,
  // Not 'python': the create step takes the language from the selected project
  // template, so a copy that ignores this field silently mislabels the code and
  // makes the runtime build it the wrong way.
  language: 'rust',
  apis: { VSC: [], VSS: ['Vehicle.Speed'] },
  widget_config: SOURCE_WIDGET_CONFIG,
  image_file: SOURCE_IMAGE,
  journey_image_file: '/imgs/e2e-copy-journey.jpg',
  analysis_image_file: '/imgs/e2e-copy-analysis.jpg',
  customer_journey: 'E2E copy customer journey',
  description: {
    problem: 'E2E copy problem',
    says_who: 'E2E copy says who',
    solution: 'E2E copy solution',
    status: 'E2E copy status',
  },
  tags: [{ title: 'e2e-copy-tag', description: 'tag carried by the copy' }],
  complexity_level: 5,
  portfolio: { effort_estimation: 4, needs_addressed: 3, relevance: 2 },
  skeleton: '{"e2e":"copy-skeleton"}',
  related_ea_components: 'E2E copy EA components',
  partner_logo: '/imgs/e2e-copy-partner.png',
  requirements: 'E2E copy requirements',
  requirements_data: { marker: 'E2E_COPY_REQUIREMENTS' },
  flow: { marker: 'E2E_COPY_FLOW' },
  autorun: false,
} as const;

// Must NOT follow the copy — identity, lifecycle and usage stats.
const NOT_COPIED_STATE = 'released';

test.describe.configure({ mode: 'serial' });

test.describe('Prototype Copy', () => {
  test.setTimeout(120000);

  let modelId: string | null = null;
  let sourceId: string | null = null;
  let copyId: string | null = null;
  let newPrototypePageBaseline: string | null = null;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);

    // The copy flow lands on /new-prototype. That route works either way, but the
    // library's own Create button only uses it when this flag is on, so the test
    // runs against the full-page flow as configured in real instances.
    newPrototypePageBaseline = await getSiteConfigValue(page, NEW_PROTOTYPE_PAGE_KEY);
    await updateSiteConfigValue(page, NEW_PROTOTYPE_PAGE_KEY, 'true');
  });

  test.afterEach(async ({ page }) => {
    await loginAsAdmin(page);
    if (copyId) {
      await deletePrototypeViaApi(page, copyId).catch(() => {});
      copyId = null;
    }
    if (sourceId) {
      await deletePrototypeViaApi(page, sourceId).catch(() => {});
      sourceId = null;
    }
    if (modelId) {
      await deleteModelViaApi(page, modelId).catch(() => {});
      modelId = null;
    }
    // getSiteConfigValue returns '' for an absent key, and there is no delete
    // helper — restoring '' would leave a bogus empty value behind, so only
    // write back a baseline that actually had one.
    if (newPrototypePageBaseline) {
      await updateSiteConfigValue(
        page,
        NEW_PROTOTYPE_PAGE_KEY,
        newPrototypePageBaseline,
      ).catch(() => {});
    }
    newPrototypePageBaseline = null;
  });

  async function seedSourcePrototype(page: Parameters<typeof loginAsAdmin>[0], label: string) {
    const timestamp = Date.now();
    const modelName = `E2E_CopyModel_${label}_${timestamp}`;
    const protoName = `E2E_CopySource_${label}_${timestamp}`;

    modelId = await createTestModelViaApi(page, modelName, 'private');
    const created = await createTestPrototypeViaApi(page, { name: protoName, modelId });
    sourceId = created.prototypeId;

    await updatePrototypeViaApi(page, sourceId, {
      ...SOURCE_CONTENT,
      state: NOT_COPIED_STATE,
      extend: {
        dashboard_template_id: SOURCE_DASHBOARD_TEMPLATE_ID,
        watch_vars: ['Vehicle.Speed'],
      },
    });

    return { protoName };
  }

  test('Copy Prototype is offered in the prototype card context menu', async ({ page }) => {
    const { protoName } = await seedSourcePrototype(page, 'Menu');

    await page.goto(`/model/${modelId}/library/list`);
    await searchPrototypeLibrary(page, protoName);

    await openPrototypeContextMenu(page, protoName);

    const copyItem = page.getByRole('menuitem', { name: COPY_MENU_ITEM });
    await expect(copyItem).toBeVisible({ timeout: 10000 });

    await saveScreenshot(page, 'prototype-copy-context-menu');
  });

  test('copying a prototype carries its content and drops the dashboard template', async ({
    page,
  }) => {
    const { protoName } = await seedSourcePrototype(page, 'Flow');

    await page.goto(`/model/${modelId}/library/list`);
    await searchPrototypeLibrary(page, protoName);

    await openPrototypeContextMenu(page, protoName);
    await page.getByRole('menuitem', { name: COPY_MENU_ITEM }).click();

    // Lands on the full-page create flow, carrying the source id.
    await expect(page).toHaveURL(
      new RegExp(`/new-prototype\\?.*model_id=${modelId}.*prototype_id=${sourceId}`),
    );

    // Name is pre-filled from the source, and stays editable once loading finishes.
    const nameInput = page.locator('[data-id="prototype-name-input"]').first();
    await expect(nameInput).toHaveValue(`${protoName} (Copy)`, { timeout: 20000 });
    await expect(nameInput).toBeEnabled({ timeout: 20000 });

    const copyName = `${protoName}_Copy`;
    await nameInput.fill(copyName);

    await page.getByRole('button', { name: 'Confirm' }).click();

    // On success we land on the new prototype's detail page.
    await expect(page).toHaveURL(
      new RegExp(`/model/${modelId}/library/prototype/[a-f0-9]+`),
      { timeout: 45000 },
    );
    copyId = getPrototypeIdFromUrl(page.url());
    expect(copyId).not.toBe(sourceId);

    // The copy step is a PATCH after create, so poll rather than read once.
    await expect
      .poll(
        async () => (await getPrototypeViaApi(page, copyId!)).code,
        { timeout: 30000 },
      )
      .toBe(SOURCE_CODE);

    const copied = await getPrototypeViaApi(page, copyId!);
    expect(copied.name).toBe(copyName);

    // Every content field is carried over.
    for (const [field, value] of Object.entries(SOURCE_CONTENT)) {
      expect(copied[field], `field "${field}" was not copied`).toEqual(value);
    }

    // extend is carried over, minus the dashboard template, plus the copy marker.
    expect(copied.extend?.copy).toBe(true);
    expect(copied.extend?.watch_vars).toEqual(['Vehicle.Speed']);
    // Regression guard: the source's dashboard template must not follow the copy.
    expect(copied.extend?.dashboard_template_id).toBeUndefined();

    // Identity, lifecycle and usage stats must NOT be inherited.
    // model_id comes back populated as the model document, not a bare id.
    const copiedModelId =
      typeof copied.model_id === 'string' ? copied.model_id : copied.model_id?.id;
    expect(copiedModelId).toBe(modelId);
    expect(copied.state).not.toBe(NOT_COPIED_STATE);
    expect(copied.executed_turns ?? 0).toBe(0);
    expect(copied.editors_choice ?? false).toBe(false);

    // The source is left untouched.
    const source = await getPrototypeViaApi(page, sourceId!);
    expect(source.name).toBe(protoName);
    expect(source.state).toBe(NOT_COPIED_STATE);
    expect(source.extend?.dashboard_template_id).toBe(SOURCE_DASHBOARD_TEMPLATE_ID);

    await saveScreenshot(page, 'prototype-copy-created');
  });

  test('a failed content copy still lands the user on the new prototype', async ({
    page,
  }) => {
    const { protoName } = await seedSourcePrototype(page, 'PatchFail');

    await page.goto(`/model/${modelId}/library/list`);
    await searchPrototypeLibrary(page, protoName);

    await openPrototypeContextMenu(page, protoName);
    await page.getByRole('menuitem', { name: COPY_MENU_ITEM }).click();

    const nameInput = page.locator('[data-id="prototype-name-input"]').first();
    await expect(nameInput).toBeEnabled({ timeout: 20000 });
    const copyName = `${protoName}_Copy`;
    await nameInput.fill(copyName);

    // Fail only the copy PATCH. The create POST must still succeed, so that we
    // exercise the state the guard exists for: the prototype is created, the
    // content copy is not.
    await page.route('**/prototypes/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.abort('failed');
        return;
      }
      await route.fallback();
    });

    await page.getByRole('button', { name: 'Confirm' }).click();

    // The user must not be stranded on the finished form: navigation happens
    // even though the copy failed.
    await expect(page).toHaveURL(
      new RegExp(`/model/${modelId}/library/prototype/[a-f0-9]+`),
      { timeout: 45000 },
    );
    copyId = getPrototypeIdFromUrl(page.url());

    // ...and the failure is reported rather than swallowed.
    // The toaster renders the message in more than one node, so scope to the first.
    await expect(
      page.getByText(/copying its content failed/i).first(),
    ).toBeVisible({ timeout: 15000 });

    await page.unroute('**/prototypes/*');
    await saveScreenshot(page, 'prototype-copy-patch-failed');
  });
});
