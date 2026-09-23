// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestModelViaApi,
  createTestPrototypeViaApi,
  updatePrototypeViaApi,
  getSiteConfigJson,
  setSiteConfigJson,
} from './helpers';

const CONFIG_KEY = 'ALLOW_ADDING_FILES';

const README_CONTENT = '# E2E Doc\n\nThis is **bold** markdown, not raw source.';

function multiFileProject() {
  return JSON.stringify([
    { type: 'file', name: 'app_logic.py', content: 'speed = Vehicle.Speed\n' },
    { type: 'file', name: 'README.md', content: README_CONTENT },
  ]);
}

async function createMultiFilePrototype(page: import('@playwright/test').Page) {
  const timestamp = Date.now();
  const modelId = await createTestModelViaApi(page, `E2E_Model_${timestamp}`, 'public');
  const { prototypeId } = await createTestPrototypeViaApi(page, {
    name: `E2E_Proto_${timestamp}`,
    modelId,
  });
  await updatePrototypeViaApi(page, prototypeId, { code: multiFileProject() });
  return { modelId, prototypeId };
}

test.describe('Project Editor - ALLOW_ADDING_FILES config', () => {
  let baseline: boolean | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    baseline = await getSiteConfigJson<boolean>(page, CONFIG_KEY);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    if (baseline === null) return;
    const page = await browser.newPage();
    await loginAsAdmin(page);
    await setSiteConfigJson(page, CONFIG_KEY, baseline);
    await page.close();
  });

  test('file tree is read-only and toolbar mutation buttons are hidden when false', async ({ page }) => {
    test.setTimeout(90000);
    await loginAsAdmin(page);
    await setSiteConfigJson(page, CONFIG_KEY, false);

    const { modelId, prototypeId } = await createMultiFilePrototype(page);
    await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/code`);
    await page.waitForTimeout(3000);

    await expect(page.getByTitle('New File')).toHaveCount(0);
    await expect(page.getByTitle('New Folder')).toHaveCount(0);
    await expect(page.getByTitle('Download Project as ZIP')).toHaveCount(0);
    await expect(page.getByTitle('Import Project from ZIP')).toHaveCount(0);

    // Per-file kebab (context) menu button is also gated off entirely.
    const readmeRow = page.getByTestId('file-tree-item-README.md');
    await expect(readmeRow).toBeVisible({ timeout: 10000 });
    await expect(readmeRow.locator('button')).toHaveCount(0);

    await saveScreenshot(page, 'allow-adding-files-false-readonly');
  });

  test('toolbar mutation buttons are visible when true', async ({ page }) => {
    test.setTimeout(90000);
    await loginAsAdmin(page);
    await setSiteConfigJson(page, CONFIG_KEY, true);

    const { modelId, prototypeId } = await createMultiFilePrototype(page);
    await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/code`);
    await page.waitForTimeout(3000);

    await expect(page.getByTitle('New File')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTitle('New Folder')).toBeVisible();
    await expect(page.getByTitle('Download Project as ZIP')).toBeVisible();
    await expect(page.getByTitle('Import Project from ZIP')).toBeVisible();

    await saveScreenshot(page, 'allow-adding-files-true-editable');
  });

  test('opens app_logic.py automatically on first load', async ({ page }) => {
    test.setTimeout(90000);
    await loginAsAdmin(page);

    const { modelId, prototypeId } = await createMultiFilePrototype(page);
    await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/code`);
    await page.waitForTimeout(3000);

    const defaultTab = page.getByTestId('editor-tab-app_logic.py');
    await expect(defaultTab).toBeVisible({ timeout: 10000 });
    await expect(defaultTab).toHaveAttribute('data-active', 'true');

    await saveScreenshot(page, 'allow-adding-files-default-file-open');
  });

  test('renders .md files as Markdown instead of raw source', async ({ page }) => {
    test.setTimeout(90000);
    await loginAsAdmin(page);

    const { modelId, prototypeId } = await createMultiFilePrototype(page);
    await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/code`);
    await page.waitForTimeout(3000);

    await page.getByTestId('file-tree-item-README.md').click();
    await page.waitForTimeout(1000);

    const viewer = page.getByTestId('markdown-viewer');
    await expect(viewer).toBeVisible({ timeout: 10000 });
    await expect(viewer.locator('h1')).toHaveText('E2E Doc');
    await expect(viewer.locator('strong')).toHaveText('bold');
    // The raw markdown syntax itself must not be shown verbatim.
    await expect(viewer).not.toContainText('**bold**');

    await saveScreenshot(page, 'allow-adding-files-markdown-render');
  });
});
