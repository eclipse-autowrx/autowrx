import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createPublicReleasedModelViaApi,
  createTestModelViaApi,
  createTestUserViaApi,
  deleteTestUserViaApi,
  deleteModelViaApi,
  configureHomeModelListSection,
  getSiteConfigJson,
  setSiteConfigJson,
  gotoHomeModelList,
  selectHomeModelCategory,
  selectHomeModelSort,
  renameModelViaHomeContextMenu,
  getHomeModelListSection,
  assertHomeModelOrder,
  setModelLastViewedMap,
  waitForModelInHomeList,
  loginAs,
  logout,
  TEST_USER,
  addModelPermissionViaApi,
} from './helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Home Model List', () => {
  let originalHomeContent: unknown = null;
  const createdModelIds: string[] = [];
  let testUserId: string | null = null;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await configureHomeModelListSection(page);
  });

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    originalHomeContent = await getSiteConfigJson(page, 'CFG_HOME_CONTENT');
    await configureHomeModelListSection(page);
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

  test.afterEach(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    while (createdModelIds.length > 0) {
      const modelId = createdModelIds.pop();
      if (modelId) {
        await deleteModelViaApi(page, modelId).catch(() => {});
      }
    }
    if (testUserId) {
      await deleteTestUserViaApi(page, testUserId).catch(() => {});
      testUserId = null;
    }
    await page.close();
  });

  test('guest home model-list shows only public released models', async ({ browser }) => {
    const timestamp = Date.now();
    const publicName = `E2E_HomePublic_${timestamp}`;
    const privateName = `E2E_HomePrivate_${timestamp}`;

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAsAdmin(adminPage);

    createdModelIds.push(await createPublicReleasedModelViaApi(adminPage, publicName));
    createdModelIds.push(await createTestModelViaApi(adminPage, privateName, 'private'));
    await adminContext.close();

    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await gotoHomeModelList(guestPage);

    const section = getHomeModelListSection(guestPage);
    await expect(section.getByText(publicName)).toBeVisible({ timeout: 20000 });
    await expect(section.getByText(privateName)).toHaveCount(0, { timeout: 10000 });

    await saveScreenshot(guestPage, 'home-model-list-guest-public-only');
    await guestContext.close();
  });

  test('logged-in admin sees category tabs and model actions', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAsAdmin(adminPage);
    await gotoHomeModelList(adminPage);

    const section = getHomeModelListSection(adminPage);
    await expect(section.getByRole('button', { name: 'All', exact: true })).toBeVisible({
      timeout: 10000,
    });
    await expect(section.getByRole('button', { name: 'My Models', exact: true })).toBeVisible();
    await expect(
      section.getByRole('button', { name: 'My Contributions', exact: true }),
    ).toBeVisible();
    await expect(section.getByRole('button', { name: 'Public', exact: true })).toBeVisible();
    await expect(section.getByRole('button', { name: /Import Model/i })).toBeVisible();
    await expect(section.getByRole('button', { name: /Add Model/i })).toBeVisible();

    await saveScreenshot(adminPage, 'home-model-list-logged-in-ui');
    await adminContext.close();

    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await gotoHomeModelList(guestPage);

    const guestSection = getHomeModelListSection(guestPage);
    await expect(guestSection.getByRole('button', { name: 'My Models', exact: true })).toHaveCount(0);
    await expect(guestSection.getByRole('button', { name: /Import Model/i })).toHaveCount(0);
    await expect(guestSection.getByRole('button', { name: /Add Model/i })).toHaveCount(0);

    await guestContext.close();
  });

  test('My Models category shows owned private model', async ({ page }) => {
    const timestamp = Date.now();
    const privateName = `AAA_HomeMyModel_${timestamp}`;
    const otherUserModelName = `AAA_HomeMyModelOther_${timestamp}`;

    await loginAsAdmin(page);
    createdModelIds.push(await createTestModelViaApi(page, privateName, 'private'));

    const testUser = await createTestUserViaApi(page, {
      email: `e2e_home_my_model_${timestamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E User ${timestamp}`,
    });
    testUserId = testUser.id;

    await logout(page);
    await loginAs(page, testUser.email, TEST_USER.password);
    createdModelIds.push(
      await createTestModelViaApi(page, otherUserModelName, 'private', {
        email: testUser.email,
        password: TEST_USER.password,
      }),
    );

    await logout(page);
    await loginAsAdmin(page);
    await gotoHomeModelList(page);
    await selectHomeModelCategory(page, 'My Models');
    await selectHomeModelSort(page, 'Name A-Z');

    expect(page.url()).toContain('model-category=myModel');
    const section = getHomeModelListSection(page);
    await expect(section.locator(`[aria-label="${privateName}"]`)).toBeVisible({ timeout: 20000 });
    await expect(section.locator(`[aria-label="${otherUserModelName}"]`)).toHaveCount(0, {
      timeout: 10000,
    });

    await saveScreenshot(page, 'home-model-list-my-models-filter');
  });

  test('Public category shows only public released models', async ({ page }) => {
    const timestamp = Date.now();
    const privateName = `E2E_HomePublicFilterPrivate_${timestamp}`;
    const publicName = `E2E_HomePublicFilterPublic_${timestamp}`;

    await loginAsAdmin(page);
    createdModelIds.push(await createTestModelViaApi(page, privateName, 'private'));
    createdModelIds.push(await createPublicReleasedModelViaApi(page, publicName));

    await gotoHomeModelList(page);
    await selectHomeModelCategory(page, 'Public');

    expect(page.url()).toContain('model-category=public');
    const section = getHomeModelListSection(page);
    await expect(section.getByText(publicName)).toBeVisible({ timeout: 20000 });
    await expect(section.getByText(privateName)).toHaveCount(0, { timeout: 10000 });

    await saveScreenshot(page, 'home-model-list-public-filter');
  });

  test.describe('sort options', () => {
    test('sort by Newest orders model cards', async ({ page }) => {
      const timestamp = Date.now();
      const firstName = `First_HomeModelSort_${timestamp}`;
      const secondName = `Second_HomeModelSort_${timestamp}`;

      createdModelIds.push(await createTestModelViaApi(page, firstName, 'private'));
      await page.waitForTimeout(1000);
      createdModelIds.push(await createTestModelViaApi(page, secondName, 'private'));

      await gotoHomeModelList(page);
      await selectHomeModelCategory(page, 'My Models');
      await selectHomeModelSort(page, 'Newest');

      expect(page.url()).toContain('model-sort=newest');
      await assertHomeModelOrder(page, secondName, firstName);
      await saveScreenshot(page, 'home-model-list-sort-newest');
    });

    test('sort by Oldest orders model cards', async ({ page }) => {
      const timestamp = Date.now();
      const firstName = `First_HomeModelSort_${timestamp}`;
      const secondName = `Second_HomeModelSort_${timestamp}`;

      createdModelIds.push(await createTestModelViaApi(page, firstName, 'private'));
      await page.waitForTimeout(1000);
      createdModelIds.push(await createTestModelViaApi(page, secondName, 'private'));

      await gotoHomeModelList(page);
      await selectHomeModelCategory(page, 'My Models');
      await selectHomeModelSort(page, 'Oldest');

      expect(page.url()).toContain('model-sort=oldest');
      await assertHomeModelOrder(page, firstName, secondName);
      await saveScreenshot(page, 'home-model-list-sort-oldest');
    });

    test('sort by Name A-Z orders model cards', async ({ page }) => {
      const timestamp = Date.now();
      const nameA = `AAA_HomeModelSort_${timestamp}`;
      const nameZ = `ZZZ_HomeModelSort_${timestamp}`;

      createdModelIds.push(await createTestModelViaApi(page, nameZ, 'private'));
      createdModelIds.push(await createTestModelViaApi(page, nameA, 'private'));

      await gotoHomeModelList(page);
      await selectHomeModelCategory(page, 'My Models');
      await selectHomeModelSort(page, 'Name A-Z');

      expect(page.url()).toContain('model-sort=name-az');
      await assertHomeModelOrder(page, nameA, nameZ);
      await saveScreenshot(page, 'home-model-list-sort-az');
    });

    test('sort by Name Z-A orders model cards', async ({ page }) => {
      const timestamp = Date.now();
      const nameA = `AAA_HomeModelSort_${timestamp}`;
      const nameZ = `ZZZ_HomeModelSort_${timestamp}`;

      createdModelIds.push(await createTestModelViaApi(page, nameZ, 'private'));
      createdModelIds.push(await createTestModelViaApi(page, nameA, 'private'));

      await gotoHomeModelList(page);
      await selectHomeModelCategory(page, 'My Models');
      await selectHomeModelSort(page, 'Name Z-A');

      expect(page.url()).toContain('model-sort=name-za');
      await assertHomeModelOrder(page, nameZ, nameA);
      await saveScreenshot(page, 'home-model-list-sort-za');
    });

    test('sort by Last viewed orders model cards', async ({ page }) => {
      const timestamp = Date.now();
      const modelAName = `AAA_HomeModelView_${timestamp}`;
      const modelBName = `ZZZ_HomeModelView_${timestamp}`;

      const modelAId = await createTestModelViaApi(page, modelAName, 'private');
      createdModelIds.push(modelAId);
      const modelBId = await createTestModelViaApi(page, modelBName, 'private');
      createdModelIds.push(modelBId);

      await setModelLastViewedMap(page, {
        [modelAId]: 1000,
        [modelBId]: 2000,
      });

      await gotoHomeModelList(page);
      await selectHomeModelCategory(page, 'My Models');
      await selectHomeModelSort(page, 'Name A-Z');
      expect(page.url()).toContain('model-sort=name-az');
      await selectHomeModelSort(page, 'Last viewed');
      expect(page.url()).not.toContain('model-sort=');
      await assertHomeModelOrder(page, modelBName, modelAName);
      await saveScreenshot(page, 'home-model-list-sort-last-viewed');
    });

    test('sort by First viewed orders model cards', async ({ page }) => {
      const timestamp = Date.now();
      const modelAName = `AAA_HomeModelView_${timestamp}`;
      const modelBName = `ZZZ_HomeModelView_${timestamp}`;

      const modelAId = await createTestModelViaApi(page, modelAName, 'private');
      createdModelIds.push(modelAId);
      const modelBId = await createTestModelViaApi(page, modelBName, 'private');
      createdModelIds.push(modelBId);

      await setModelLastViewedMap(page, {
        [modelAId]: 1000,
        [modelBId]: 2000,
      });

      await gotoHomeModelList(page);
      await selectHomeModelCategory(page, 'My Models');
      await selectHomeModelSort(page, 'First viewed');

      expect(page.url()).toContain('model-sort=first-viewed');
      await assertHomeModelOrder(page, modelAName, modelBName);
      await saveScreenshot(page, 'home-model-list-sort-first-viewed');
    });
  });

  test('rename model via home context menu', async ({ page }) => {
    const timestamp = Date.now();
    const originalName = `E2E_HomeRename_${timestamp}`;
    const renamedName = `${originalName}_renamed`;

    await loginAsAdmin(page);
    createdModelIds.push(await createTestModelViaApi(page, originalName, 'private'));

    await waitForModelInHomeList(page, originalName);

    await renameModelViaHomeContextMenu(page, originalName, renamedName);

    const section = getHomeModelListSection(page);
    await selectHomeModelCategory(page, 'My Models');
    await expect(section.locator(`[aria-label="${renamedName}"]`)).toBeVisible({ timeout: 20000 });
    await expect(section.locator(`[aria-label="${originalName}"]`)).toHaveCount(0, {
      timeout: 10000,
    });

    await saveScreenshot(page, 'home-model-list-rename');
  });

  test('My Contributions shows model for contributor', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `E2E_ContribModel_${timestamp}`;

    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, modelName, 'private');
    createdModelIds.push(modelId);

    const testUser = await createTestUserViaApi(page, {
      email: `e2e_contrib_${timestamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E Contributor ${timestamp}`,
    });
    testUserId = testUser.id;
    await addModelPermissionViaApi(page, modelId, testUser.id, 'model_contributor');

    await logout(page);
    await loginAs(page, testUser.email, TEST_USER.password);
    await gotoHomeModelList(page);
    await selectHomeModelCategory(page, 'My Contributions');

    expect(page.url()).toContain('model-category=myContribution');
    const section = getHomeModelListSection(page);
    await expect(section.locator(`[aria-label="${modelName}"]`)).toBeVisible({ timeout: 20000 });

    await saveScreenshot(page, 'home-model-list-contributor-visible');
  });

  test('contributed model is hidden from My Models tab', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `E2E_ContribMyModels_${timestamp}`;

    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, modelName, 'private');
    createdModelIds.push(modelId);

    const testUser = await createTestUserViaApi(page, {
      email: `e2e_contrib_my_models_${timestamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E Contributor ${timestamp}`,
    });
    testUserId = testUser.id;
    await addModelPermissionViaApi(page, modelId, testUser.id, 'model_contributor');

    await logout(page);
    await loginAs(page, testUser.email, TEST_USER.password);
    await gotoHomeModelList(page);
    await selectHomeModelCategory(page, 'My Models');

    expect(page.url()).toContain('model-category=myModel');
    const section = getHomeModelListSection(page);
    await expect(section.locator(`[aria-label="${modelName}"]`)).toHaveCount(0, {
      timeout: 10000,
    });

    await saveScreenshot(page, 'home-model-list-contributor-hidden-my-models');
  });

  test('contributed private model is hidden from Public tab', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `E2E_ContribPublic_${timestamp}`;

    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, modelName, 'private');
    createdModelIds.push(modelId);

    const testUser = await createTestUserViaApi(page, {
      email: `e2e_contrib_public_${timestamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E Contributor ${timestamp}`,
    });
    testUserId = testUser.id;
    await addModelPermissionViaApi(page, modelId, testUser.id, 'model_contributor');

    await logout(page);
    await loginAs(page, testUser.email, TEST_USER.password);
    await gotoHomeModelList(page);
    await selectHomeModelCategory(page, 'Public');

    expect(page.url()).toContain('model-category=public');
    const section = getHomeModelListSection(page);
    await expect(section.locator(`[aria-label="${modelName}"]`)).toHaveCount(0, {
      timeout: 10000,
    });

    await saveScreenshot(page, 'home-model-list-contributor-hidden-public');
  });

  test('contributor can open new prototype from home card', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `E2E_ContribProto_${timestamp}`;

    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, modelName, 'private');
    createdModelIds.push(modelId);

    const testUser = await createTestUserViaApi(page, {
      email: `e2e_contrib_proto_${timestamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E Contributor ${timestamp}`,
    });
    testUserId = testUser.id;
    await addModelPermissionViaApi(page, modelId, testUser.id, 'model_contributor');

    await logout(page);
    await loginAs(page, testUser.email, TEST_USER.password);
    await gotoHomeModelList(page);
    await selectHomeModelCategory(page, 'My Contributions');

    const section = getHomeModelListSection(page);
    const card = section.locator(`[aria-label="${modelName}"]`);
    await expect(card).toBeVisible({ timeout: 20000 });
    await card.getByTitle('Add new Prototype').click();

    await page.waitForURL(/\/new-prototype\?model_id=/, { timeout: 30000 });
    expect(new URL(page.url()).searchParams.get('model_id')).toBe(modelId);

    await saveScreenshot(page, 'home-model-list-contributor-new-prototype');
  });

  test('reader sees contributed model but edit menu is disabled', async ({ page }) => {
    const timestamp = Date.now();
    const modelName = `E2E_ContribReader_${timestamp}`;

    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, modelName, 'private');
    createdModelIds.push(modelId);

    const testUser = await createTestUserViaApi(page, {
      email: `e2e_contrib_reader_${timestamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E Reader ${timestamp}`,
    });
    testUserId = testUser.id;
    await addModelPermissionViaApi(page, modelId, testUser.id, 'model_member');

    await logout(page);
    await loginAs(page, testUser.email, TEST_USER.password);
    await gotoHomeModelList(page);
    await selectHomeModelCategory(page, 'My Contributions');

    const section = getHomeModelListSection(page);
    const card = section.locator(`[aria-label="${modelName}"]`);
    await expect(card).toBeVisible({ timeout: 20000 });
    await expect(card.getByTitle('Menu')).toBeDisabled();

    await card.click({ button: 'right', force: true });
    await expect(page.getByText('Permission denied', { exact: true })).toBeVisible({
      timeout: 10000,
    });

    await saveScreenshot(page, 'home-model-list-reader-no-edit');
  });
});
