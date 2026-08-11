import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestModelViaApi,
  createTestPrototype,
  setPrototypeStateViaApi,
  boostPrototypePopularity,
  expectPrototypeInPopular,
  configureHomePopularSection,
  waitForPrototypeInPopularApi,
  getSiteConfigJson,
  setSiteConfigJson,
} from './helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Home Popular Prototypes', () => {
  let originalHomeContent: unknown = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    originalHomeContent = await getSiteConfigJson(page, 'CFG_HOME_CONTENT');
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    if (originalHomeContent !== null) {
      await setSiteConfigJson(page, 'CFG_HOME_CONTENT', originalHomeContent);
    }
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await configureHomePopularSection(page);
  });

  test('popular prototype appears when model is public and state is Released', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `HomePublic_${timestamp}`;
    const protoName = `HomePopular_${timestamp}`;

    const modelId = await createTestModelViaApi(page, modelName, 'public');
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);
    await setPrototypeStateViaApi(page, prototypeId, 'Released');
    await boostPrototypePopularity(page, prototypeId);
    await waitForPrototypeInPopularApi(page, protoName);

    await expectPrototypeInPopular(page, protoName, true);
    await saveScreenshot(page, 'home-popular-visible');
  });

  test('popular prototype hidden when model is private', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `HomePrivate_${timestamp}`;
    const protoName = `HomePrivateProto_${timestamp}`;

    const modelId = await createTestModelViaApi(page, modelName, 'private');
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);
    await setPrototypeStateViaApi(page, prototypeId, 'Released');

    await expectPrototypeInPopular(page, protoName, false);
    await saveScreenshot(page, 'home-popular-private-hidden');
  });

  test('popular prototype hidden when state is Developing', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `HomePublicDev_${timestamp}`;
    const protoName = `HomeDeveloping_${timestamp}`;

    const modelId = await createTestModelViaApi(page, modelName, 'public');
    await createTestPrototype(page, protoName, modelId);

    await expectPrototypeInPopular(page, protoName, false);
    await saveScreenshot(page, 'home-popular-developing-hidden');
  });
});
