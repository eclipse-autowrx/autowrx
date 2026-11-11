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
  deleteModelViaApi,
  goToVehicleApiTab,
  getSiteConfigJson,
  setSiteConfigJson,
  configureHomeModelListSection,
  gotoHomeModelList,
  getHomeModelListSection,
} from './helpers';

const invalid = { Vehicle: { type: 'branch', children: { Cabin: { type: 'branch', children: {} } } } };
const valid = { Vehicle: { type: 'branch', children: { Speed: { type: 'sensor', datatype: 'float' } } } };

test('VSS preflight requires authentication and reports invalid paths', async ({ page }) => {
  const anonymous = await page.request.post(`${API_URL}/v2/models/validate-vss`, { data: { spec: valid } });
  expect(anonymous.status()).toBe(401);
  await loginAsAdmin(page);
  const headers = { Authorization: `Bearer ${await getAuthToken(page)}` };
  const rejected = await page.request.post(`${API_URL}/v2/models/validate-vss`, { headers, data: { spec: invalid } });
  expect(rejected.status()).toBe(400);
  expect((await rejected.json()).message).toBe('Invalid VSS at Vehicle.Cabin: branch must contain children.');
  const accepted = await page.request.post(`${API_URL}/v2/models/validate-vss`, { headers, data: { spec: valid } });
  expect(accepted.status()).toBe(204);
});

test('invalid VSS replacement is rejected before upload and preserves the existing model', async ({ page }) => {
  await loginAsAdmin(page);
  const modelId = await createTestModelViaApi(page, `E2E_VssValidation_${Date.now()}`, 'private');
  const headers = { Authorization: `Bearer ${await getAuthToken(page)}` };
  try {
    const before = await (await page.request.get(`${API_URL}/v2/models/${modelId}/api?raw=true`, { headers })).json();
    await goToVehicleApiTab(page, modelId);
    await page.getByRole('link', { name: 'Replace Vehicle API', exact: true }).click();
    const dialog = page.getByRole('dialog');
    const uploads: string[] = [];
    page.on('request', r => { if (r.url().includes('/file/upload')) uploads.push(r.url()); });
    const preflight = page.waitForResponse(r => r.url().endsWith('/models/validate-vss'));
    await dialog.locator('input[type="file"]').setInputFiles({ name: 'invalid-vss.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) });
    expect((await preflight).status()).toBe(400);
    const alert = page.getByRole('alert').filter({ hasText: 'Invalid file:' });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Vehicle.Cabin is an empty branch. Add at least one signal to it, then upload the file again.');
    await expect(alert).not.toContainText(/Error:|\bat Object\.|node:internal|model\.service\.js|model\.controller\.js/);
    // The file is checked before upload, so nothing is stored and Replace stays disabled.
    expect(uploads).toHaveLength(0);
    await expect(dialog.getByRole('button', { name: 'Replace Vehicle API', exact: true })).toBeDisabled();
    const after = await (await page.request.get(`${API_URL}/v2/models/${modelId}/api?raw=true`, { headers })).json();
    expect(after).toEqual(before);
  } finally {
    await deleteModelViaApi(page, modelId);
  }
});

test('create-model upload rejects invalid VSS before storing the file', async ({ page }) => {
  await loginAsAdmin(page);
  const originalHomeContent = await getSiteConfigJson(page, 'CFG_HOME_CONTENT');
  try {
    await configureHomeModelListSection(page);
    await gotoHomeModelList(page);
    await getHomeModelListSection(page).getByRole('button', { name: /Add Model/i }).click();
    const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Create New Model' }) });
    await expect(dialog).toBeVisible({ timeout: 15000 });
    await dialog.locator('[data-id="form-create-model-input-name"]').fill(`E2E_VssCreate_${Date.now()}`);

    const uploads: string[] = [];
    page.on('request', r => { if (r.url().includes('/file/upload')) uploads.push(r.url()); });
    const preflight = page.waitForResponse(r => r.url().endsWith('/models/validate-vss'));
    await dialog.locator('input[type="file"]').setInputFiles({ name: 'invalid-vss.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) });
    expect((await preflight).status()).toBe(400);
    const message = 'Vehicle.Cabin is an empty branch. Add at least one signal to it, then upload the file again.';
    await expect(dialog.getByText(message, { exact: true })).toBeVisible();
    expect(uploads).toHaveLength(0);
    // Create stays blocked while the file is rejected, so no model silently falls back to the default VSS.
    const submit = dialog.locator('[data-id="form-create-model-btn-submit"]');
    await expect(submit).toBeDisabled();
    await dialog.locator('[data-id="form-create-model-use-vss-version"]').click();
    await expect(dialog.getByText(message, { exact: true })).toHaveCount(0);
    await expect(submit).toBeEnabled();

    // A blank-model export (empty root) is still importable.
    const blankPreflight = page.waitForResponse(r => r.url().endsWith('/models/validate-vss'));
    const stored = page.waitForResponse(r => r.url().includes('/file/upload') && r.request().method() === 'POST');
    await dialog.locator('input[type="file"]').setInputFiles({ name: 'blank-vss.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ Vehicle: { type: 'branch', children: {} } })) });
    expect((await blankPreflight).status()).toBe(204);
    expect((await stored).ok()).toBeTruthy();
    await expect(submit).toBeEnabled();
  } finally {
    if (originalHomeContent !== null) await setSiteConfigJson(page, 'CFG_HOME_CONTENT', originalHomeContent);
  }
});

test('built-in Play and rebuild reject invalid VSS before sending runtime commands', async ({ page }) => {
  test.skip(!process.env.RUNTIME_SERVER_URL, 'A disposable runtime server is required');
  await loginAsAdmin(page);
  const headers = { Authorization: `Bearer ${await getAuthToken(page)}` };
  const response = await page.request.post(`${API_URL}/v2/models`, { headers, data: { name: `E2E_VssRuntime_${Date.now()}`, main_api: 'Vehicle', cvi: JSON.stringify(valid), visibility: 'private' } });
  expect(response.ok()).toBeTruthy();
  const model = await response.json();
  const modelId = String(model.id || model._id || model);
  try {
    const created = await page.request.post(`${API_URL}/v2/prototypes`, { headers, data: { name: 'VSS guard', model_id: modelId, language: 'python', code: 'print("VSS guard")' } });
    expect(created.ok()).toBeTruthy();
    const prototype = await created.json();
    const commands: string[] = [];
    page.on('websocket', socket => socket.on('framesent', ({ payload }) => {
      const frame = payload.toString();
      if (/"(?:generate_vehicle_model|generate-vehicle-model|run_python_app)"/.test(frame)) commands.push(frame);
    }));
    await page.route(`**/models/${modelId}/api`, route => route.fulfill({ json: invalid }));
    await page.goto(`/model/${modelId}/library/prototype/${prototype.id || prototype._id}/dashboard`);
    const panel = page.locator('[data-id="runtime-control-panel"]');
    await panel.locator('[data-id="btn-expand-runtime-control"]').click();
    const select = panel.getByRole('combobox', { name: 'deploy-select' });
    await expect(select.locator('option').filter({ hasText: '🟢' }).first()).toHaveCount(1);
    const play = panel.locator('[data-id="btn-run-prototype"]');
    await expect(play).toBeEnabled();
    await play.click();
    await expect(page.getByText('The vehicle model cannot be built: Vehicle.Cabin is an empty branch. Add at least one signal to it, then try again.', { exact: true }).first()).toBeVisible();
    await expect(play).toBeEnabled();
    await panel.getByText('Send Request', { exact: true }).click();
    const rejected = page.waitForResponse(r => r.url().endsWith('/models/validate-vss'));
    await page.getByText('Rebuild Vehicle Model base on current Vehicle API', { exact: true }).click();
    expect((await rejected).status()).toBe(400);
    await page.waitForTimeout(1500);
    expect(commands).toHaveLength(0);
  } finally {
    await deleteModelViaApi(page, modelId);
  }
});
