// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect, Locator, Page } from '@playwright/test';
import {
  loginAsAdmin,
  createTestModelViaApi,
  createTestPrototypeViaApi,
  deleteModelViaApi,
  deletePrototypeViaApi,
  getPrototypeViaApi,
  getPrototypeIdFromUrl,
  getSiteConfigJson,
  setSiteConfigJson,
  configureHomeModelListSection,
  gotoHomeModelList,
  selectHomeModelCategory,
  getHomeModelListSection,
  openModelContextMenu,
} from './helpers';

const DUPLICATE_MODEL_MSG = 'A model with this name already exists';

async function openCreateModelDialog(page: Page): Promise<Locator> {
  const section = getHomeModelListSection(page);
  await section.getByRole('button', { name: /Add Model/i }).click();
  const createDialog = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: 'Create New Model' }),
  });
  await expect(createDialog).toBeVisible({ timeout: 15000 });
  return createDialog;
}

test.describe.configure({ mode: 'serial' });

test.describe('Name validation regressions', () => {
  test.setTimeout(120000);

  let originalHomeContent: unknown = null;
  const createdModelIds: string[] = [];
  const createdPrototypeIds: string[] = [];

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
    while (createdPrototypeIds.length > 0) {
      const prototypeId = createdPrototypeIds.pop();
      if (prototypeId) {
        await deletePrototypeViaApi(page, prototypeId).catch(() => {});
      }
    }
    while (createdModelIds.length > 0) {
      const modelId = createdModelIds.pop();
      if (modelId) {
        await deleteModelViaApi(page, modelId).catch(() => {});
      }
    }
    await page.close();
  });

  // #235 #268 — duplicate model name shows an error in the create dialog; a
  // unique name shows none, and none survives a successful creation.
  test('#235 #268 create-model dialog flags duplicate names and clears validation after creation', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const existingName = `E2E_DupModel-${timestamp}`;
    const uniqueName = `E2E_UniqueModel-${timestamp}`;

    await loginAsAdmin(page);
    const existingModelId = await createTestModelViaApi(page, existingName, 'private');
    createdModelIds.push(existingModelId);

    await gotoHomeModelList(page);
    await selectHomeModelCategory(page, 'My Models');

    const createDialog = await openCreateModelDialog(page);
    const nameInput = createDialog.locator('[data-id="form-create-model-input-name"]');
    const submitBtn = createDialog.locator('[data-id="form-create-model-btn-submit"]');

    // Typing an existing owned model's name shows the duplicate error.
    await nameInput.fill(existingName);
    await expect(createDialog.getByText(DUPLICATE_MODEL_MSG)).toBeVisible({
      timeout: 10000,
    });
    await expect(submitBtn).toBeDisabled();

    // Typing a unique name clears it.
    await nameInput.fill(uniqueName);
    await expect(createDialog.getByText(DUPLICATE_MODEL_MSG)).toHaveCount(0, {
      timeout: 10000,
    });
    await expect(submitBtn).toBeEnabled();

    // Creating with the unique name succeeds and leaves no validation message.
    await submitBtn.click();
    await page.waitForURL(/\/model\/[^/?]+$/, { timeout: 30000 });
    const createdId = new URL(page.url()).pathname.split('/model/')[1];
    createdModelIds.push(createdId);
    await expect(page.getByText(DUPLICATE_MODEL_MSG)).toHaveCount(0);
    await expect(page.getByText(uniqueName).first()).toBeVisible({ timeout: 15000 });
  });

  // #234 — submit button enabled only for a valid, unique, non-empty name.
  test('#234 create-model submit disabled for empty and duplicate names, enabled for unique', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const existingName = `E2E_SubmitDup-${timestamp}`;
    const uniqueName = `E2E_SubmitOk-${timestamp}`;

    await loginAsAdmin(page);
    const existingModelId = await createTestModelViaApi(page, existingName, 'private');
    createdModelIds.push(existingModelId);

    await gotoHomeModelList(page);
    await selectHomeModelCategory(page, 'My Models');

    const createDialog = await openCreateModelDialog(page);
    const nameInput = createDialog.locator('[data-id="form-create-model-input-name"]');
    const submitBtn = createDialog.locator('[data-id="form-create-model-btn-submit"]');

    // Empty name: disabled.
    await expect(nameInput).toHaveValue('');
    await expect(submitBtn).toBeDisabled();

    // Duplicate name: disabled once the debounced check flags it.
    await nameInput.fill(existingName);
    await expect(createDialog.getByText(DUPLICATE_MODEL_MSG)).toBeVisible({
      timeout: 10000,
    });
    await expect(submitBtn).toBeDisabled();

    // Valid unique name: enabled.
    await nameInput.fill(uniqueName);
    await expect(createDialog.getByText(DUPLICATE_MODEL_MSG)).toHaveCount(0, {
      timeout: 10000,
    });
    await expect(submitBtn).toBeEnabled();
  });

  // #296 — duplicate-name error renders directly below the name input.
  test('#296 duplicate-name error is positioned below and overlapping the name input', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const existingName = `E2E_PosDup-${timestamp}`;

    await loginAsAdmin(page);
    const existingModelId = await createTestModelViaApi(page, existingName, 'private');
    createdModelIds.push(existingModelId);

    await gotoHomeModelList(page);
    await selectHomeModelCategory(page, 'My Models');

    const createDialog = await openCreateModelDialog(page);
    const nameInput = createDialog.locator('[data-id="form-create-model-input-name"]');
    await nameInput.fill(existingName);

    const errorBox = createDialog.locator('p').filter({ hasText: DUPLICATE_MODEL_MSG });
    await expect(errorBox).toBeVisible({ timeout: 10000 });

    const inputBox = await nameInput.boundingBox();
    const errBox = await errorBox.boundingBox();
    expect(inputBox).not.toBeNull();
    expect(errBox).not.toBeNull();

    // Vertically below: error top >= input bottom.
    expect(errBox!.y).toBeGreaterThanOrEqual(inputBox!.y + inputBox!.height);

    // Horizontally overlapping the input.
    expect(errBox!.x).toBeLessThan(inputBox!.x + inputBox!.width);
    expect(errBox!.x + errBox!.width).toBeGreaterThan(inputBox!.x);
  });

  // #236 — renaming a model to another existing model's name is rejected by
  // the backend (409) and the original name survives a reload. Note: there is
  // no inline rename on the model detail page; the rename path is the home
  // model-list context menu (same dialog home-model-list.spec.ts uses). The
  // home rename dialog itself has no client-side duplicate check — the block
  // comes from the API, which returns 409 and the card keeps its old name.
  test('#236 renaming a model to an existing model name is rejected and keeps the original name', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const nameA = `E2E_RenameA-${timestamp}`;
    const nameB = `E2E_RenameB-${timestamp}`;

    await loginAsAdmin(page);
    const modelAId = await createTestModelViaApi(page, nameA, 'private');
    const modelBId = await createTestModelViaApi(page, nameB, 'private');
    createdModelIds.push(modelAId, modelBId);

    await gotoHomeModelList(page);
    await selectHomeModelCategory(page, 'My Models');

    const section = getHomeModelListSection(page);
    await openModelContextMenu(page, nameA, section);
    await page.getByRole('menuitem', { name: 'Rename' }).click();
    const renameDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: 'Rename Model' }),
    });
    await expect(renameDialog).toBeVisible({ timeout: 10000 });

    const patchPromise = page.waitForResponse(
      (res) =>
        res.url().includes(`/v2/models/${modelAId}`) && res.request().method() === 'PATCH',
      { timeout: 30000 },
    );
    await renameDialog.locator('input').fill(nameB);
    await renameDialog.getByRole('button', { name: 'Save' }).click();
    const patchRes = await patchPromise;

    // The rename is blocked server-side with a conflict.
    expect(patchRes.status()).toBe(409);

    // Reload and verify the model kept its original name.
    await page.keyboard.press('Escape');
    await gotoHomeModelList(page);
    await selectHomeModelCategory(page, 'My Models');
    await expect(section.locator(`[aria-label="${nameA}"]`)).toBeVisible({
      timeout: 20000,
    });
    await expect(section.locator(`[aria-label="${nameB}"]`)).toBeVisible();
  });

  // #55 — creating a prototype with a name already used in the model suggests
  // "<name>_1"; applying the suggestion allows creation.
  test('#55 duplicate prototype name suggests an alternative name that can be created', async ({
    page,
  }) => {
    const timestamp = Date.now();
    const modelName = `E2E_ProtoDupModel-${timestamp}`;
    // Hyphenated (not "_<digits>"-suffixed) so the suggestion is "<name>_1".
    const protoName = `E2E_ProtoDup-${timestamp}`;
    const suggestedName = `${protoName}_1`;

    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, modelName, 'private');
    createdModelIds.push(modelId);
    const { prototypeId } = await createTestPrototypeViaApi(page, {
      name: protoName,
      modelId,
    });
    createdPrototypeIds.push(prototypeId);

    await page.goto(`/model/${modelId}/library/list`);
    await page.locator('[data-id="btn-create-new-prototype"]').click();

    const nameInput = page.locator('[data-id="prototype-name-input"]').first();
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(protoName);

    // Duplicate hint ("already in use for model ...") with the "<name>_1"
    // suggestion, and Create Prototype blocked while duplicated.
    const hint = page
      .locator('p')
      .filter({ hasText: `is already in use for model '${modelName}'` });
    await expect(hint).toBeVisible({ timeout: 15000 });
    await expect(hint.getByText(suggestedName, { exact: true })).toBeVisible();

    const createBtn = page.locator('[data-id="btn-create-prototype"]');
    await expect(createBtn).toBeDisabled();

    // Apply the suggestion: hint clears, submit becomes possible.
    await hint.getByRole('button', { name: suggestedName, exact: true }).click();
    await expect(nameInput).toHaveValue(suggestedName);
    await expect(hint).toHaveCount(0);

    await expect(createBtn).toBeEnabled({ timeout: 15000 });
    await createBtn.click();
    await page.waitForURL(/\/library\/prototype\//, { timeout: 30000 });

    const newPrototypeId = getPrototypeIdFromUrl(page.url());
    createdPrototypeIds.push(newPrototypeId);
    const created = await getPrototypeViaApi(page, newPrototypeId);
    expect(created.name).toBe(suggestedName);
  });
});
