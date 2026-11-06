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
  createEditableReleasedModelViaApi,
  createTestPrototypeViaApi,
  getPrototypeViaApi,
  getTokenForUser,
  getPrototypeCard,
  openPrototypeContextMenu,
  CreatedTestUser,
  API_URL,
  TEST_USER,
} from './helpers';

// Roles: admin owns an editable model; `creator` adds a prototype to it;
// `stranger` is any other signed-in user.
test.describe.configure({ mode: 'serial' });

test.describe('Prototype Visibility', () => {
  test.setTimeout(90000);

  const timestamp = Date.now();
  const modelName = `E2E_ProtoVisibilityModel_${timestamp}`;
  const protoName = `E2E_ProtoVisibility_${timestamp}`;
  let modelId = '';
  let prototypeId = '';
  let creator: CreatedTestUser;
  let stranger: CreatedTestUser;

  const asCreator = () => ({ email: creator.email, password: TEST_USER.password });
  const asStranger = () => ({ email: stranger.email, password: TEST_USER.password });

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    modelId = await createEditableReleasedModelViaApi(page, modelName);
    creator = await createTestUserViaApi(page, {
      email: `e2e_protovis_creator_${timestamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E ProtoVis Creator ${timestamp}`,
    });
    stranger = await createTestUserViaApi(page, {
      email: `e2e_protovis_stranger_${timestamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E ProtoVis Stranger ${timestamp}`,
    });
    ({ prototypeId } = await createTestPrototypeViaApi(page, {
      name: protoName,
      modelId,
      auth: asCreator(),
    }));
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    if (modelId) await deleteModelViaApi(page, modelId).catch(() => {});
    for (const user of [creator, stranger]) {
      if (user) await deleteTestUserViaApi(page, user.id).catch(() => {});
    }
    await page.close();
  });

  async function openLibrary(page: Page) {
    await page.goto(`/model/${modelId}/library/list`);
    await page.waitForTimeout(2000);
  }

  async function getStatusAs(page: Page, auth: { email: string; password: string }) {
    const token = await getTokenForUser(page, auth.email, auth.password);
    const res = await page.request.get(`${API_URL}/v2/prototypes/${prototypeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.status();
  }

  async function changeVisibilityViaMenu(page: Page, target: 'public' | 'private') {
    await openPrototypeContextMenu(page, protoName);
    const item = page.getByRole('menuitem', { name: `Change visibility to ${target}` });
    await expect(item).toBeVisible({ timeout: 10000 });
    await item.click();
    await expect(page.getByText(`Prototype is now ${target}`).first()).toBeVisible({
      timeout: 10000,
    });
  }

  test('TC1: new prototype is private and hidden from other users', async ({ page }) => {
    await loginAs(page, creator.email, TEST_USER.password);
    const proto = await getPrototypeViaApi(page, prototypeId, asCreator());
    expect(proto.visibility).toBe('private');

    await openLibrary(page);
    const card = getPrototypeCard(page, protoName);
    await expect(card).toBeVisible({ timeout: 20000 });
    await expect(card.getByTestId('prototype-private-badge')).toBeVisible();
    await saveScreenshot(page, 'prototype-visibility-tc1-creator');

    await logout(page);
    await loginAs(page, stranger.email, TEST_USER.password);
    expect(await getStatusAs(page, asStranger())).toBe(403);
    await openLibrary(page);
    await expect(getPrototypeCard(page, protoName)).toHaveCount(0);
  });

  test('TC2: model owner (admin) sees the private prototype and can manage it', async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await openLibrary(page);
    await openPrototypeContextMenu(page, protoName);
    await expect(
      page.getByRole('menuitem', { name: 'Change visibility to public' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('TC3: creator makes it public; stranger can see and edit but not manage', async ({
    page,
  }) => {
    await loginAs(page, creator.email, TEST_USER.password);
    await openLibrary(page);
    await changeVisibilityViaMenu(page, 'public');
    await expect(
      getPrototypeCard(page, protoName).getByTestId('prototype-private-badge'),
    ).toHaveCount(0);
    expect((await getPrototypeViaApi(page, prototypeId, asCreator())).visibility).toBe('public');

    await logout(page);
    await loginAs(page, stranger.email, TEST_USER.password);
    expect(await getStatusAs(page, asStranger())).toBe(200);
    await openLibrary(page);
    await openPrototypeContextMenu(page, protoName);
    await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Change visibility/ })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Delete Prototype' })).toHaveCount(0);
    await saveScreenshot(page, 'prototype-visibility-tc3-stranger-menu');
    await page.keyboard.press('Escape');

    const token = await getTokenForUser(page, stranger.email, TEST_USER.password);
    const edit = await page.request.patch(`${API_URL}/v2/prototypes/${prototypeId}`, {
      data: { code: 'print("edited by stranger")' },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(edit.status()).toBe(200);
    const hide = await page.request.patch(`${API_URL}/v2/prototypes/${prototypeId}`, {
      data: { visibility: 'private' },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(hide.status()).toBe(403);
  });

  test('TC4: creator switches it back to private; stranger loses access', async ({ page }) => {
    await loginAs(page, creator.email, TEST_USER.password);
    await openLibrary(page);
    await changeVisibilityViaMenu(page, 'private');
    await expect(
      getPrototypeCard(page, protoName).getByTestId('prototype-private-badge'),
    ).toBeVisible();

    await logout(page);
    await loginAs(page, stranger.email, TEST_USER.password);
    expect(await getStatusAs(page, asStranger())).toBe(403);
    await openLibrary(page);
    await expect(getPrototypeCard(page, protoName)).toHaveCount(0);
  });
});
