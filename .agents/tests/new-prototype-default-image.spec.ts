// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { randomUUID } from 'crypto';
import { test, expect, Page } from '@playwright/test';
import {
  loginAsAdmin,
  getSiteConfigValue,
  updateSiteConfigValue,
  getPublicConfigRow,
  createTestModelViaApi,
  deleteModelViaApi,
  deletePrototypeViaApi,
  getPrototypeViaApi,
  getPrototypeIdFromUrl,
} from './helpers';

const IMAGE_KEY = 'DEFAULT_PROTOTYPE_IMAGE';
const ROUTE_KEY = 'ENABLE_NEW_PROTOTYPE_PAGE';

test.describe('New prototype default image', () => {
  const originalConfigs = new Map<string, string>();
  const modelIds = new Set<string>();
  const prototypeIds = new Set<string>();

  async function setConfig(page: Page, key: string, value: string) {
    if (!originalConfigs.has(key)) {
      originalConfigs.set(key, await getSiteConfigValue(page, key));
    }
    await updateSiteConfigValue(page, key, value);
  }

  async function cleanup(page: Page) {
    // Restore configs first, even after a timeout before prototype creation.
    // Retain failed entries so afterAll can retry them with a fresh page.
    const errors: unknown[] = [];
    for (const [key, value] of originalConfigs) {
      try {
        await updateSiteConfigValue(page, key, value);
        originalConfigs.delete(key);
      } catch (error) {
        errors.push(error);
      }
    }
    for (const id of prototypeIds) {
      try {
        await deletePrototypeViaApi(page, id);
        prototypeIds.delete(id);
      } catch (error) {
        errors.push(error);
      }
    }
    for (const id of modelIds) {
      try {
        await deleteModelViaApi(page, id);
        modelIds.delete(id);
      } catch (error) {
        errors.push(error);
      }
    }
    expect(errors, 'Site configs and E2E entities must be restored').toEqual([]);
  }

  test.afterEach(async ({ browser }) => {
    // API helpers authenticate independently; no UI login or usable test page
    // is needed after a failure. Always attempt every cleanup operation.
    const page = await browser.newPage();
    try {
      await cleanup(page);
    } finally {
      await page.close();
    }
  });

  test.afterAll(async ({ browser }) => {
    if (!originalConfigs.size && !modelIds.size && !prototypeIds.size) return;
    const page = await browser.newPage();
    try {
      await cleanup(page);
    } finally {
      await page.close();
    }
  });

  async function createPrototypeThroughForm(page: Page, modelId: string, name: string) {
    await expect(page).toHaveURL(`/new-prototype?model_id=${modelId}`);
    const nameInput = page.locator('[data-id="prototype-name-input"]');
    await expect(nameInput).toBeEnabled({ timeout: 20000 });
    await nameInput.fill(name);

    // Track the POST result before navigation, so cleanup knows the id even
    // if a later step in NewPrototypeLayout fails.
    const [response] = await Promise.all([
      page.waitForResponse((response) =>
        new URL(response.url()).pathname === '/v2/prototypes' &&
        response.request().method() === 'POST',
      ),
      page.getByRole('button', { name: 'Confirm', exact: true }).click(),
    ]);
    expect(response.ok(), await response.text()).toBe(true);
    const created = await response.json();
    const prototypeId = String(created.id || created._id);
    expect(prototypeId).not.toBe('undefined');
    prototypeIds.add(prototypeId);
    await expect(page).toHaveURL(
      new RegExp(`/model/${modelId}/library/prototype/${prototypeId}(?:/|$)`),
      { timeout: 30000 },
    );
    expect(getPrototypeIdFromUrl(page.url())).toBe(prototypeId);
    const prototype = await getPrototypeViaApi(page, prototypeId);
    expect(prototype.name).toBe(name);
    return prototype;
  }

  test('new-prototype UI saves the configured default image_file', async ({ page }) => {
    const stamp = `${Date.now()}_${randomUUID()}`;
    const image = `/imgs/e2e-default-proto-${stamp}.png`;
    // Set before the app loads: this isolates FormNewPrototype from cache
    // invalidation and cannot pass on the hardcoded built-in cover image.
    await setConfig(page, IMAGE_KEY, image);
    const modelId = await createTestModelViaApi(page, `E2E_DefaultImage_Model_${stamp}`, 'private');
    modelIds.add(modelId);
    await loginAsAdmin(page);
    await page.goto(`/new-prototype?model_id=${modelId}`);

    const prototype = await createPrototypeThroughForm(page, modelId, `E2E_DefaultImage_Proto_${stamp}`);
    expect(prototype.image_file).toBe(image);
  });

  test('Site Config UI save invalidates cached default image without a reload', async ({ page }) => {
    const stamp = `${Date.now()}_${randomUUID()}`;
    const cachedImage = `/imgs/e2e-default-proto-cached-${stamp}.png`;
    const newImage = `/imgs/e2e-default-proto-updated-${stamp}.png`;
    await setConfig(page, IMAGE_KEY, cachedImage);
    await setConfig(page, ROUTE_KEY, 'true');
    const modelId = await createTestModelViaApi(page, `E2E_ImageCache_Model_${stamp}`, 'private');
    modelIds.add(modelId);
    await loginAsAdmin(page);

    const [publicResponse] = await Promise.all([
      page.waitForResponse((response) => {
        const url = new URL(response.url());
        return url.pathname === '/v2/site-config/public' && url.searchParams.get('scope') === 'site';
      }),
      page.goto(`/model/${modelId}/library/list`),
    ]);
    expect(await publicResponse.json()).toMatchObject({ [IMAGE_KEY]: cachedImage });
    await expect(page.locator('[data-id="btn-create-new-prototype"]')).toBeVisible();

    // A Document marker detects reloads that would erase the five-minute
    // module cache and make this regression test pass falsely.
    await page.evaluate((marker) => { document.documentElement.dataset.e2eDocument = marker; }, stamp);
    await page.getByRole('button', { name: 'Admin Tools', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Site Config', exact: true }).click();
    await page.getByRole('button', { name: 'Model & Prototype', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Model & Prototype Configuration', exact: true })).toBeVisible();

    // The image_url editor uses a textarea; the shared public-config editor
    // supports plain inputs. Reuse its ConfigList row locator instead.
    const row = getPublicConfigRow(page, IMAGE_KEY);
    await row.getByText(cachedImage, { exact: true }).click();
    await row.getByRole('textbox').fill(newImage);
    await row.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Configuration updated', { exact: true })).toBeVisible();
    expect(await getSiteConfigValue(page, IMAGE_KEY)).toBe(newImage);

    // React Router links and history preserve the public-config cache. Avoid
    // page.goto here: reloading would hide a missing ConfigList.clearCache().
    await page.goBack();
    await expect(page).toHaveURL(`/model/${modelId}/library/list`);
    await page.locator('[data-id="btn-create-new-prototype"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-e2e-document', stamp);
    const prototype = await createPrototypeThroughForm(page, modelId, `E2E_ImageCache_Proto_${stamp}`);
    await expect(page.locator('html')).toHaveAttribute('data-e2e-document', stamp);
    expect(prototype.image_file).toBe(newImage);
  });
});
