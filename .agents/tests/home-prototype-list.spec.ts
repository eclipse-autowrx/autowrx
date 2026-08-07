import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  loginAs,
  logout,
  saveScreenshot,
  createPublicReleasedModelViaApi,
  createTestModelViaApi,
  createTestPrototype,
  createTestUserViaApi,
  deleteModelViaApi,
  deleteTestUserViaApi,
  setPrototypeStateViaApi,
  configureHomePrototypeListSection,
  getSiteConfigJson,
  setSiteConfigJson,
  gotoHomePrototypeList,
  selectHomePrototypeCategory,
  selectHomePrototypeSort,
  getVisibleHomePrototypeNames,
  getHomePrototypeListSection,
  assertHomePrototypeOrder,
  setPrototypeLastViewedMap,
  TEST_USER,
  waitForPrototypeInHomeList,
  ensureHomePrototypeVisible,
} from './helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Home Prototype List', () => {
  let originalHomeContent: unknown = null;
  const createdModelIds: string[] = [];
  let testUserId: string | null = null;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await configureHomePrototypeListSection(page);
  });

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

  test('guest home prototype-list shows public released prototypes only', async ({ browser }) => {
    const timestamp = Date.now();
    const publicProtoName = `AAA_HomeProtoPublic_${timestamp}`;
    const privateProtoName = `AAA_HomeProtoPrivate_${timestamp}`;

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAsAdmin(adminPage);

    const publicModelId = await createPublicReleasedModelViaApi(
      adminPage,
      `E2E_HomeProtoPublicModel_${timestamp}`,
    );
    createdModelIds.push(publicModelId);
    const { prototypeId: publicPrototypeId } = await createTestPrototype(
      adminPage,
      publicProtoName,
      publicModelId,
    );
    await setPrototypeStateViaApi(adminPage, publicPrototypeId, 'Released');

    const privateModelId = await createTestModelViaApi(
      adminPage,
      `E2E_HomeProtoPrivateModel_${timestamp}`,
      'private',
    );
    createdModelIds.push(privateModelId);
    const { prototypeId: privatePrototypeId } = await createTestPrototype(
      adminPage,
      privateProtoName,
      privateModelId,
    );
    await setPrototypeStateViaApi(adminPage, privatePrototypeId, 'Released');
    await configureHomePrototypeListSection(adminPage);
    await adminContext.close();

    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await gotoHomePrototypeList(guestPage);
    await selectHomePrototypeSort(guestPage, 'Name A-Z');

    const section = getHomePrototypeListSection(guestPage);
    await expect(
      section.locator(`[data-id^="prototype-item-"]:has-text("${publicProtoName}")`).first(),
    ).toBeVisible({ timeout: 20000 });
    await expect(
      section.locator(`[data-id^="prototype-item-"]:has-text("${privateProtoName}")`),
    ).toHaveCount(0, { timeout: 10000 });

    await saveScreenshot(guestPage, 'home-prototype-list-guest-public-only');
    await guestContext.close();
  });

  test('logged-in admin sees category tabs', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAsAdmin(adminPage);
    await gotoHomePrototypeList(adminPage);

    const section = getHomePrototypeListSection(adminPage);
    await expect(section.getByRole('button', { name: 'All', exact: true })).toBeVisible({
      timeout: 10000,
    });
    await expect(section.getByRole('button', { name: 'My Prototypes', exact: true })).toBeVisible();

    await saveScreenshot(adminPage, 'home-prototype-list-logged-in-ui');
    await adminContext.close();

    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await gotoHomePrototypeList(guestPage);

    const guestSection = getHomePrototypeListSection(guestPage);
    await expect(guestSection.getByRole('button', { name: 'All', exact: true })).toHaveCount(0);
    await expect(guestSection.getByRole('button', { name: 'My Prototypes', exact: true })).toHaveCount(
      0,
    );

    await guestContext.close();
  });

  test('My Prototypes category shows only owned prototypes', async ({ page }) => {
    const timestamp = Date.now();
    const adminProtoName = `E2E_HomeMyProtoAdmin_${timestamp}`;
    const userProtoName = `E2E_HomeMyProtoUser_${timestamp}`;

    await loginAsAdmin(page);
    const adminModelId = await createTestModelViaApi(page, `E2E_HomeMyProtoAdminModel_${timestamp}`, 'private');
    createdModelIds.push(adminModelId);
    await createTestPrototype(page, adminProtoName, adminModelId);

    const testUser = await createTestUserViaApi(page, {
      email: `e2e_home_my_proto_${timestamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E User ${timestamp}`,
    });
    testUserId = testUser.id;

    await logout(page);
    await loginAs(page, testUser.email, TEST_USER.password);
    const userModelId = await createTestModelViaApi(
      page,
      `E2E_HomeMyProtoUserModel_${timestamp}`,
      'private',
      { email: testUser.email, password: TEST_USER.password },
    );
    createdModelIds.push(userModelId);
    await createTestPrototype(page, userProtoName, userModelId);

    await logout(page);
    await loginAsAdmin(page);
    await gotoHomePrototypeList(page);
    await selectHomePrototypeCategory(page, 'My Prototypes');

    expect(page.url()).toContain('prototype-category=mine');

    const section = getHomePrototypeListSection(page);
    await expect(
      section.locator(`[data-id^="prototype-item-"]:has-text("${adminProtoName}")`).first(),
    ).toBeVisible({ timeout: 20000 });
    await expect(
      section.locator(`[data-id^="prototype-item-"]:has-text("${userProtoName}")`),
    ).toHaveCount(0, { timeout: 10000 });

    await saveScreenshot(page, 'home-prototype-list-my-prototypes-filter');
  });

  test.describe('sort options', () => {
    test('sort by Newest orders prototype cards', async ({ page }) => {
      const timestamp = Date.now();
      const firstName = `First_HomeProtoSort_${timestamp}`;
      const secondName = `Second_HomeProtoSort_${timestamp}`;

      const modelId = await createTestModelViaApi(page, `E2E_HomeProtoSortModel_${timestamp}`, 'private');
      createdModelIds.push(modelId);
      await createTestPrototype(page, firstName, modelId);
      await createTestPrototype(page, secondName, modelId);

      await gotoHomePrototypeList(page);
      await selectHomePrototypeCategory(page, 'My Prototypes');
      // Newest is the default sort — URL omits prototype-sort when unchanged.
      // Switch away and back so the sort control actually applies.
      await selectHomePrototypeSort(page, 'Oldest');
      expect(page.url()).toContain('prototype-sort=oldest');
      await selectHomePrototypeSort(page, 'Newest');
      expect(page.url()).not.toContain('prototype-sort=');
      await assertHomePrototypeOrder(page, secondName, firstName);
      await saveScreenshot(page, 'home-prototype-list-sort-newest');
    });

    test('sort by Oldest orders prototype cards', async ({ page }) => {
      const timestamp = Date.now();
      const firstName = `First_HomeProtoSort_${timestamp}`;
      const secondName = `Second_HomeProtoSort_${timestamp}`;

      const modelId = await createTestModelViaApi(page, `E2E_HomeProtoSortModel_${timestamp}`, 'private');
      createdModelIds.push(modelId);
      await createTestPrototype(page, firstName, modelId);
      await createTestPrototype(page, secondName, modelId);

      await gotoHomePrototypeList(page);
      await selectHomePrototypeCategory(page, 'My Prototypes');
      await selectHomePrototypeSort(page, 'Oldest');

      expect(page.url()).toContain('prototype-sort=oldest');
      await assertHomePrototypeOrder(page, firstName, secondName);
      await saveScreenshot(page, 'home-prototype-list-sort-oldest');
    });

    test('sort by Name A-Z orders prototype cards', async ({ page }) => {
      const timestamp = Date.now();
      const nameA = `AAA_HomeProtoSort_${timestamp}`;
      const nameZ = `ZZZ_HomeProtoSort_${timestamp}`;

      const modelId = await createTestModelViaApi(page, `E2E_HomeProtoSortModel_${timestamp}`, 'private');
      createdModelIds.push(modelId);
      await createTestPrototype(page, nameZ, modelId);
      await createTestPrototype(page, nameA, modelId);

      await gotoHomePrototypeList(page);
      await selectHomePrototypeCategory(page, 'My Prototypes');
      await selectHomePrototypeSort(page, 'Name A-Z');

      expect(page.url()).toContain('prototype-sort=name-az');
      await assertHomePrototypeOrder(page, nameA, nameZ);
      await saveScreenshot(page, 'home-prototype-list-sort-az');
    });

    test('sort by Name Z-A orders prototype cards', async ({ page }) => {
      const timestamp = Date.now();
      const nameA = `AAA_HomeProtoSort_${timestamp}`;
      const nameZ = `ZZZ_HomeProtoSort_${timestamp}`;

      const modelId = await createTestModelViaApi(page, `E2E_HomeProtoSortModel_${timestamp}`, 'private');
      createdModelIds.push(modelId);
      await createTestPrototype(page, nameZ, modelId);
      await createTestPrototype(page, nameA, modelId);

      await gotoHomePrototypeList(page);
      await selectHomePrototypeCategory(page, 'My Prototypes');
      await selectHomePrototypeSort(page, 'Name Z-A');

      expect(page.url()).toContain('prototype-sort=name-za');
      await assertHomePrototypeOrder(page, nameZ, nameA);
      await saveScreenshot(page, 'home-prototype-list-sort-za');
    });

    test('sort by Last Viewed orders prototype cards', async ({ page }) => {
      const timestamp = Date.now();
      const protoAName = `AAA_HomeProtoView_${timestamp}`;
      const protoBName = `ZZZ_HomeProtoView_${timestamp}`;

      const modelId = await createTestModelViaApi(page, `E2E_HomeProtoViewModel_${timestamp}`, 'private');
      createdModelIds.push(modelId);
      const { prototypeId: protoAId } = await createTestPrototype(page, protoAName, modelId);
      const { prototypeId: protoBId } = await createTestPrototype(page, protoBName, modelId);

      await setPrototypeLastViewedMap(page, {
        [protoAId]: 1000,
        [protoBId]: 2000,
      });

      await gotoHomePrototypeList(page);
      await selectHomePrototypeCategory(page, 'My Prototypes');
      await selectHomePrototypeSort(page, 'Last Viewed');

      expect(page.url()).toContain('prototype-sort=last-viewed');
      await assertHomePrototypeOrder(page, protoBName, protoAName);
      await saveScreenshot(page, 'home-prototype-list-sort-last-viewed');
    });

    test('sort by First Viewed orders prototype cards', async ({ page }) => {
      const timestamp = Date.now();
      const protoAName = `AAA_HomeProtoView_${timestamp}`;
      const protoBName = `ZZZ_HomeProtoView_${timestamp}`;

      const modelId = await createTestModelViaApi(page, `E2E_HomeProtoViewModel_${timestamp}`, 'private');
      createdModelIds.push(modelId);
      const { prototypeId: protoAId } = await createTestPrototype(page, protoAName, modelId);
      const { prototypeId: protoBId } = await createTestPrototype(page, protoBName, modelId);

      await setPrototypeLastViewedMap(page, {
        [protoAId]: 1000,
        [protoBId]: 2000,
      });

      await gotoHomePrototypeList(page);
      await selectHomePrototypeCategory(page, 'My Prototypes');
      await selectHomePrototypeSort(page, 'First Viewed');

      expect(page.url()).toContain('prototype-sort=first-viewed');
      await assertHomePrototypeOrder(page, protoAName, protoBName);
      await saveScreenshot(page, 'home-prototype-list-sort-first-viewed');
    });
  });

  test('clicking prototype card navigates to detail', async ({ page }) => {
    const timestamp = Date.now();
    const protoName = `E2E_HomeProtoClick_${timestamp}`;

    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, `E2E_HomeProtoClickModel_${timestamp}`, 'private');
    createdModelIds.push(modelId);
    await createTestPrototype(page, protoName, modelId);

    await waitForPrototypeInHomeList(page, protoName);

    const section = getHomePrototypeListSection(page);
    await section.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`).first().click();
    await page.waitForURL(/\/library\/prototype\/.+\/view/, { timeout: 30000 });

    expect(page.url()).toMatch(/\/library\/prototype\/.+\/view/);

    await saveScreenshot(page, 'home-prototype-list-click-navigate');
  });
});
