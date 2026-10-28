// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect, type Page } from '@playwright/test';
import {
  loginAsAdmin,
  createTestModelViaApi,
  createTestPrototypeViaApi,
  deleteModelViaApi,
  deletePrototypeViaApi,
  getSiteConfigJson,
  setSiteConfigJson,
  getNavBarActionsViaApi,
  setNavBarActionsViaApi,
  configureGlobalSearchNavAction,
  getHomeModelListSection,
  getHomePrototypeListSection,
  selectHomeModelCategory,
  selectHomePrototypeCategory,
  goToPrototypeOverview,
  goToPrototypeDashboard,
  confirmNameDialog,
  getAuthToken,
  API_URL,
  type NavBarActionConfig,
} from './helpers';

// 1440x900 keeps the hero banner mounted (it is hidden below 1024px width or
// 720px height) and shows the lg-only "Portfolio View" toggle.
test.use({ viewport: { width: 1440, height: 900 } });

test.describe.configure({ mode: 'serial' });

async function createFeedbackViaApi(
  page: Page,
  opts: {
    prototypeId: string;
    modelId: string;
    needAddress: number;
    relevance: number;
    easyToUse: number;
  },
): Promise<void> {
  const token = await getAuthToken(page);
  const res = await page.request.post(`${API_URL}/v2/feedbacks`, {
    data: {
      ref: opts.prototypeId,
      ref_type: 'prototype',
      model_id: opts.modelId,
      question: 'E2E portfolio seeding question',
      recommendation: 'E2E portfolio seeding recommendation',
      interviewee: { name: 'E2E_Portfolio_Seeder' },
      score: {
        need_address: opts.needAddress,
        relevance: opts.relevance,
        easy_to_use: opts.easyToUse,
      },
    },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to create feedback: ${res.status()} ${await res.text()}`);
  }
}

async function deletePrototypeFeedbacksViaApi(page: Page, prototypeId: string): Promise<void> {
  const token = await getAuthToken(page);
  const res = await page.request.get(`${API_URL}/v2/feedbacks`, {
    params: { ref_type: 'prototype', ref: prototypeId },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return;
  const data = await res.json();
  for (const feedback of data?.results || []) {
    await page.request
      .delete(`${API_URL}/v2/feedbacks/${feedback.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch(() => {});
  }
}

test.describe('Home / navigation regressions', () => {
  test.setTimeout(180000);

  let originalHomeContent: unknown = null;
  let originalNavBarActions: NavBarActionConfig[] = [];
  let originalPrivacyContent: unknown = null;
  let originalPrivacyUrl: unknown = null;
  let heroTitle = '';
  const createdModelIds: string[] = [];
  const createdPrototypeIds: string[] = [];

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);

    const stamp = Date.now();
    heroTitle = `E2E Home Hero ${stamp}`;
    originalHomeContent = await getSiteConfigJson(page, 'CFG_HOME_CONTENT');
    originalNavBarActions = await getNavBarActionsViaApi(page);
    originalPrivacyContent = await getSiteConfigJson(page, 'PRIVACY_POLICY_CONTENT');
    originalPrivacyUrl = await getSiteConfigJson(page, 'PRIVACY_POLICY_URL');

    await setSiteConfigJson(page, 'CFG_HOME_CONTENT', [
      {
        type: 'hero',
        title: heroTitle,
        description: 'E2E hero description for navigation regression',
        image: '/imgs/default_prototype_cover.jpg',
      },
      { type: 'model-list', title: 'Vehicle Models' },
      { type: 'prototype-list', title: 'All Prototypes' },
    ]);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    while (createdPrototypeIds.length > 0) {
      const prototypeId = createdPrototypeIds.pop();
      if (prototypeId) {
        await deletePrototypeFeedbacksViaApi(page, prototypeId).catch(() => {});
        await deletePrototypeViaApi(page, prototypeId).catch(() => {});
      }
    }
    while (createdModelIds.length > 0) {
      const modelId = createdModelIds.pop();
      if (modelId) {
        await deleteModelViaApi(page, modelId).catch(() => {});
      }
    }
    if (originalHomeContent !== null) {
      await setSiteConfigJson(page, 'CFG_HOME_CONTENT', originalHomeContent);
    }
    await setNavBarActionsViaApi(page, originalNavBarActions);
    if (originalPrivacyContent !== null) {
      await setSiteConfigJson(page, 'PRIVACY_POLICY_CONTENT', originalPrivacyContent);
    } else {
      await setSiteConfigJson(page, 'PRIVACY_POLICY_CONTENT', '').catch(() => {});
    }
    if (originalPrivacyUrl !== null && originalPrivacyUrl !== '') {
      await setSiteConfigJson(page, 'PRIVACY_POLICY_URL', originalPrivacyUrl);
    } else {
      await setSiteConfigJson(page, 'PRIVACY_POLICY_URL', '').catch(() => {});
    }
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test.afterEach(async ({ page }) => {
    // The global-search test overrides this; keep it stable for every test.
    await setNavBarActionsViaApi(page, originalNavBarActions).catch(() => {});
  });

  // #264
  test('#264 home hero banner survives client-side navigation and Load More Models reveals more models', async ({
    page,
  }) => {
    const stamp = Date.now();
    const modelNames = Array.from(
      { length: 7 },
      (_, i) => `E2E_HomeNav_Model_${i}_${stamp}`,
    );
    const modelIds: string[] = [];
    for (const name of modelNames) {
      modelIds.push(await createTestModelViaApi(page, name, 'public'));
    }
    createdModelIds.push(...modelIds);
    const { prototypeId } = await createTestPrototypeViaApi(page, {
      name: `E2E_HomeNav_Proto_${stamp}`,
      modelId: modelIds[0],
    });
    createdPrototypeIds.push(prototypeId);

    // Hero banner visible on first load.
    await page.goto('/');
    await expect(page.getByText(heroTitle)).toBeVisible({ timeout: 20000 });
    const heroImage = page.locator('.da-page-home img[alt="home-cover"]').first();
    await expect(heroImage).toBeVisible();

    // "Show more" control on the model list is "Load More Models": with 7 owned
    // models and 5 columns at 1440px, only the 5 newest render initially
    // (default sort is last-viewed, ties broken by id descending).
    await selectHomeModelCategory(page, 'My Models');
    const section = getHomeModelListSection(page);
    await expect(section.locator(`[aria-label="${modelNames[6]}"]`)).toBeVisible({
      timeout: 20000,
    });
    await expect(section.locator(`[aria-label="${modelNames[0]}"]`)).toHaveCount(0);
    const loadMore = section.getByRole('button', { name: /Load More Models/i });
    await expect(loadMore).toBeVisible();
    await loadMore.click();
    await expect(section.locator(`[aria-label="${modelNames[0]}"]`)).toBeVisible({
      timeout: 10000,
    });
    await expect(section.locator(`[aria-label="${modelNames[1]}"]`)).toBeVisible();

    // Client-side navigation: model card -> model detail.
    await section.locator(`[aria-label="${modelNames[0]}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/model/${modelIds[0]}/?$`));
    await expect(page.locator('[data-id="tab-model-library"]')).toBeVisible({
      timeout: 20000,
    });

    // -> Prototype Library.
    await page.locator('[data-id="tab-model-library"]').click();
    await expect(page).toHaveURL(new RegExp(`/model/${modelIds[0]}/library/list`));
    await expect(page.getByPlaceholder('Search prototypes')).toBeVisible({
      timeout: 20000,
    });

    // -> Vehicle API.
    await page.locator('[data-id="tab-model-api"]').click();
    await expect(page.locator('.da-page-vehicle-api')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-id="search-signal-input"]')).toBeVisible({
      timeout: 30000,
    });

    // -> back to Prototype Library -> prototype Overview.
    await page.locator('[data-id="tab-model-library"]').click();
    await expect(page).toHaveURL(new RegExp(`/model/${modelIds[0]}/library/list`));
    const protoCard = page
      .locator('[data-id^="prototype-item-"]')
      .filter({ hasText: `E2E_HomeNav_Proto_${stamp}` })
      .first();
    await expect(protoCard).toBeVisible({ timeout: 20000 });
    await protoCard.click();
    await expect(page).toHaveURL(
      new RegExp(`/model/${modelIds[0]}/library/prototype/${prototypeId}/view`),
      { timeout: 20000 },
    );

    // -> back to Home via the navbar logo (client-side), hero still there.
    await page.locator('img.da-primary-nav-logo').click();
    await expect(page).toHaveURL((url) => url.pathname === '/');
    await expect(page.locator('.da-page-home')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(heroTitle)).toBeVisible({ timeout: 20000 });
    await expect(
      page.locator('.da-page-home img[alt="home-cover"]').first(),
    ).toBeVisible();
  });

  // #345 #346
  test('#345 #346 prototype deleted from home context menu is gone after navigating back to Home', async ({
    page,
  }) => {
    const stamp = Date.now();
    const protoName = `E2E_HomeDel_Proto_${stamp}`;
    const modelId = await createTestModelViaApi(
      page,
      `E2E_HomeDel_Model_${stamp}`,
      'public',
    );
    createdModelIds.push(modelId);
    const { prototypeId } = await createTestPrototypeViaApi(page, {
      name: protoName,
      modelId,
    });
    createdPrototypeIds.push(prototypeId);

    await page.goto('/');
    await selectHomePrototypeCategory(page, 'My Prototypes');
    const section = getHomePrototypeListSection(page);
    const card = section
      .locator(`[data-id^="prototype-item-"]`)
      .filter({ hasText: protoName })
      .first();
    await expect(card).toBeVisible({ timeout: 20000 });

    // Home prototype cards offer an owner context menu with Delete Prototype.
    await card.click({ button: 'right', force: true });
    await page.getByRole('menuitem', { name: 'Delete Prototype' }).click();
    await confirmNameDialog(page, protoName);
    await expect(card).toHaveCount(0, { timeout: 20000 });

    // Leave Home client-side, then come back via the navbar logo.
    await section.getByRole('button', { name: /Add Prototype/i }).click();
    // "Add Prototype" opens a New Prototype dialog over a model page; close it.
    const newProtoDialog = page.getByRole('dialog', { name: 'New Prototype' });
    await expect(newProtoDialog).toBeVisible({ timeout: 15000 });
    await newProtoDialog.getByRole('button', { name: 'Close' }).click();
    await expect(newProtoDialog).toBeHidden();
    await page.locator('img.da-primary-nav-logo').click();
    await expect(page.locator('.da-page-home')).toBeVisible({ timeout: 20000 });
    await selectHomePrototypeCategory(page, 'My Prototypes');
    await expect(
      getHomePrototypeListSection(page)
        .locator(`[data-id^="prototype-item-"]`)
        .filter({ hasText: protoName }),
    ).toHaveCount(0, { timeout: 20000 });
  });

  // #281
  test('#281 global search dialog shows the search hint placeholder', async ({ page }) => {
    await configureGlobalSearchNavAction(page);
    const searchBtn = page
      .locator('.da-primary-nav-bar button.da-primary-nav-action')
      .first();
    await expect(searchBtn).toBeVisible({ timeout: 15000 });
    await searchBtn.click();

    const input = page.getByPlaceholder('Search Model or Prototype');
    await expect(input).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText('Type something and press enter to search'),
    ).toBeVisible();
  });

  // #239
  test('#239 prototype page breadcrumb shows Vehicle Models > model > Prototypes > prototype in order', async ({
    page,
  }) => {
    const stamp = Date.now();
    const modelName = `E2E_Crumb_Model_${stamp}`;
    const protoName = `E2E_Crumb_Proto_${stamp}`;
    const modelId = await createTestModelViaApi(page, modelName, 'public');
    createdModelIds.push(modelId);
    const { prototypeId } = await createTestPrototypeViaApi(page, {
      name: protoName,
      modelId,
    });
    createdPrototypeIds.push(prototypeId);

    await goToPrototypeOverview(page, modelId, prototypeId);

    const crumbs = page.locator('nav[aria-label="breadcrumb"] li a');
    await expect(crumbs.nth(0)).toBeVisible({ timeout: 15000 });
    const texts = (await crumbs.allTextContents()).map((t) => t.trim());
    expect(texts).toEqual(['Home', 'Vehicle Models', modelName, 'Prototypes', protoName]);
  });

  // #249
  test('#249 privacy policy page is reachable from the app and renders content', async ({ page }) => {
    const marker = `E2E Privacy Policy ${Date.now()}`;
    await setSiteConfigJson(page, 'PRIVACY_POLICY_CONTENT', `# ${marker}\n\nE2E privacy policy body.`);
    await setSiteConfigJson(page, 'PRIVACY_POLICY_URL', '/privacy-policy');

    await page.goto('/');
    const footerLink = page
      .locator('.da-root-layout-footer')
      .getByRole('link', { name: 'Privacy Policy' });
    await expect(footerLink).toBeVisible({ timeout: 20000 });

    const popupPromise = page.waitForEvent('popup');
    await footerLink.click();
    const popup = await popupPromise;
    await expect(
      popup.locator('nav[aria-label="breadcrumb"]').getByText('Privacy Policy'),
    ).toBeVisible({ timeout: 20000 });
    await expect(popup.getByRole('heading', { name: marker })).toBeVisible({
      timeout: 20000,
    });
    await popup.close();

    // Also reachable directly by URL, not a 404.
    await page.goto('/privacy-policy');
    await expect(
      page.locator('nav[aria-label="breadcrumb"]').getByText('Privacy Policy'),
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: marker })).toBeVisible({
      timeout: 20000,
    });
  });

  // #252
  test('#252 prototype library Portfolio View toggle renders the chart for seeded prototypes and returns to List View', async ({
    page,
  }) => {
    const stamp = Date.now();
    const modelId = await createTestModelViaApi(
      page,
      `E2E_Portfolio_Model_${stamp}`,
      'public',
    );
    createdModelIds.push(modelId);

    // Seed prototypes with feedback so the portfolio chart plots bubbles.
    // Feedback-only prototypes are the only reliably plotted ones: the
    // portfolio-field path computes r from portfolio.easy_to_use, which the
    // backend schema does not have, so r is NaN and those items are dropped.
    const positions = [
      { x: 2, y: 4 },
      { x: 3, y: 3 },
      { x: 4, y: 2 },
    ];
    for (let i = 0; i < positions.length; i++) {
      const { prototypeId } = await createTestPrototypeViaApi(page, {
        name: `E2E_Portfolio_Proto_${i}_${stamp}`,
        modelId,
      });
      createdPrototypeIds.push(prototypeId);
      await createFeedbackViaApi(page, {
        prototypeId,
        modelId,
        needAddress: positions[i].x,
        relevance: positions[i].y,
        easyToUse: 5,
      });
    }

    await page.goto(`/model/${modelId}/library/list`);
    await expect(page.getByPlaceholder('Search prototypes')).toBeVisible({
      timeout: 20000,
    });

    const portfolioBtn = page.getByRole('button', { name: /Portfolio View/i });
    await expect(portfolioBtn).toBeVisible({ timeout: 10000 });
    await portfolioBtn.click();
    await expect(page).toHaveURL(new RegExp(`/model/${modelId}/library/portfolio`));

    // The chart renders instead of the empty state for the seeded prototypes.
    await expect(page.getByText('Loading feedbacks...')).toBeHidden({
      timeout: 20000,
    });
    await expect(page.getByText('No feedback found.')).toHaveCount(0);
    const canvas = page.locator('.da-page-prototype-library canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Toggle back to List View: the list content returns.
    await page.getByRole('button', { name: /List View/i }).click();
    await expect(page).toHaveURL(new RegExp(`/model/${modelId}/library/list`));
    await expect(page.getByPlaceholder('Search prototypes')).toBeVisible({
      timeout: 20000,
    });
    await expect(
      page
        .locator('[data-id^="prototype-item-"]')
        .filter({ hasText: `E2E_Portfolio_Proto_0_${stamp}` })
        .first(),
    ).toBeVisible({ timeout: 20000 });

  });

  // #248
  test('#248 dashboard fullscreen keeps the site logo visible and loaded', async ({ page }) => {
    const stamp = Date.now();
    const modelId = await createTestModelViaApi(page, `E2E_Fullscreen_Model_${stamp}`, 'public');
    createdModelIds.push(modelId);
    const { prototypeId } = await createTestPrototypeViaApi(page, {
      name: `E2E_Fullscreen_Proto_${stamp}`,
      modelId,
    });
    createdPrototypeIds.push(prototypeId);

    const logoConfig = (await getSiteConfigJson<string>(page, 'SITE_LOGO_WIDE')) || '';
    const expectedLogo = logoConfig || '/imgs/logo-wide.png';

    await goToPrototypeDashboard(page, modelId, prototypeId);
    const fullscreenBtn = page.locator('[data-id="dashboard-fullscreen-button"]');
    await expect(fullscreenBtn).toBeVisible({ timeout: 20000 });

    const logo = page.locator('img.da-dashboard-fullscreen-logo');
    await expect(logo).toHaveCount(0);
    await fullscreenBtn.click();

    await expect(logo).toBeVisible({ timeout: 10000 });
    const src = await logo.getAttribute('src');
    expect(src, 'fullscreen logo must have a src').toBeTruthy();
    expect(new URL(src!, page.url()).pathname).toBe(
      new URL(expectedLogo, page.url()).pathname,
    );
    const naturalWidth = await logo.evaluate((img) => (img as HTMLImageElement).naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });

  // #231
  test('#231 model created without an image shows the same-origin default model image', async ({ page }) => {
    const stamp = Date.now();
    const modelName = `E2E_DefaultImg_Model_${stamp}`;
    const modelId = await createTestModelViaApi(page, modelName, 'public');
    createdModelIds.push(modelId);

    // The newest model is among the first cards of the default "All" tab.
    await page.goto('/');
    const section = getHomeModelListSection(page);
    const card = section.locator(`[aria-label="${modelName}"]`);
    await expect(card).toBeVisible({ timeout: 20000 });

    const img = card.locator('img').first();
    const src = await img.getAttribute('src');
    expect(src, 'card image must have a src').toBeTruthy();
    const origin = new URL(page.url()).origin;
    const resolved = new URL(src!, page.url());
    expect(resolved.origin, 'default model image must be same-origin').toBe(origin);
    expect(resolved.host).not.toContain('firebasestorage');
    const naturalWidth = await img.evaluate((el) => (el as HTMLImageElement).naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });
});
