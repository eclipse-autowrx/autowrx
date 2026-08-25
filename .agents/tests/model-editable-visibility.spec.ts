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
  loginAs,
  logout,
  saveScreenshot,
  createTestUserViaApi,
  deleteTestUserViaApi,
  deleteModelViaApi,
  deleteModelTemplateViaApi,
  createEditableReleasedModelViaApi,
  createPublicReleasedModelViaApi,
  createTestPrototypeViaApi,
  createModelTemplateViaApi,
  getModelTemplateViaApi,
  createModelWithTemplateViaApi,
  getModelViaApi,
  getPrototypeViaApi,
  setPrototypeCodeViaApi,
  goToPrototypeCodeTab,
  assertPrototypeLibraryCreateEnabled,
  configureHomeModelListSection,
  gotoHomeModelList,
  getHomeModelListSection,
  TEST_USER,
} from './helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Model Editable Visibility', () => {
  test.setTimeout(90000);

  const createdModelIds: string[] = [];
  const createdTemplateIds: string[] = [];
  let testUserId: string | null = null;
  let testUserEmail: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    await configureHomeModelListSection(page);
    await page.close();
  });

  test.afterEach(async ({ page }) => {
    await loginAsAdmin(page);
    while (createdModelIds.length > 0) {
      const modelId = createdModelIds.pop();
      if (modelId) {
        await deleteModelViaApi(page, modelId).catch(() => {});
      }
    }
    while (createdTemplateIds.length > 0) {
      const templateId = createdTemplateIds.pop();
      if (templateId) {
        await deleteModelTemplateViaApi(page, templateId).catch(() => {});
      }
    }
    if (testUserId) {
      await deleteTestUserViaApi(page, testUserId).catch(() => {});
      testUserId = null;
      testUserEmail = null;
    }
  });

  async function createSecondaryUser(page: Page, label: string) {
    const timestamp = Date.now();
    const testUser = await createTestUserViaApi(page, {
      email: `e2e_editable_${label}_${timestamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E Editable ${label} ${timestamp}`,
    });
    testUserId = testUser.id;
    testUserEmail = testUser.email;
    return testUser;
  }

  test('TC1: non-owner can create prototype on editable model', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `E2E_EditableCreate_${timestamp}`;
    const protoName = `E2E_EditableProto_${timestamp}`;

    await loginAsAdmin(page);
    const modelId = await createEditableReleasedModelViaApi(page, modelName);
    createdModelIds.push(modelId);

    const testUser = await createSecondaryUser(page, 'create');
    await logout(page);
    await loginAs(page, testUser.email, TEST_USER.password);

    await page.goto(`/model/${modelId}/library/list`);
    await page.waitForTimeout(2000);
    await assertPrototypeLibraryCreateEnabled(page, true);

    const { prototypeId } = await createTestPrototypeViaApi(page, {
      name: protoName,
      modelId,
      auth: { email: testUser.email, password: TEST_USER.password },
    });
    expect(prototypeId).toBeTruthy();

    await page.goto(`/model/${modelId}/library/list`);
    await page.waitForTimeout(2000);
    await expect(
      page.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`).first(),
    ).toBeVisible({ timeout: 20000 });

    await saveScreenshot(page, 'editable-visibility-tc1-create');
  });

  test('TC2: non-owner cannot create on public released model', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `E2E_PublicNoCreate_${timestamp}`;

    await loginAsAdmin(page);
    const modelId = await createPublicReleasedModelViaApi(page, modelName);
    createdModelIds.push(modelId);

    const testUser = await createSecondaryUser(page, 'blocked');
    await logout(page);
    await loginAs(page, testUser.email, TEST_USER.password);

    await page.goto(`/model/${modelId}/library/list`);
    await page.waitForTimeout(2000);
    await assertPrototypeLibraryCreateEnabled(page, false);

    await saveScreenshot(page, 'editable-visibility-tc2-blocked');
  });

  test('TC3: guest can view editable model but cannot create', async ({ browser }) => {
    const timestamp = Date.now();
    const modelName = `E2E_EditableGuest_${timestamp}`;

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAsAdmin(adminPage);
    const modelId = await createEditableReleasedModelViaApi(adminPage, modelName);
    createdModelIds.push(modelId);
    await adminContext.close();

    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await guestPage.goto(`/model/${modelId}/library/list`);
    await guestPage.waitForTimeout(3000);

    await expect(guestPage.getByText(modelName).first()).toBeVisible({ timeout: 20000 });
    await assertPrototypeLibraryCreateEnabled(guestPage, false);

    await saveScreenshot(guestPage, 'editable-visibility-tc3-guest-view-only');
    await guestContext.close();
  });

  test('TC4: guest home shows editable and public released models', async ({ browser }) => {
    const timestamp = Date.now();
    const publicName = `E2E_HomePublic_${timestamp}`;
    const editableName = `E2E_HomeEditable_${timestamp}`;

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAsAdmin(adminPage);
    await configureHomeModelListSection(adminPage);
    createdModelIds.push(await createPublicReleasedModelViaApi(adminPage, publicName));
    createdModelIds.push(await createEditableReleasedModelViaApi(adminPage, editableName));
    await adminContext.close();

    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await gotoHomeModelList(guestPage);

    const section = getHomeModelListSection(guestPage);
    await expect(section.getByText(publicName)).toBeVisible({ timeout: 20000 });
    await expect(section.getByText(editableName)).toBeVisible({ timeout: 20000 });

    await saveScreenshot(guestPage, 'editable-visibility-tc4-guest-home-shows-editable');
    await guestContext.close();
  });

  test('TC5: non-owner can edit prototype they created', async ({ page }) => {
    test.setTimeout(120000);
    const timestamp = Date.now();
    const modelName = `E2E_EditableEdit_${timestamp}`;
    const protoName = `E2E_EditableEditProto_${timestamp}`;
    const updatedCode = `print("e2e_editable_edit_${timestamp}")`;

    await loginAsAdmin(page);
    const modelId = await createEditableReleasedModelViaApi(page, modelName);
    createdModelIds.push(modelId);

    const testUser = await createSecondaryUser(page, 'edit');
    await logout(page);
    await loginAs(page, testUser.email, TEST_USER.password);

    const { prototypeId } = await createTestPrototypeViaApi(page, {
      name: protoName,
      modelId,
      auth: { email: testUser.email, password: TEST_USER.password },
    });
    expect(prototypeId).toMatch(/^[a-f0-9]{24}$/i);

    await goToPrototypeCodeTab(page, modelId, prototypeId);
    await expect(page).toHaveURL(
      new RegExp(`/model/${modelId}/library/prototype/${prototypeId}/code`),
    );

    const monaco = page.locator('.monaco-editor').first();
    await expect(monaco).toBeVisible({ timeout: 30000 });
    // Monaco marks read-only editors with the `readonly` class (more stable than textarea.inputarea).
    await expect(monaco).not.toHaveClass(/readonly/);

    await setPrototypeCodeViaApi(page, prototypeId, updatedCode, {
      email: testUser.email,
      password: TEST_USER.password,
    });

    const prototype = await getPrototypeViaApi(page, prototypeId, {
      email: testUser.email,
      password: TEST_USER.password,
    });
    expect(prototype.code).toContain(updatedCode);

    await saveScreenshot(page, 'editable-visibility-tc5-edit');
  });

  test('TC6: new-prototype picker lists editable model', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `E2E_EditablePicker_${timestamp}`;

    await loginAsAdmin(page);
    const modelId = await createEditableReleasedModelViaApi(page, modelName);
    createdModelIds.push(modelId);

    const testUser = await createSecondaryUser(page, 'picker');
    await logout(page);
    await loginAs(page, testUser.email, TEST_USER.password);

    await page.goto('/new-prototype');
    await page.waitForTimeout(3000);

    await expect(page.getByText('Loading models...')).toBeHidden({ timeout: 20000 });

    const modelSelect = page.getByRole('combobox').first();
    await expect(modelSelect).toBeVisible({ timeout: 15000 });
    await modelSelect.click();
    await expect(page.getByRole('option', { name: modelName })).toBeVisible({ timeout: 15000 });

    await saveScreenshot(page, 'editable-visibility-tc6-picker');
  });

  test('TC7: template keeps editable and is_default together', async ({ page }) => {
    const timestamp = Date.now();
    const templateName = `E2E_EditableDefaultTpl_${timestamp}`;

    await loginAsAdmin(page);
    const templateId = await createModelTemplateViaApi(page, {
      name: templateName,
      visibility: 'editable',
      is_default: true,
    });
    createdTemplateIds.push(templateId);

    const template = await getModelTemplateViaApi(page, templateId);
    expect(template.visibility).toBe('editable');
    expect(template.is_default).toBe(true);

    await saveScreenshot(page, 'editable-visibility-tc7-template-default');
  });

  test('TC8: model inherits template editable visibility', async ({ page }) => {
    const timestamp = Date.now();
    const templateName = `E2E_EditableInheritTpl_${timestamp}`;
    const modelName = `E2E_EditableInheritModel_${timestamp}`;

    await loginAsAdmin(page);
    const templateId = await createModelTemplateViaApi(page, {
      name: templateName,
      visibility: 'editable',
    });
    createdTemplateIds.push(templateId);

    const modelId = await createModelWithTemplateViaApi(page, modelName, templateId);
    createdModelIds.push(modelId);

    const model = await getModelViaApi(page, modelId);
    expect(model.visibility).toBe('editable');
    const linkedTemplateId =
      typeof model.model_template_id === 'object' && model.model_template_id
        ? (model.model_template_id as { id?: string }).id
        : model.model_template_id;
    expect(String(linkedTemplateId || '')).toBe(templateId);

    await saveScreenshot(page, 'editable-visibility-tc8-inherit');
  });
});
