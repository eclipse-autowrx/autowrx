// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect, type Page } from '@playwright/test';
import { join } from 'path';
import {
  loginAsAdmin,
  getAuthToken,
  API_URL,
  createTestModelViaApi,
  deleteModelViaApi,
  getSiteConfigJson,
  setSiteConfigJson,
  configureHomePrototypeListSection,
  getHomePrototypeListSection,
} from './helpers';

// Wide viewport so the `.container` max-width (1400px) regression guard at the
// bottom is meaningful (it only engages on viewports >= 1400px).
test.use({ viewport: { width: 1920, height: 1080 } });

const PICKED_COLOR = '#50E3C2';
const PICKED_COLOR_RGB = 'rgb(80, 227, 194)';
const OUTER_SAVE_COLOR = '#F5A623';
const OUTER_SAVE_COLOR_RGB = 'rgb(245, 166, 35)';
const CANCELLED_COLOR = '#9013FE';
const HOVER_MESSAGE = 'E2E hover';
const SHAPE_URL = 'https://e2e.example.com/signal';
const UPLOAD_IMAGE_PATH = join(
  process.cwd(),
  '..',
  'frontend',
  'public',
  'imgs',
  'default-model-image.png',
);

// The editor toolbar row inside ImageAreaStage (not the outer Save/Cancel pair).
function getEditorToolbar(page: Page) {
  return page.locator('div.bg-slate-200.p-2', { hasText: 'Upload Image' }).first();
}

// The 16:9 background container of the editor/preview stage.
function getStageContainer(page: Page) {
  return page.locator('div[style*="aspect-ratio"]').first();
}

async function getVehicleExtendedApi(
  page: Page,
  modelId: string,
): Promise<{ ok: boolean; skeleton: any }> {
  const token = await getAuthToken(page);
  const res = await page.request.get(
    `${API_URL}/v2/extendedApis/by-api-and-model?apiName=Vehicle&model=${modelId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok()) return { ok: false, skeleton: null };
  const data = await res.json();
  const skeleton =
    typeof data?.skeleton === 'string' && data.skeleton !== '{}'
      ? JSON.parse(data.skeleton)
      : null;
  return { ok: true, skeleton };
}

// DaApiArchitecture auto-creates the Vehicle skeleton (from the model home
// image) in a mount effect that races the initial fetch, so the first page
// load may render nothing. Poll until the skeleton exists, then reload.
async function waitForVehicleSkeleton(
  page: Page,
  modelId: string,
  timeoutMs = 30000,
) {
  const deadline = Date.now() + timeoutMs;
  let last: { ok: boolean; skeleton: any } = { ok: false, skeleton: null };
  while (Date.now() < deadline) {
    last = await getVehicleExtendedApi(page, modelId);
    if (last.ok && last.skeleton?.nodes?.length > 0) return last.skeleton;
    await page.waitForTimeout(500);
  }
  throw new Error(`Vehicle skeleton was not auto-created within ${timeoutMs}ms`);
}

test.describe('API Architecture diagram (Vehicle API)', () => {
  let modelId: string | null = null;
  const extraModelIds: string[] = [];
  let originalHomeContent: unknown = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    originalHomeContent = await getSiteConfigJson(page, 'CFG_HOME_CONTENT');
    await configureHomePrototypeListSection(page);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    if (modelId) {
      await deleteModelViaApi(page, modelId).catch(() => {});
      modelId = null;
    }
    for (const id of extraModelIds.splice(0)) {
      await deleteModelViaApi(page, id).catch(() => {});
    }
    if (originalHomeContent !== null) {
      await setSiteConfigJson(page, 'CFG_HOME_CONTENT', originalHomeContent);
    }
    await page.close();
  });

  test('edit and persist architecture skeleton (shape, color, image)', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await loginAsAdmin(page);

    // --- Setup: fresh model, then let the page auto-create the Vehicle skeleton.
    modelId = await createTestModelViaApi(page, `E2E_ApiArchitecture_${Date.now()}`, 'public');
    await page.goto(`/model/${modelId}/api/covesa/Vehicle`);
    await waitForVehicleSkeleton(page, modelId);
    await page.reload();
    const container = getStageContainer(page);
    await expect(container).toBeVisible({ timeout: 30000 });

    // --- Enter edit mode.
    const editBtn = page.getByRole('button', { name: 'Edit', exact: true }).first();
    await expect(editBtn).toBeVisible({ timeout: 15000 });
    await editBtn.click();

    const toolbar = getEditorToolbar(page);
    await expect(toolbar).toBeVisible({ timeout: 15000 });

    // --- Upload a background image first. (Uploading later would wipe the
    // unsaved shapes/color: the upload triggers a skeleton refetch that
    // remounts the editor and resets its local state.)
    await toolbar.locator('input[type="file"][accept="image/*"]').setInputFiles(UPLOAD_IMAGE_PATH);
    const bgImg = container.locator('img').first();
    await expect(bgImg).toHaveAttribute('src', /^\/d\//, { timeout: 30000 });

    // --- Draw a rectangle on the konva canvas.
    const rectTool = toolbar.locator('button').first();
    await expect(rectTool).toBeEnabled({ timeout: 15000 });
    await rectTool.click();
    await expect(rectTool).toHaveClass(/bg-\[#b8d6ff\]/);

    const canvas = page.locator('.konvajs-content canvas').first();
    await expect(canvas).toBeVisible();
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, { steps: 5 });
    await page.mouse.up();

    // --- Settings panel: hover message + URL, then close with Escape.
    const hoverInput = page.locator('textarea[placeholder="Hover message ..."]');
    const urlInput = page.locator('textarea[placeholder="Enter URL."]');
    await expect(hoverInput).toBeVisible({ timeout: 10000 });
    await hoverInput.fill(HOVER_MESSAGE);
    // Delete inside the URL field edits the text only; it must not open the
    // "remove this shape?" dialog.
    await urlInput.fill(`${SHAPE_URL}x`);
    await urlInput.press('ArrowLeft');
    await urlInput.press('Delete');
    await expect(urlInput).toHaveValue(SHAPE_URL);
    await expect(page.getByText('Do you want to remove this shape?')).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(hoverInput).toBeHidden({ timeout: 10000 });

    // --- Background color: open the paint-bucket control, pick a preset swatch.
    await toolbar.locator('div.relative.cursor-pointer').click();
    const picker = page.locator('.sketch-picker');
    await expect(picker).toBeVisible({ timeout: 10000 });
    await picker.locator(`div[title="${PICKED_COLOR}"]`).click();
    await expect(container).toHaveCSS('background-color', PICKED_COLOR_RGB);
    await page.keyboard.press('Escape');
    await expect(picker).toBeHidden({ timeout: 10000 });

    // --- Save via the editor toolbar (not the outer Save/Cancel pair).
    const toolbarSave = toolbar.getByRole('button', { name: 'Save' });
    await expect(toolbarSave).toBeEnabled();
    await toolbarSave.click();
    await expect(page.getByRole('button', { name: 'Edit', exact: true }).first()).toBeVisible({
      timeout: 30000,
    });

    // --- Assert persistence via API.
    const persisted = await getVehicleExtendedApi(page, modelId);
    expect(persisted.ok).toBe(true);
    const node = persisted.skeleton.nodes[0];
    expect(node.bgImage).toMatch(/^\/d\//);
    expect(node.bgColor).toBe(PICKED_COLOR);
    const rect = (node.shapes || []).find((s: { type?: string }) => s.type === 'Rectangle');
    expect(rect, 'saved skeleton should contain the drawn Rectangle').toBeTruthy();
    expect(rect.hoverMessage).toBe(HOVER_MESSAGE);
    expect(rect.url).toBe(SHAPE_URL);
    expect(String(rect.id)).toBeTruthy();

    // --- Reload: preview reflects the saved skeleton.
    await page.reload();
    await expect(bgImg).toHaveAttribute('src', node.bgImage, { timeout: 30000 });
    await expect(container).toHaveCSS('background-color', PICKED_COLOR_RGB);

    const hotspot = container.locator('div[role="button"]');
    await expect(hotspot).toHaveCount(1);
    await hotspot.hover();
    await expect(page.getByText(HOVER_MESSAGE)).toBeVisible({ timeout: 10000 });

    // --- Regression guard: client-side nav home must not leak the old lib's
    // injected `.container{width:100%}` style (container would exceed 1400px).
    await page.locator('img.da-primary-nav-logo').click();
    await page.waitForURL((url) => url.pathname === '/');
    const section = getHomePrototypeListSection(page);
    await expect(section).toBeVisible({ timeout: 20000 });
    const hasLegacyStyle = await page.evaluate(() =>
      Array.from(document.querySelectorAll('style')).some((s) =>
        (s.textContent || '').startsWith('.container{width:100%}'),
      ),
    );
    expect(hasLegacyStyle).toBe(false);
    const containerWidth = await section.evaluate((el) => el.getBoundingClientRect().width);
    expect(containerWidth).toBeLessThanOrEqual(1400);
  });
  // Issue #54: the outer Save (next to Cancel) ignored edits unless the
  // toolbar Save had been clicked first, so a color change was lost.
  test('outer Save persists a background color change; Cancel discards it', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await loginAsAdmin(page);

    const id = await createTestModelViaApi(page, `E2E_ApiArchOuterSave_${Date.now()}`, 'public');
    extraModelIds.push(id);
    await page.goto(`/model/${id}/api/covesa/Vehicle`);
    await waitForVehicleSkeleton(page, id);
    await page.reload();
    const container = getStageContainer(page);
    await expect(container).toBeVisible({ timeout: 30000 });

    const editBtn = page.getByRole('button', { name: 'Edit', exact: true }).first();
    const toolbar = getEditorToolbar(page);
    // The outer pair renders before the editor toolbar in DOM order.
    const outerSave = page.getByRole('button', { name: 'Save', exact: true }).first();
    const outerCancel = page.getByRole('button', { name: 'Cancel', exact: true });

    const pickColor = async (hex: string) => {
      await toolbar.locator('div.relative.cursor-pointer').click();
      const picker = page.locator('.sketch-picker');
      await expect(picker).toBeVisible({ timeout: 10000 });
      await picker.locator(`div[title="${hex}"]`).click();
      await page.keyboard.press('Escape');
      await expect(picker).toBeHidden({ timeout: 10000 });
    };

    // --- Outer Save: disabled until an edit, then persists the color.
    await editBtn.click();
    await expect(toolbar).toBeVisible({ timeout: 15000 });
    await expect(toolbar.locator('button').first()).toBeEnabled({ timeout: 15000 });
    await expect(outerSave).toBeDisabled();
    await pickColor(OUTER_SAVE_COLOR);
    await expect(container).toHaveCSS('background-color', OUTER_SAVE_COLOR_RGB);
    await expect(outerSave).toBeEnabled();
    await outerSave.click();
    await expect(editBtn).toBeVisible({ timeout: 30000 });

    const saved = await getVehicleExtendedApi(page, id);
    expect(saved.skeleton.nodes[0].bgColor).toBe(OUTER_SAVE_COLOR);

    // --- Cancel: a picked color is not saved.
    await editBtn.click();
    await expect(toolbar).toBeVisible({ timeout: 15000 });
    await expect(toolbar.locator('button').first()).toBeEnabled({ timeout: 15000 });
    await pickColor(CANCELLED_COLOR);
    await outerCancel.click();
    await expect(editBtn).toBeVisible({ timeout: 15000 });

    const afterCancel = await getVehicleExtendedApi(page, id);
    expect(afterCancel.skeleton.nodes[0].bgColor).toBe(OUTER_SAVE_COLOR);
    await page.reload();
    await expect(getStageContainer(page)).toHaveCSS('background-color', OUTER_SAVE_COLOR_RGB, {
      timeout: 30000,
    });
  });
});
