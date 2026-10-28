// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect, Page } from '@playwright/test';
import {
  API_URL,
  TEST_USER,
  loginAs,
  loginAsAdmin,
  getAuthToken,
  getSiteConfigValue,
  updateSiteConfigValue,
  createTestUserViaApi,
  deleteTestUserViaApi,
  createTestModelViaApi,
  createTestPrototypeViaApi,
  addModelPermissionViaApi,
  setPrototypeCodeViaApi,
  getPrototypeViaApi,
  getPrototypeIdFromUrl,
  goToPrototypeCodeTab,
  deleteModelViaApi,
  deletePrototypeViaApi,
  type CreatedTestUser,
} from './helpers';

test.describe.configure({ mode: 'serial' });

// Error toasts: react-toastify (`--error`) and the radix toaster (`destructive`).
const ERROR_TOAST = '.Toastify__toast--error, li.destructive';

const stamp = Date.now();
const SIGNAL_CODE = 'print(Vehicle.Speed.get())\n';

// Move to another prototype WITHOUT a page reload (the app keeps the previously
// opened prototype in a client-side store; this is where stale code leaked from).
async function navigateInApp(page: Page, path: string) {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

async function authedApi(page: Page, method: 'post' | 'delete', path: string, data?: unknown) {
  const token = await getAuthToken(page);
  const res = await page.request[method](`${API_URL}${path}`, {
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  return res;
}

test.describe('Prototype regressions', () => {
  test.setTimeout(120000);

  const modelIds: string[] = [];
  const prototypeIds: string[] = [];
  const userIds: string[] = [];
  const apiSetIds: string[] = [];
  const apiSchemaIds: string[] = [];
  let disableApiSetsOriginal: string | null = null;

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      if (disableApiSetsOriginal !== null) {
        await updateSiteConfigValue(page, 'DISABLE_CUSTOM_API_SETS', disableApiSetsOriginal).catch(() => {});
      }
      for (const id of apiSetIds) await authedApi(page, 'delete', `/v2/custom-api-sets/${id}`).catch(() => {});
      for (const id of apiSchemaIds) await authedApi(page, 'delete', `/v2/custom-api-schema/${id}`).catch(() => {});
      for (const id of prototypeIds) await deletePrototypeViaApi(page, id).catch(() => {});
      for (const id of modelIds) await deleteModelViaApi(page, id).catch(() => {});
      for (const id of userIds) await deleteTestUserViaApi(page, id).catch(() => {});
    } finally {
      await page.close();
    }
  });

  async function createUser(page: Page, tag: string): Promise<CreatedTestUser> {
    const user = await createTestUserViaApi(page, {
      email: `e2e_${tag}_${stamp}@example.com`,
      name: `E2E_${tag}_${stamp}`,
    });
    userIds.push(user.id);
    return user;
  }

  // #262
  test('#262 new prototype code tab is empty: no stale code and no signals from another prototype', async ({ page }) => {
    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, `E2E_Empty_Code_Model_${stamp}`, 'private');
    modelIds.push(modelId);
    const withCode = await createTestPrototypeViaApi(page, { name: `E2E_Empty_Code_With_${stamp}`, modelId });
    const blank = await createTestPrototypeViaApi(page, { name: `E2E_Empty_Code_Blank_${stamp}`, modelId });
    prototypeIds.push(withCode.prototypeId, blank.prototypeId);
    await setPrototypeCodeViaApi(page, withCode.prototypeId, SIGNAL_CODE);
    // The model default for a new prototype is a starter snippet; blank it to get "no code generated".
    await setPrototypeCodeViaApi(page, blank.prototypeId, '');
    // A new model has no VSS tree; serve a fixed one so `Vehicle.Speed` counts as a used signal.
    await page.route(`**/v2/models/${modelId}/api`, (route) =>
      route.fulfill({
        json: { Vehicle: { type: 'branch', children: { Speed: { type: 'sensor', datatype: 'float' } } } },
      }),
    );

    // The prototype with code shows it and lists its used signal (proves the checks below can fail).
    await goToPrototypeCodeTab(page, modelId, withCode.prototypeId);
    const editorText = page.locator('.monaco-editor .view-lines').first();
    await expect(editorText).toContainText('Vehicle.Speed', { timeout: 20000 });
    const usedSignals = page.locator('.signal-list-item');
    await expect(usedSignals.first()).toBeVisible({ timeout: 20000 });

    // Switch to the blank prototype inside the SPA: nothing from the first one may remain.
    const blankLoaded = page.waitForResponse(
      (res) => res.url().includes(`/prototypes/${blank.prototypeId}`) && res.request().method() === 'GET' && res.ok(),
    );
    await navigateInApp(page, `/model/${modelId}/library/prototype/${blank.prototypeId}/code`);
    await blankLoaded;
    await expect(page).toHaveURL(new RegExp(`/prototype/${blank.prototypeId}/code`));
    await expect(editorText).not.toContainText('Vehicle.Speed', { timeout: 20000 });
    await expect(editorText).toHaveText(/^\s*$/);
    await expect(usedSignals).toHaveCount(0);

    // The saved record is empty too, and a fresh load agrees.
    expect((await getPrototypeViaApi(page, blank.prototypeId)).code ?? '').toBe('');
    await goToPrototypeCodeTab(page, modelId, blank.prototypeId);
    await expect(editorText).toHaveText(/^\s*$/);
    await expect(usedSignals).toHaveCount(0);
  });

  // #262
  // The Run button (data-id="btn-run-prototype") is enabled/disabled only by "is a runtime selected and not
  // already running" (DaRuntimeControl: canRun = hasRuntimeSelected && !isRunning). It never looks at the code,
  // so with a runtime online it is enabled for an empty prototype. There is no built-in Deploy button either
  // (staging is an opt-in builtin via custom_template). The "Run/Deploy disabled for empty code" part of #262
  // is therefore not implemented in core.
  test.fixme('#262 Run button is disabled for a prototype with no code', async () => {});

  // #214
  test('#214 code page has no Save/Update button and edits are autosaved across reload', async ({ page }) => {
    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, `E2E_Autosave_Model_${stamp}`, 'private');
    modelIds.push(modelId);
    const { prototypeId } = await createTestPrototypeViaApi(page, { name: `E2E_Autosave_Proto_${stamp}`, modelId });
    prototypeIds.push(prototypeId);
    await setPrototypeCodeViaApi(page, prototypeId, '# original\n');

    await goToPrototypeCodeTab(page, modelId, prototypeId);
    const editor = page.locator('.monaco-editor').first();
    await expect(editor.locator('.view-lines')).toContainText('# original', { timeout: 20000 });

    await expect(page.getByRole('button', { name: /^\s*(save|update)/i })).toHaveCount(0);

    const marker = `# E2E_AUTOSAVE_${stamp}`;
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type(marker);
    await expect(editor.locator('.view-lines')).toContainText(marker);

    // No click on any save control: the periodic/blur autosave must persist it.
    await expect
      .poll(async () => (await getPrototypeViaApi(page, prototypeId)).code, { timeout: 20000 })
      .toContain(marker);

    await page.reload();
    await expect(page.locator('.monaco-editor .view-lines').first()).toContainText(marker, { timeout: 30000 });
    await expect(page.getByRole('button', { name: /^\s*(save|update)/i })).toHaveCount(0);
  });

  // #308
  test('#308 reopening a prototype code page loads its code without an error', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, `E2E_Reopen_Model_${stamp}`, 'private');
    modelIds.push(modelId);
    const { prototypeId } = await createTestPrototypeViaApi(page, { name: `E2E_Reopen_Proto_${stamp}`, modelId });
    prototypeIds.push(prototypeId);
    const marker = `E2E_REOPEN_${stamp}`;
    await setPrototypeCodeViaApi(page, prototypeId, `# ${marker}\n`);

    const codeText = page.locator('.monaco-editor .view-lines').first();
    const errorToast = page.locator(ERROR_TOAST);

    await goToPrototypeCodeTab(page, modelId, prototypeId);
    await expect(codeText).toContainText(marker, { timeout: 20000 });

    // Navigate away within the app (overview) and back to the code tab.
    await navigateInApp(page, `/model/${modelId}/library/prototype/${prototypeId}/view`);
    await expect(page).toHaveURL(/\/view$/);
    await navigateInApp(page, `/model/${modelId}/library/prototype/${prototypeId}/code`);
    await expect(page).toHaveURL(/\/code$/);
    await expect(codeText).toContainText(marker, { timeout: 20000 });

    // And a fresh page load of the same URL.
    await goToPrototypeCodeTab(page, modelId, prototypeId);
    await expect(codeText).toContainText(marker, { timeout: 20000 });

    await expect(errorToast).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  // #283
  test('#283 new-prototype model picker hides other users private models and creates under a selected owned model', async ({ page }) => {
    await loginAsAdmin(page);
    const actor = await createUser(page, 'Picker_Actor');
    const other = await createUser(page, 'Picker_Other');
    const actorAuth = { email: actor.email, password: TEST_USER.password };
    const otherAuth = { email: other.email, password: TEST_USER.password };

    const ownName = `E2E_Picker_Own_${stamp}`;
    const contributedName = `E2E_Picker_Contrib_${stamp}`;
    const foreignPrivateName = `E2E_Picker_ForeignPrivate_${stamp}`;
    const ownId = await createTestModelViaApi(page, ownName, 'private', actorAuth);
    const contributedId = await createTestModelViaApi(page, contributedName, 'private', otherAuth);
    const foreignPrivateId = await createTestModelViaApi(page, foreignPrivateName, 'private', otherAuth);
    modelIds.push(ownId, contributedId, foreignPrivateId);
    await addModelPermissionViaApi(page, contributedId, actor.id, 'model_contributor', otherAuth);

    await loginAs(page, actor.email, TEST_USER.password);
    await page.goto('/new-prototype');
    await expect(page.getByText('Loading models...')).toBeHidden({ timeout: 20000 });

    const modelSelect = page.getByRole('combobox').first();
    await modelSelect.click();
    await expect(page.getByRole('option', { name: ownName })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('option', { name: contributedName })).toBeVisible();
    await expect(page.getByRole('option', { name: foreignPrivateName })).toHaveCount(0);

    // Select the existing owned model and create: the prototype must land under it.
    await page.getByRole('option', { name: ownName }).click();
    await expect(modelSelect).toContainText(ownName);
    const protoName = `E2E_Picker_Proto_${stamp}`;
    await page.locator('[data-id="prototype-name-input"]').fill(protoName);
    const created = page.waitForResponse(
      (res) => new URL(res.url()).pathname === '/v2/prototypes' && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
    const body = await (await created).json();
    prototypeIds.push(String(body.id || body._id));
    await expect(page).toHaveURL(new RegExp(`/model/${ownId}/library/prototype/`), { timeout: 30000 });

    const prototype = await getPrototypeViaApi(page, getPrototypeIdFromUrl(page.url()), actorAuth);
    expect(prototype.name).toBe(protoName);
    const savedModel = prototype.model_id as unknown as string | { id?: string; _id?: string };
    expect(typeof savedModel === 'object' ? String(savedModel.id || savedModel._id) : savedModel).toBe(ownId);
  });

  // #284
  test('#284 feedback Submit stays disabled until every required field is filled', async ({ page }) => {
    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, `E2E_Feedback_Model_${stamp}`, 'private');
    modelIds.push(modelId);
    const { prototypeId } = await createTestPrototypeViaApi(page, { name: `E2E_Feedback_Proto_${stamp}`, modelId });
    prototypeIds.push(prototypeId);

    await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/feedback`);
    await page.getByRole('button', { name: '+ Add Feedback' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const submit = dialog.getByRole('button', { name: 'Submit' });
    const stars = (label: string) =>
      dialog.locator('div.flex.items-center', { hasText: label }).locator('span[style*="cursor: pointer"]');

    // Each required field in turn; Submit flips to enabled only with the last one.
    await expect(submit).toBeDisabled();
    await dialog.locator('input[name="interviewee"]').fill('E2E Reviewer');
    await expect(submit).toBeDisabled();
    await dialog.locator('input[name="organization"]').fill('AutoWRX QA');
    await expect(submit).toBeDisabled();
    await stars('Needs addressed').nth(3).click();
    await expect(submit).toBeDisabled();
    await stars('Relevance').nth(3).click();
    await expect(submit).toBeDisabled();
    await stars('Ease of use').nth(3).click();
    await expect(submit).toBeEnabled();

    // Emptying a required text field disables it again.
    await dialog.locator('input[name="interviewee"]').fill('');
    await expect(submit).toBeDisabled();
    await dialog.locator('input[name="interviewee"]').fill('E2E Reviewer');
    await expect(submit).toBeEnabled();
  });

  // #269
  // Current intended behaviour (CustomApiSetPicker.tsx, PageVehicleApi.tsx): the "Select API Set" dialog keeps a
  // working "Search instances..." box (server-side filter by set name, exact match: the backend name filter is
  // an equality match, not a substring match). The broken-control part of the fix is that the "+" that opens the
  // dialog is gated behind the DISABLE_CUSTOM_API_SETS site config: when disabled, the whole API-set tab bar
  // (and so the "+" and the dialog) is absent. Both halves are asserted below.
  test('#269 Select API Set search filters sets by name and the "+" control is absent when API sets are disabled', async ({ page }) => {
    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, `E2E_ApiSet_Model_${stamp}`, 'private');
    modelIds.push(modelId);

    const schemaRes = await authedApi(page, 'post', '/v2/custom-api-schema', {
      code: `e2e_regr_${stamp}`,
      name: `E2E_Regr_Schema_${stamp}`,
      type: 'list',
      schema: '{}',
    });
    expect(schemaRes.ok(), await schemaRes.text()).toBe(true);
    const schemaId = String((await schemaRes.json()).id);
    apiSchemaIds.push(schemaId);

    const setNames: string[] = [];
    for (const suffix of ['Alpha', 'Beta']) {
      const name = `E2E_Regr_Set_${suffix}_${stamp}`;
      const res = await authedApi(page, 'post', '/v2/custom-api-sets', {
        custom_api_schema: schemaId,
        custom_api_schema_code: `e2e_regr_${stamp}`,
        scope: 'system',
        name,
        data: { items: [] },
      });
      expect(res.ok(), await res.text()).toBe(true);
      apiSetIds.push(String((await res.json()).id));
      setNames.push(name);
    }
    const [alpha, beta] = setNames;

    disableApiSetsOriginal = await getSiteConfigValue(page, 'DISABLE_CUSTOM_API_SETS');
    await updateSiteConfigValue(page, 'DISABLE_CUSTOM_API_SETS', 'false');

    // Enabled: "+" opens the picker; searching by a set name narrows the list to that set.
    await page.goto(`/model/${modelId}/api`);
    const tabBar = page.locator('.da-page-vehicle-api-tab-bar');
    await expect(tabBar).toBeVisible({ timeout: 20000 });
    await tabBar.locator('button').click();
    const dialog = page.getByRole('dialog', { name: 'Select API Set' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(alpha)).toBeVisible({ timeout: 15000 });
    await expect(dialog.getByText(beta)).toBeVisible();

    const search = dialog.getByPlaceholder('Search instances...');
    await search.fill(alpha);
    await expect(dialog.getByText(alpha)).toBeVisible();
    await expect(dialog.getByText(beta)).toHaveCount(0);

    await search.fill(`E2E_Regr_NoSuchSet_${stamp}`);
    await expect(dialog.getByText('No sets match your search.')).toBeVisible();

    await search.fill('');
    await expect(dialog.getByText(beta)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // Disabled: no tab bar / "+" control and no picker at all.
    await updateSiteConfigValue(page, 'DISABLE_CUSTOM_API_SETS', 'true');
    await page.goto(`/model/${modelId}/api`);
    await expect(page.locator('.da-page-vehicle-api')).toBeVisible({ timeout: 20000 });
    await expect(tabBar).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Select API Set' })).toHaveCount(0);
  });
});
