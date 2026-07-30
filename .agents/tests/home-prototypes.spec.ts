import { test } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestModelViaApi,
  createTestPrototype,
  setPrototypeStateViaUI,
  expectPrototypeInPopular,
} from './helpers';

test.describe('Home Popular Prototypes', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('popular prototype appears when model is public and state is Released', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `HomePublic_${timestamp}`;
    const protoName = `HomePopular_${timestamp}`;

    const modelId = await createTestModelViaApi(page, modelName, 'public');
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);
    await setPrototypeStateViaUI(page, 'Released', modelId, prototypeId);

    await expectPrototypeInPopular(page, protoName, true);
    await saveScreenshot(page, 'home-popular-visible');
  });

  test('popular prototype hidden when model is private', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `HomePrivate_${timestamp}`;
    const protoName = `HomePrivateProto_${timestamp}`;

    const modelId = await createTestModelViaApi(page, modelName, 'private');
    const { prototypeId } = await createTestPrototype(page, protoName, modelId);
    await setPrototypeStateViaUI(page, 'Released', modelId, prototypeId);

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
