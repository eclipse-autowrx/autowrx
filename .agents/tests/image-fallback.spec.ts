import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestModelViaApi,
  createTestPrototype,
  deleteModelViaApi,
  configureHomeModelListSection,
  gotoHomeModelList,
  selectHomeModelCategory,
  getHomeModelListSection,
  getPrototypeCard,
  searchPrototypeLibrary,
  setModelImageViaApi,
  setPrototypeImageViaApi,
  routeBrokenImageUrls,
  expectCardImageFallback,
  DEFAULT_MODEL_IMAGE,
  DEFAULT_PROTOTYPE_IMAGE,
} from './helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Image Fallback', () => {
  const createdModelIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await configureHomeModelListSection(page);
  });

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

  test('model card falls back to default image on load failure', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `E2E_ModelImgFallback_${timestamp}`;
    const brokenUrl = `${process.env.BASE_URL}/e2e-broken-image-${timestamp}.png`;

    const modelId = await createTestModelViaApi(page, modelName, 'private');
    createdModelIds.push(modelId);
    await setModelImageViaApi(page, modelId, brokenUrl);

    const unroute = await routeBrokenImageUrls(page);
    try {
      await gotoHomeModelList(page);
      await selectHomeModelCategory(page, 'My Models');

      const section = getHomeModelListSection(page);
      const card = section.locator(`[aria-label="${modelName}"]`);
      await expect(card).toBeVisible({ timeout: 20000 });
      await expectCardImageFallback(card, DEFAULT_MODEL_IMAGE);

      await saveScreenshot(page, 'image-fallback-model-card');
    } finally {
      await unroute();
    }
  });

  test('prototype card falls back to default image on load failure', async ({ page }) => {
    const timestamp = Date.now();
    const protoName = `E2E_ProtoImgFallback_${timestamp}`;
    const brokenUrl = `${process.env.BASE_URL}/e2e-broken-image-${timestamp}.png`;

    const modelId = await createTestModelViaApi(page, `E2E_ModelForProtoImg_${timestamp}`, 'private');
    createdModelIds.push(modelId);
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);
    await setPrototypeImageViaApi(page, prototypeId, brokenUrl);

    const unroute = await routeBrokenImageUrls(page);
    try {
      await page.goto(`/model/${modelId}/library/list`);
      await page.waitForTimeout(3000);
      await searchPrototypeLibrary(page, protoName);

      const card = getPrototypeCard(page, protoName);
      await expect(card).toBeVisible({ timeout: 20000 });
      await expectCardImageFallback(card, DEFAULT_PROTOTYPE_IMAGE);

      await saveScreenshot(page, 'image-fallback-prototype-card');
    } finally {
      await unroute();
    }
  });
});
