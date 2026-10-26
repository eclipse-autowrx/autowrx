// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect } from '@playwright/test';
import { API_URL, loginAsAdmin, getAuthToken, createTestModelViaApi, deleteModelViaApi, goToVehicleApiTab } from './helpers';

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

test('invalid VSS replacement shows its path and preserves the existing model', async ({ page }) => {
  await loginAsAdmin(page);
  const modelId = await createTestModelViaApi(page, `E2E_VssValidation_${Date.now()}`, 'private');
  const headers = { Authorization: `Bearer ${await getAuthToken(page)}` };
  try {
    const before = await (await page.request.get(`${API_URL}/v2/models/${modelId}/api?raw=true`, { headers })).json();
    await goToVehicleApiTab(page, modelId);
    await page.getByRole('link', { name: 'Replace Vehicle API', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[type="file"]').setInputFiles({ name: 'invalid-vss.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) });
    const response = page.waitForResponse(r => r.url().endsWith(`/models/${modelId}/replace-api`) && r.request().method() === 'POST');
    await dialog.getByRole('button', { name: 'Replace Vehicle API', exact: true }).click();
    expect((await response).status()).toBe(400);
    await expect(page.getByText(/Invalid VSS at Vehicle.Cabin/).first()).toBeVisible();
    const after = await (await page.request.get(`${API_URL}/v2/models/${modelId}/api?raw=true`, { headers })).json();
    expect(after).toEqual(before);
  } finally {
    await deleteModelViaApi(page, modelId);
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
    await expect(page.getByText('Invalid VSS at Vehicle.Cabin: branch must contain children.', { exact: true }).first()).toBeVisible();
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
