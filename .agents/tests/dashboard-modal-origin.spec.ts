// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect, type Page, type Frame, type Route } from '@playwright/test';
import {
  loginAsAdmin,
  createTestModelViaApi,
  createTestPrototypeViaApi,
  deleteModelViaApi,
  deletePrototypeViaApi,
  goToPrototypeDashboard,
  setPrototypeDashboardConfigViaApi,
} from './helpers';

/**
 * Dashboard 'open-modal' messages must only be honoured when they come from a
 * registered widget iframe (matching window + origin), and the payload must be
 * sanitized. The stub widget lets the test post from inside a real widget frame.
 */

const WIDGET_PATH = '/e2e-modal-widget.html';
const WIDGET_GLOB = `**${WIDGET_PATH}*`;
const MEDIA_URL = 'https://e2e-media.example/a.png';

// Needs `options` so the grid assigns the iframe a src (non-builtin widget).
const widgetConfig = [
  {
    boxes: [1, 2, 6, 7],
    url: WIDGET_PATH,
    options: { e2eMarker: 'modal-origin' },
  },
];

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

async function stubRoutes(page: Page) {
  await page.route(WIDGET_GLOB, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      headers: { 'Cache-Control': 'no-store' },
      body: '<!doctype html><html><body><div id="marker">widget</div></body></html>',
    });
  });
  await page.route('https://e2e-media.example/**', async (route: Route) => {
    await route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1X1 });
  });
}

async function getWidgetFrame(page: Page): Promise<Frame> {
  await expect
    .poll(() => page.frames().some((f) => f.url().includes(WIDGET_PATH)), {
      timeout: 30000,
    })
    .toBe(true);
  const frame = page.frames().find((f) => f.url().includes(WIDGET_PATH));
  if (!frame) throw new Error('widget frame not found');
  await frame.waitForLoadState('domcontentloaded');
  return frame;
}

async function postFromWidget(frame: Frame, payload: unknown) {
  await frame.evaluate((p) => {
    parent.postMessage(JSON.stringify({ action: 'open-modal', payload: p }), '*');
  }, payload);
}

test.describe('Prototype Dashboard — open-modal origin check', () => {
  let modelId = '';
  let prototypeId = '';

  test.beforeAll(async ({ browser }) => {
    const setupPage = await browser.newPage();
    try {
      await loginAsAdmin(setupPage);
      const stamp = Date.now();
      modelId = await createTestModelViaApi(setupPage, `E2E_ModalOrigin_Model_${stamp}`, 'public');
      ({ prototypeId } = await createTestPrototypeViaApi(setupPage, {
        name: `E2E_ModalOrigin_${stamp}`,
        modelId,
      }));
      await setPrototypeDashboardConfigViaApi(setupPage, prototypeId, widgetConfig, {
        dashboard_template_id: null,
      });
    } finally {
      await setupPage.close();
    }
  });

  test.afterAll(async ({ browser }) => {
    const cleanupPage = await browser.newPage();
    try {
      await loginAsAdmin(cleanupPage);
      if (prototypeId) await deletePrototypeViaApi(cleanupPage, prototypeId);
      if (modelId) await deleteModelViaApi(cleanupPage, modelId);
    } finally {
      await cleanupPage.close();
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await stubRoutes(page);
    await goToPrototypeDashboard(page, modelId, prototypeId);
  });

  test('AC1: message from the top window is ignored; widget frame message opens the modal', async ({
    page,
  }) => {
    test.setTimeout(120000);
    const frame = await getWidgetFrame(page);

    await page.evaluate((url) => {
      window.postMessage(
        JSON.stringify({ action: 'open-modal', payload: { type: 'image', url } }),
        '*',
      );
    }, MEDIA_URL);
    await page.waitForTimeout(1500);
    await expect(page.locator('[role="dialog"] img')).toHaveCount(0);

    await postFromWidget(frame, { type: 'image', url: MEDIA_URL });
    await expect(page.locator(`[role="dialog"] img[src="${MEDIA_URL}"]`)).toBeVisible({
      timeout: 10000,
    });
  });

  test('AC2: disallowed media URLs from the widget do not open the modal', async ({ page }) => {
    test.setTimeout(120000);
    const frame = await getWidgetFrame(page);

    for (const url of [
      'javascript:alert(1)',
      'data:image/png;base64,AAAA',
      'http://evil.example/a.png',
    ]) {
      await postFromWidget(frame, { type: 'image', url });
      await page.waitForTimeout(1000);
      await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    }
  });

  test('AC3: iframe payload renders in a sandboxed srcdoc iframe', async ({ page }) => {
    test.setTimeout(120000);
    const frame = await getWidgetFrame(page);

    await postFromWidget(frame, { type: 'iframe', html: '<p>hi</p>' });

    const modalIframe = page.locator('[role="dialog"] iframe[srcdoc]');
    await expect(modalIframe).toBeVisible({ timeout: 10000 });
    const sandbox = await modalIframe.getAttribute('sandbox');
    expect(sandbox).not.toBeNull();
    expect(sandbox).not.toContain('allow-same-origin');
  });
});
