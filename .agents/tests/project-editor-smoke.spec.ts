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
  deleteModelViaApi,
} from './helpers';

const PY_CONTENT = 'speed = Vehicle.Speed\nprint("e2e smoke")\n';
const HELPER_CONTENT = 'def helper():\n    return 42\n';
const README_CONTENT = '# E2E Smoke\n\nProject editor **smoke** check.';

// The editor renders the tree only from a root-folder-wrapped project array.
function project() {
  return JSON.stringify([
    {
      type: 'folder',
      name: 'root',
      items: [
        { type: 'file', name: 'app_logic.py', content: PY_CONTENT },
        { type: 'file', name: 'README.md', content: README_CONTENT },
        {
          type: 'folder',
          name: 'utils',
          items: [{ type: 'file', name: 'helper.py', content: HELPER_CONTENT }],
        },
      ],
    },
  ]);
}

test.describe('Project Editor / Code tab smoke', () => {
  const createdModelIds: string[] = [];

  test.afterEach(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    while (createdModelIds.length > 0) {
      const modelId = createdModelIds.pop();
      if (modelId) {
        await deleteModelViaApi(page, modelId).catch(() => {});
      }
    }
    await page.close();
  });

  async function createProjectPrototype(page: import('@playwright/test').Page) {
    const timestamp = Date.now();
    const modelId = await createTestModelViaApi(
      page,
      `E2E_EditorSmokeModel_${timestamp}`,
      'public',
    );
    createdModelIds.push(modelId);
    const { prototypeId } = await createTestPrototypeViaApi(page, {
      name: `E2E_EditorSmokeProto_${timestamp}`,
      modelId,
    });
    await updatePrototypeViaApi(page, prototypeId, { code: project() });
    return { modelId, prototypeId };
  }

  test('code tab loads project editor with tree, tabs, auto-open and markdown', async ({
    page,
  }) => {
    await loginAsAdmin(page);
    const { modelId, prototypeId } = await createProjectPrototype(page);
    await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/code`);

    // Tree renders root files and a collapsed nested folder
    await expect(page.getByTestId('file-tree-item-app_logic.py')).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByTestId('file-tree-item-README.md')).toBeVisible();
    const utilsFolder = page.locator('[data-folder-path="utils"]');
    await expect(utilsFolder).toBeVisible();

    // Expanding the folder reveals its file
    await utilsFolder.click();
    await expect(page.getByTestId('file-tree-item-utils/helper.py')).toBeVisible({
      timeout: 10000,
    });

    // app_logic.py is auto-opened as the active tab with seeded content
    const defaultTab = page.getByTestId('editor-tab-app_logic.py');
    await expect(defaultTab).toBeVisible({ timeout: 10000 });
    await expect(defaultTab).toHaveAttribute('data-active', 'true');
    await expect(page.locator('.monaco-editor')).toContainText(
      'speed = Vehicle.Speed',
      { timeout: 10000 },
    );

    // Opening a nested file switches the active tab and shows its content
    await page.getByTestId('file-tree-item-utils/helper.py').click();
    const helperTab = page.getByTestId('editor-tab-utils/helper.py');
    await expect(helperTab).toBeVisible({ timeout: 10000 });
    await expect(helperTab).toHaveAttribute('data-active', 'true');
    await expect(page.locator('.monaco-editor')).toContainText('return 42');

    // Markdown files render as markdown, not source
    await page.getByTestId('file-tree-item-README.md').click();
    const viewer = page.getByTestId('markdown-viewer');
    await expect(viewer).toBeVisible({ timeout: 10000 });
    await expect(viewer.locator('h1')).toHaveText('E2E Smoke');
    await expect(viewer.locator('strong')).toHaveText('smoke');

    await saveScreenshot(page, 'project-editor-smoke-load');
  });

  test('editing a file and saving persists the change after reload', async ({
    page,
  }) => {
    await loginAsAdmin(page);
    const { modelId, prototypeId } = await createProjectPrototype(page);
    await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/code`);

    await expect(page.getByTestId('editor-tab-app_logic.py')).toBeVisible({
      timeout: 20000,
    });
    await expect(page.locator('.monaco-editor')).toContainText(
      'speed = Vehicle.Speed',
      { timeout: 10000 },
    );

    const saveButton = page.locator('button[title="Save (Ctrl+S)"]');
    await expect(saveButton).toBeDisabled();

    // Type a marker line at the end of the file
    await page.locator('.monaco-editor .view-lines').click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('\n# e2e-smoke-edit-marker');

    await expect(saveButton).toBeEnabled({ timeout: 10000 });
    await saveButton.click();
    await expect(saveButton).toBeDisabled({ timeout: 15000 });

    // The edit must survive a full reload (round-trip through the backend)
    await page.reload();
    await expect(page.getByTestId('editor-tab-app_logic.py')).toBeVisible({
      timeout: 20000,
    });
    await expect(page.locator('.monaco-editor')).toContainText(
      'e2e-smoke-edit-marker',
      { timeout: 15000 },
    );

    await saveScreenshot(page, 'project-editor-smoke-persist');
  });

  test('plain (non-JSON) code opens the single-file code editor', async ({
    page,
  }) => {
    await loginAsAdmin(page);
    const timestamp = Date.now();
    const modelId = await createTestModelViaApi(
      page,
      `E2E_PlainCodeModel_${timestamp}`,
      'public',
    );
    createdModelIds.push(modelId);
    const { prototypeId } = await createTestPrototypeViaApi(page, {
      name: `E2E_PlainCodeProto_${timestamp}`,
      modelId,
    });
    await updatePrototypeViaApi(page, prototypeId, {
      code: 'speed = Vehicle.Speed\n# plain code prototype\n',
    });

    await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/code`);
    await expect(page.locator('.monaco-editor')).toContainText(
      'plain code prototype',
      { timeout: 20000 },
    );
    await expect(page.getByTestId('file-tree-item-app_logic.py')).toHaveCount(0);

    await saveScreenshot(page, 'code-tab-plain-editor');
  });
});
