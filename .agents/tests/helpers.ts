import { copyFile, mkdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { Locator, Page, expect } from '@playwright/test';

export const E2E_PLUGIN_MARKER = 'E2E_PLUGIN_LOADED_OK';

export const E2E_PLUGIN_FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'e2e-simple-plugin');

export const E2E_PLUGIN_ZIP_PATH = join(E2E_PLUGIN_FIXTURE_DIR, 'e2e-simple-plugin.zip');

export const ADMIN = {
  email: process.env.ADMIN_EMAIL!,
  password: process.env.ADMIN_PASSWORD!,
};

export const API_URL = process.env.API_URL || process.env.BASE_URL?.replace(':3210', ':3200') || '';

export const RUNTIME_SERVER_URL =
  process.env.RUNTIME_SERVER_URL || 'http://localhost:3090';

export const RUNTIME_SERVER_CONFIG =
  process.env.RUNTIME_SERVER_CONFIG ||
  '{"transports":["websocket"],"reconnectionAttempts":5}';

export const TEST_USER = {
  email: 'testuser@autowrx.test',
  password: 'TestPass123!',
  name: 'Test User',
};

export type ModelVisibility = 'public' | 'private' | 'editable';

export type AuthCredentials = { email: string; password: string };

export const LIBRARY_SEARCH_SELECTOR = 'input[placeholder="Search prototypes"]';

export type NavBarActionConfig = {
  type?: 'link' | 'search';
  label: string;
  icon: string;
  url: string;
  placeholder?: string;
  position?: 'left' | 'right';
  openTarget?: '_blank' | '_self';
};

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.waitForTimeout(1500);

  const userProfile = page.locator('img[alt="User profile"]').first();
  if (await userProfile.isVisible().catch(() => false)) {
    await logout(page);
    await page.goto('/');
    await page.waitForTimeout(1500);
  }

  // Open login modal
  const signInBtn = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
  await signInBtn.click();
  await page.waitForTimeout(1000);

  await page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  // Press Enter to submit (more reliable than clicking button with overlay)
  await page.locator('input[type="password"]').first().press('Enter');
  await expect(page.locator('img[alt="User profile"]').first()).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(1000);
}

export async function loginAsAdmin(page: Page) {
  await loginAs(page, ADMIN.email, ADMIN.password);
}

export async function logout(page: Page) {
  // Click user avatar (img[alt="User profile"] inside a ghost button)
  await page.locator('img[alt="User profile"]').first().click();
  await page.waitForTimeout(800);
  // Click Logout in dropdown
  await page.locator('[role="menuitem"]:has-text("Logout")').first().click();
  await page.waitForTimeout(1500);
}

export async function searchPrototypeLibrary(page: Page, query: string) {
  const searchInput = page.locator(LIBRARY_SEARCH_SELECTOR).first();
  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await searchInput.fill(query);
  await page.waitForTimeout(1000);
}

const SORT_OPTIONS = /Newest|Oldest|Name A-Z|Name Z-A|Last view|First view|Rating/;

export async function clearPrototypeLibrarySort(page: Page) {
  await page.evaluate(() => localStorage.removeItem('prototypeLibrary-selectedFilter'));
}

export async function selectPrototypeLibrarySort(page: Page, option: string) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  const sortButton = page.getByRole('button', { name: SORT_OPTIONS }).first();
  await expect(sortButton).toBeVisible({ timeout: 10000 });
  await sortButton.scrollIntoViewIfNeeded();

  for (let attempt = 0; attempt < 3; attempt++) {
    await sortButton.click();
    const optionLabel = page.locator('ul').locator('label').filter({
      has: page.getByText(option, { exact: true }),
    });
    if (await optionLabel.isVisible().catch(() => false)) {
      await optionLabel.click();
      await page.waitForTimeout(500);
      return;
    }
    await page.waitForTimeout(300);
  }

  throw new Error(`Could not select sort option: ${option}`);
}

export async function getVisiblePrototypeNames(page: Page): Promise<string[]> {
  const names = await page.locator('.prototype-grid-item-name').allTextContents();
  return names.map((name) => name.trim()).filter(Boolean);
}

export async function getAuthToken(page: Page): Promise<string> {
  return getTokenForUser(page, ADMIN.email, ADMIN.password);
}

export async function getTokenForUser(
  page: Page,
  email: string,
  password: string,
): Promise<string> {
  const loginRes = await page.request.post(`${API_URL}/v2/auth/login`, {
    data: { email, password },
  });
  const loginData = await loginRes.json();
  const token = loginData?.tokens?.access?.token;
  if (!token) {
    throw new Error(`Failed to get auth token for ${email}: ${loginRes.status()}`);
  }
  return token;
}

export async function getAdminToken(page: Page): Promise<string> {
  return getAuthToken(page);
}

export async function getSiteConfigValue(page: Page, key: string): Promise<string> {
  const token = await getAuthToken(page);
  const res = await page.request.get(`${API_URL}/v2/site-config/key/${key}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to get site config "${key}": ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  return String(data?.value ?? '');
}

export async function updateSiteConfigValue(page: Page, key: string, value: string): Promise<void> {
  const token = await getAuthToken(page);
  const res = await page.request.patch(`${API_URL}/v2/site-config/key/${key}`, {
    data: { value },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to update site config "${key}": ${res.status()} ${await res.text()}`);
  }
}

export async function openPublicSiteConfig(page: Page) {
  await page.goto('/admin/site-config?section=public');
  await expect(page.getByRole('heading', { name: 'Public Configurations' })).toBeVisible({
    timeout: 15000,
  });
}

export function getPublicConfigRow(page: Page, key: string): Locator {
  return page
    .locator('div.bg-background.rounded-lg.p-2')
    .filter({ has: page.getByText(key, { exact: true }) })
    .first();
}

export async function editPublicConfigValueViaUI(page: Page, key: string, value: string) {
  const row = getPublicConfigRow(page, key);
  await expect(row).toBeVisible({ timeout: 15000 });
  await row.locator('.bg-muted.cursor-pointer').click();
  const input = row.locator('input[data-slot="input"]').first();
  await expect(input).toBeVisible({ timeout: 10000 });
  await input.fill(value);
  await row.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(1000);
}

export async function createTestModelViaApi(
  page: Page,
  name: string,
  visibility: ModelVisibility,
  auth?: AuthCredentials,
): Promise<string> {
  const token = auth
    ? await getTokenForUser(page, auth.email, auth.password)
    : await getAuthToken(page);
  const res = await page.request.post(`${API_URL}/v2/models`, {
    data: {
      name,
      main_api: 'Vehicle',
      visibility,
    },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to create model: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  if (typeof data === 'string') {
    return data;
  }
  const modelId = data?.id || data?._id;
  if (!modelId) {
    throw new Error(`Create model response missing id: ${JSON.stringify(data)}`);
  }
  return String(modelId);
}

export async function setModelVisibilityViaApi(
  page: Page,
  modelId: string,
  visibility: ModelVisibility,
  auth?: AuthCredentials,
) {
  const token = auth
    ? await getTokenForUser(page, auth.email, auth.password)
    : await getAuthToken(page);
  const res = await page.request.patch(`${API_URL}/v2/models/${modelId}`, {
    data: { visibility },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to update model visibility: ${res.status()} ${await res.text()}`);
  }
}

export function getPrototypeIdFromUrl(url: string): string {
  const match = url.match(/\/prototype\/([^/?]+)/);
  if (!match?.[1]) {
    throw new Error(`Could not parse prototype id from URL: ${url}`);
  }
  return match[1];
}

export async function goToPrototypeOverview(page: Page, modelId: string, prototypeId: string) {
  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/prototypes/${prototypeId}`) &&
      res.request().method() === 'GET' &&
      res.ok(),
    { timeout: 30000 },
  );
  await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/view`);
  await responsePromise;
  await waitForPrototypeTabs(page);
}

export async function setPrototypeStateViaApi(
  page: Page,
  prototypeId: string,
  state: 'Released' | 'development',
) {
  const token = await getAuthToken(page);
  const res = await page.request.patch(`${API_URL}/v2/prototypes/${prototypeId}`, {
    data: { state },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to update prototype state: ${res.status()} ${await res.text()}`);
  }
}

export async function setPrototypeStateViaUI(
  page: Page,
  state: 'Released' | 'development',
  modelId?: string,
  prototypeId?: string,
) {
  if (modelId && prototypeId) {
    await goToPrototypeOverview(page, modelId, prototypeId);
  }

  const editBtn = page.locator('[data-id="btn-edit-prototype-info"]');
  await expect(editBtn).toBeVisible({ timeout: 15000 });
  await editBtn.click({ force: true });
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible({ timeout: 15000 });

  const statusTrigger = page.locator('[data-id="prototype-status-select"]');
  await expect(statusTrigger).toBeVisible({ timeout: 10000 });
  await statusTrigger.click();

  const optionLabel = state === 'Released' ? 'Released' : 'Developing';
  await page.getByRole('option', { name: optionLabel, exact: true }).click();
  await page.waitForTimeout(300);

  const saveBtn = page.getByRole('button', { name: 'Save' }).first();
  await saveBtn.click();
  await expect(page.getByRole('button', { name: 'Save' })).toBeHidden({ timeout: 15000 });
  await page.waitForTimeout(1000);
}

export function getPopularSection(page: Page): Locator {
  return page
    .locator('.da-page-home')
    .locator('h2', { hasText: 'Popular Prototypes' })
    .locator('xpath=ancestor::div[contains(@class,"container")][1]');
}

export async function boostPrototypePopularity(page: Page, prototypeId: string, turns = 100) {
  const token = await getAuthToken(page);
  for (let i = 0; i < turns; i++) {
    const res = await page.request.post(`${API_URL}/v2/prototypes/${prototypeId}/execute-code`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok()) {
      throw new Error(`Failed to boost prototype popularity: ${res.status()} ${await res.text()}`);
    }
  }
}

export async function waitForPrototypeTabs(page: Page, timeoutMs = 30000) {
  const codeTab = page.locator('[data-id="tab-code"]').first();
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await codeTab.isVisible().catch(() => false)) {
      return;
    }

    const isLoading = await page.getByText('Loading prototype...').isVisible().catch(() => false);
    if (isLoading) {
      await page.waitForTimeout(1000);
      continue;
    }

    await page.waitForTimeout(500);
  }

  await expect(codeTab).toBeVisible({ timeout: 5000 });
}

export async function waitForPrototypeInPopularApi(
  page: Page,
  protoName: string,
  timeoutMs = 60000,
): Promise<void> {
  const token = await getAuthToken(page);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await page.request.get(`${API_URL}/v2/prototypes/popular`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok()) {
      const data = await res.json();
      if (Array.isArray(data) && data.some((p: { name?: string }) => p.name === protoName)) {
        return;
      }
    }
    await page.waitForTimeout(1000);
  }

  throw new Error(`Prototype "${protoName}" did not appear in popular API within ${timeoutMs}ms`);
}

export async function expectPrototypeInPopular(page: Page, name: string, visible: boolean) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  const section = getPopularSection(page);
  const findCard = () => section.locator('.prototype-grid-item-name', { hasText: name });

  if (visible) {
    await expect(section).toBeVisible({ timeout: 10000 });

    let card = findCard();
    if ((await card.count()) === 0) {
      const showMore = page.getByRole('button', { name: /Show More/i });
      if (await showMore.isVisible().catch(() => false)) {
        await showMore.click();
        await page.waitForTimeout(500);
        card = findCard();
      }
    }

    await expect(card).toBeVisible({ timeout: 15000 });
  } else {
    await expect(findCard()).toHaveCount(0, { timeout: 10000 });
  }
}

export async function createTestPrototype(page: Page, name: string, modelId?: string) {
  if (!modelId) {
    await page.goto('/model');
    await page.waitForTimeout(3000);
    const firstModel = page.locator('a[href*="/model/"]').first();
    await expect(firstModel).toBeVisible({ timeout: 20000 });
    const href = await firstModel.getAttribute('href');
    modelId = href?.split('/model/')[1]?.split('/')[0];
    await page.goto(`/model/${modelId}/library/list`);
    await page.waitForTimeout(4000);
  } else {
    await page.goto(`/model/${modelId}/library/list`);
    await page.waitForTimeout(2000);
  }

  await page.locator('[data-id="btn-create-new-prototype"]').click();
  await page.waitForTimeout(1500);

  const nameInput = page.locator('[data-id="prototype-name-input"]').first();
  await expect(nameInput).toBeVisible({ timeout: 15000 });
  await nameInput.fill(name);
  await page.waitForTimeout(300);

  const submitBtn = page.locator(
    'button:has-text("Confirm"), button:has-text("Create Prototype"), [data-id="btn-create-prototype"]'
  ).last();
  await submitBtn.click();
  await page.waitForURL(/\/prototype\//, { timeout: 30000 });
  await page.waitForTimeout(2000);

  const prototypeId = getPrototypeIdFromUrl(page.url());
  return { modelId: modelId!, prototypeId, protoName: name };
}

export async function configureRuntimeServerForTests(page: Page) {
  const token = await getAuthToken(page);
  const headers = { Authorization: `Bearer ${token}` };

  const urlRes = await page.request.patch(`${API_URL}/v2/site-config/key/RUNTIME_SERVER_URL`, {
    data: { value: RUNTIME_SERVER_URL },
    headers,
  });
  if (!urlRes.ok()) {
    throw new Error(
      `Failed to set RUNTIME_SERVER_URL: ${urlRes.status()} ${await urlRes.text()}`,
    );
  }

  const configRes = await page.request.patch(`${API_URL}/v2/site-config/key/RUNTIME_SERVER_CONFIG`, {
    data: { value: RUNTIME_SERVER_CONFIG },
    headers,
  });
  if (!configRes.ok()) {
    throw new Error(
      `Failed to set RUNTIME_SERVER_CONFIG: ${configRes.status()} ${await configRes.text()}`,
    );
  }
}

export async function setPrototypeCodeViaApi(
  page: Page,
  prototypeId: string,
  code: string,
  auth?: AuthCredentials,
) {
  const token = auth
    ? await getTokenForUser(page, auth.email, auth.password)
    : await getAuthToken(page);
  const res = await page.request.patch(`${API_URL}/v2/prototypes/${prototypeId}`, {
    data: { code },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to update prototype code: ${res.status()} ${await res.text()}`);
  }
}

export async function goToPrototypeCodeTab(page: Page, modelId: string, prototypeId: string) {
  const responsePromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/prototypes/${prototypeId}`) &&
      res.request().method() === 'GET' &&
      res.ok(),
    { timeout: 30000 },
  );
  await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/code`);
  await responsePromise;
  await expect(page).toHaveURL(
    new RegExp(`/model/${modelId}/library/prototype/${prototypeId}/code`),
  );
  // Prefer the code editor itself; runtime panel may be collapsed or delayed.
  const monaco = page.locator('.monaco-editor').first();
  const runtimePanel = page.locator('[data-id="runtime-control-panel"]').first();
  await expect(monaco.or(runtimePanel)).toBeVisible({ timeout: 30000 });
}

export async function isRuntimeServerReachable(page: Page): Promise<boolean> {
  try {
    const res = await page.request.get(RUNTIME_SERVER_URL, { timeout: 5000 });
    return res.status() < 500;
  } catch {
    return false;
  }
}

function getRuntimePanel(page: Page) {
  return page.locator('[data-id="runtime-control-panel"]').first();
}

export async function expandRuntimePanel(page: Page) {
  const panel = getRuntimePanel(page);
  await expect(panel).toBeVisible({ timeout: 15000 });

  const outputTab = page.locator('[data-id="btn-runtime-control-tab-output"]');
  const isExpanded = await outputTab.isVisible().catch(() => false);

  if (!isExpanded) {
    await page.locator('[data-id="btn-expand-runtime-control"]').first().click();
    await page.waitForTimeout(500);
    await expect(outputTab).toBeVisible({ timeout: 10000 });
  }
}

export async function waitForRuntimeReady(page: Page, timeoutMs = 60000) {
  await expandRuntimePanel(page);

  const runtimeSelect = getRuntimePanel(page).locator('select[aria-label="deploy-select"]');
  await expect(runtimeSelect).toBeVisible({ timeout: 10000 });

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const options = await runtimeSelect.locator('option').allTextContents();
    const hasOnlineRuntime = options.some(
      (text) => text.trim() && !text.includes('No runtime available'),
    );
    const runBtn = page.locator('[data-id="btn-run-prototype"]');
    const isRunEnabled = await runBtn.isEnabled().catch(() => false);

    if (hasOnlineRuntime && isRunEnabled) {
      return;
    }

    await page.waitForTimeout(1000);
  }

  const options = await runtimeSelect.locator('option').allTextContents();
  throw new Error(
    `No online runtime ready after ${timeoutMs}ms. ` +
      `Runtime options: ${options.join(', ') || '(none)'}. ` +
      `Ensure kit-manager is running at ${RUNTIME_SERVER_URL}`,
  );
}

export async function runPrototype(page: Page) {
  const runBtn = page.locator('[data-id="btn-run-prototype"]');
  await expect(runBtn).toBeEnabled({ timeout: 10000 });
  await runBtn.click();
}

export async function expectRuntimeLogContains(
  page: Page,
  text: string,
  timeoutMs = 60000,
) {
  await expandRuntimePanel(page);
  const logPanel = page.locator('[data-id="current-log"]');
  await expect(logPanel).toBeVisible({ timeout: 10000 });
  await expect(logPanel).toContainText(text, { timeout: timeoutMs });
}

export async function prepareRuntimePanelForLayoutCheck(page: Page) {
  const panel = getRuntimePanel(page);
  if (!(await panel.isVisible().catch(() => false))) return;

  const addRuntimeBtn = page.locator('[data-id="btn-add-runtime"]').first();
  const isExpanded = await addRuntimeBtn.isVisible().catch(() => false);

  if (!isExpanded) {
    await page.locator('[data-id="btn-expand-runtime-control"]').first().click();
    await page.waitForTimeout(500);
    await expect(addRuntimeBtn).toBeVisible({ timeout: 5000 });
  }
}

export async function getNavBarActionsViaApi(page: Page): Promise<NavBarActionConfig[]> {
  const token = await getAuthToken(page);
  const res = await page.request.get(`${API_URL}/v2/site-config/key/NAV_BAR_ACTIONS`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    return [];
  }
  const data = await res.json();
  return Array.isArray(data?.value) ? data.value : [];
}

export async function setNavBarActionsViaApi(page: Page, actions: NavBarActionConfig[]) {
  const token = await getAuthToken(page);
  const res = await page.request.patch(`${API_URL}/v2/site-config/key/NAV_BAR_ACTIONS`, {
    data: { value: actions },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to set NAV_BAR_ACTIONS: ${res.status()} ${await res.text()}`);
  }
}

export function getNavBar(page: Page): Locator {
  return page.locator('.da-primary-nav-bar');
}

export function getNavBarCustomLinks(page: Page): Locator {
  return getNavBar(page).locator('a.da-primary-nav-action');
}

export function getNavBarCustomSearchButtons(page: Page): Locator {
  return getNavBar(page).locator('button.da-primary-nav-action').filter({
    hasNotText: /Admin Tools|^Tools$/,
  });
}

export async function openSiteConfigNavBarActions(page: Page) {
  await page.goto('/admin/site-config?section=public');
  await page.waitForTimeout(3000);
  await expect(page.getByRole('heading', { name: 'Navigation Bar Actions' })).toBeVisible({
    timeout: 15000,
  });
}

export async function reloadForNavBarConfig(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.reload();
  await page.waitForTimeout(2500);
}

export function getNavBarActionsEditorSection(page: Page, side: 'Left Actions' | 'Right Actions') {
  return page.locator('div.space-y-4').filter({
    has: page.getByText(side, { exact: true }),
  });
}

export async function saveScreenshot(page: Page, name: string) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
  const path = `tests/screenshots/${name}-${Date.now()}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 Screenshot saved: ${path}`);
  return path;
}

export const EXTERNAL_PLUGIN_SCRIPT_URL =
  'http://127.0.0.1:18765/e2e-simple-plugin/index.js';

export type ExternalPluginRoute = {
  url: string;
  unroute: () => Promise<void>;
};

export async function routeExternalPluginScript(
  page: Page,
  fixtureDir = E2E_PLUGIN_FIXTURE_DIR,
): Promise<ExternalPluginRoute> {
  const url = EXTERNAL_PLUGIN_SCRIPT_URL;
  const body = await readFile(join(fixtureDir, 'index.js'), 'utf-8');

  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  });

  return {
    url,
    unroute: () => page.unroute(url),
  };
}

export type CreatedPlugin = {
  id: string;
  name: string;
  slug: string;
};

export async function openAdminPrototypePlugins(page: Page) {
  await page.goto('/admin/plugins?section=prototype');
  await page.waitForTimeout(2000);
  await expect(page.getByRole('heading', { name: 'Prototype Plugins' })).toBeVisible({
    timeout: 15000,
  });
}

async function findPluginByNameViaApi(page: Page, name: string): Promise<CreatedPlugin> {
  const token = await getAuthToken(page);
  const res = await page.request.get(`${API_URL}/v2/system/plugin/admin?limit=100&page=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to list admin plugins: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  const plugin = (data?.results || []).find((p: { name: string }) => p.name === name);
  if (!plugin?.id || !plugin?.slug) {
    throw new Error(`Plugin "${name}" not found after creation`);
  }
  return { id: plugin.id, name: plugin.name, slug: plugin.slug };
}

async function deployInternalPluginFixture(slug: string) {
  const targetDir = join(process.cwd(), '..', 'backend', 'static', 'plugin', slug);
  await mkdir(targetDir, { recursive: true });
  await copyFile(join(E2E_PLUGIN_FIXTURE_DIR, 'index.js'), join(targetDir, 'index.js'));
}

async function createInternalPluginViaApi(page: Page, name: string): Promise<CreatedPlugin> {
  const token = await getAuthToken(page);
  const res = await page.request.post(`${API_URL}/v2/system/plugin`, {
    data: {
      name,
      is_internal: true,
      url: '/plugin/placeholder/index.js',
      type: 'prototype_function',
    },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to create internal plugin via API: ${res.status()} ${await res.text()}`);
  }
  const plugin = await res.json();
  const url = `/plugin/${plugin.slug}/index.js`;
  await deployInternalPluginFixture(plugin.slug);

  const updateRes = await page.request.put(`${API_URL}/v2/system/plugin/${plugin.id}`, {
    data: { url },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!updateRes.ok()) {
    throw new Error(
      `Failed to update internal plugin URL: ${updateRes.status()} ${await updateRes.text()}`,
    );
  }

  return {
    id: plugin.id,
    name: plugin.name,
    slug: plugin.slug,
  };
}

export async function createPluginViaAdminUI(
  page: Page,
  opts: { name: string; externalUrl?: string; zipPath?: string },
): Promise<CreatedPlugin> {
  await openAdminPrototypePlugins(page);

  await page.getByRole('button', { name: 'New' }).click();
  await expect(page.getByRole('heading', { name: 'Create Plugin' })).toBeVisible({
    timeout: 10000,
  });

  const dialog = page.locator('[role="dialog"]').filter({
    has: page.getByRole('heading', { name: 'Create Plugin' }),
  });
  await dialog.locator('input[placeholder="Name *"]').fill(opts.name);

  const urlField = dialog.locator('textarea[rows="2"]');

  if (opts.zipPath) {
    await dialog.getByRole('button', { name: 'Upload ZIP' }).click();
    await dialog.locator('input[type="file"][accept=".zip"]').setInputFiles(opts.zipPath);
    await expect(urlField).toHaveValue(/\/plugin\//, { timeout: 10000 });
  } else if (opts.externalUrl) {
    await urlField.fill(opts.externalUrl);
  } else {
    throw new Error('createPluginViaAdminUI requires externalUrl or zipPath');
  }

  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Create Plugin' })).toBeHidden({
    timeout: 15000,
  });
  await page.waitForTimeout(1500);

  return findPluginByNameViaApi(page, opts.name);
}

export async function createInternalPluginViaAdminZip(
  page: Page,
  name: string,
  zipPath = E2E_PLUGIN_ZIP_PATH,
): Promise<CreatedPlugin> {
  try {
    return await createPluginViaAdminUI(page, { name, zipPath });
  } catch {
    const createDialog = page.getByRole('heading', { name: 'Create Plugin' });
    if (await createDialog.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: 'Cancel' }).click();
      await page.waitForTimeout(500);
    }
    return createInternalPluginViaApi(page, name);
  }
}

export async function deletePluginViaApi(page: Page, pluginId: string) {
  const token = await getAuthToken(page);
  const res = await page.request.delete(`${API_URL}/v2/system/plugin/${pluginId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok() && res.status() !== 404) {
    throw new Error(`Failed to delete plugin: ${res.status()} ${await res.text()}`);
  }
}

export async function addPluginTabViaPlusButton(
  page: Page,
  pluginName: string,
  tabLabel: string,
) {
  const isModelPage = /\/model\/[^/]+\/?$/.test(new URL(page.url()).pathname) ||
    /\/model\/[^/]+\/plugin/.test(new URL(page.url()).pathname);

  const plusBtn = isModelPage
    ? page.locator('.da-model-detail-tab-bar div.flex.w-fit.h-full.items-center button').first()
    : page.locator('div.flex.w-fit.h-full.items-center button').first();

  await expect(plusBtn).toBeVisible({ timeout: 10000 });
  await plusBtn.click();
  await expect(page.getByRole('heading', { name: 'Select an Addon' })).toBeVisible({
    timeout: 10000,
  });

  const addonDialog = page.locator('[role="dialog"]').filter({
    has: page.getByRole('heading', { name: 'Select an Addon' }),
  });
  await addonDialog.getByPlaceholder('Search addons...').fill(pluginName);
  await page.waitForTimeout(500);
  await addonDialog.getByRole('button').filter({ hasText: pluginName }).first().click();

  await expect(page.getByRole('heading', { name: 'Configure Tab Label' })).toBeVisible({
    timeout: 10000,
  });
  await page.locator('#label-input').fill(tabLabel);
  await page.getByRole('button', { name: 'Add to Tabs' }).click();
  await expect(page.getByRole('heading', { name: 'Select an Addon' })).toBeHidden({
    timeout: 15000,
  });
  await page.waitForTimeout(2000);
}

export async function expectPluginDetailLoaded(
  page: Page,
  marker: string,
  contextText?: string,
) {
  await expect(page.getByText('Loading plugin...')).toBeHidden({ timeout: 30000 });
  await expect(page.getByText(marker)).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/Failed to load plugin|Plugin component not found/)).toHaveCount(0);

  if (contextText) {
    await expect(page.getByTestId('e2e-plugin-context')).toContainText(contextText, {
      timeout: 15000,
    });
  }
}

export async function getSiteConfigJson<T>(page: Page, key: string): Promise<T | null> {
  const token = await getAuthToken(page);
  const res = await page.request.get(`${API_URL}/v2/site-config/key/${key}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    return null;
  }
  const data = await res.json();
  return (data?.value ?? null) as T | null;
}

export async function setSiteConfigJson(page: Page, key: string, value: unknown) {
  const token = await getAuthToken(page);
  const res = await page.request.patch(`${API_URL}/v2/site-config/key/${key}`, {
    data: { value },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to set site config "${key}": ${res.status()} ${await res.text()}`);
  }
}

export async function setModelReleasedViaApi(
  page: Page,
  modelId: string,
  opts?: { visibility?: ModelVisibility },
  auth?: AuthCredentials,
) {
  const token = auth
    ? await getTokenForUser(page, auth.email, auth.password)
    : await getAuthToken(page);
  const data: { state: string; visibility?: ModelVisibility } = { state: 'released' };
  if (opts?.visibility !== undefined) {
    data.visibility = opts.visibility;
  } else {
    data.visibility = 'public';
  }
  const res = await page.request.patch(`${API_URL}/v2/models/${modelId}`, {
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to release model: ${res.status()} ${await res.text()}`);
  }
}

export async function createPublicReleasedModelViaApi(page: Page, name: string): Promise<string> {
  const modelId = await createTestModelViaApi(page, name, 'public');
  await setModelReleasedViaApi(page, modelId);
  return modelId;
}

export async function createEditableReleasedModelViaApi(
  page: Page,
  name: string,
  auth?: AuthCredentials,
): Promise<string> {
  const modelId = await createTestModelViaApi(page, name, 'editable', auth);
  await setModelReleasedViaApi(page, modelId, { visibility: 'editable' }, auth);
  return modelId;
}

export async function getModelViaApi(
  page: Page,
  modelId: string,
  auth?: AuthCredentials,
): Promise<{ id: string; visibility?: string; state?: string; model_template_id?: string }> {
  const token = auth
    ? await getTokenForUser(page, auth.email, auth.password)
    : await getAuthToken(page);
  const res = await page.request.get(`${API_URL}/v2/models/${modelId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to get model: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  return {
    id: String(data?.id || data?._id || modelId),
    visibility: data?.visibility,
    state: data?.state,
    model_template_id: data?.model_template_id,
  };
}

export async function createModelWithTemplateViaApi(
  page: Page,
  name: string,
  modelTemplateId: string,
  auth?: AuthCredentials,
): Promise<string> {
  const token = auth
    ? await getTokenForUser(page, auth.email, auth.password)
    : await getAuthToken(page);
  const res = await page.request.post(`${API_URL}/v2/models`, {
    data: {
      name,
      main_api: 'Vehicle',
      model_template_id: modelTemplateId,
    },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to create model with template: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  const modelId = typeof data === 'string' ? data : data?.id || data?._id;
  if (!modelId) {
    throw new Error(`Create model response missing id: ${JSON.stringify(data)}`);
  }
  return String(modelId);
}

export type ModelTemplatePayload = {
  name: string;
  visibility?: ModelVisibility;
  is_default?: boolean;
  description?: string;
  config?: unknown;
};

export async function createModelTemplateViaApi(
  page: Page,
  payload: ModelTemplatePayload,
): Promise<string> {
  const token = await getAuthToken(page);
  const res = await page.request.post(`${API_URL}/v2/system/model-template`, {
    data: payload,
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to create model template: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  const templateId = data?.id || data?._id;
  if (!templateId) {
    throw new Error(`Create model template response missing id: ${JSON.stringify(data)}`);
  }
  return String(templateId);
}

export async function getModelTemplateViaApi(
  page: Page,
  templateId: string,
): Promise<{ id: string; visibility?: string; is_default?: boolean; name?: string }> {
  const token = await getAuthToken(page);
  const res = await page.request.get(`${API_URL}/v2/system/model-template/${templateId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to get model template: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  return {
    id: String(data?.id || data?._id || templateId),
    visibility: data?.visibility,
    is_default: data?.is_default,
    name: data?.name,
  };
}

export async function deleteModelTemplateViaApi(page: Page, templateId: string): Promise<void> {
  const token = await getAuthToken(page);
  const res = await page.request.delete(`${API_URL}/v2/system/model-template/${templateId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok() && res.status() !== 404) {
    throw new Error(`Failed to delete model template: ${res.status()} ${await res.text()}`);
  }
}

export async function createTestPrototypeViaApi(
  page: Page,
  opts: { name: string; modelId: string; auth?: AuthCredentials },
): Promise<{ prototypeId: string; protoName: string }> {
  const token = opts.auth
    ? await getTokenForUser(page, opts.auth.email, opts.auth.password)
    : await getAuthToken(page);
  const res = await page.request.post(`${API_URL}/v2/prototypes`, {
    data: {
      name: opts.name,
      model_id: opts.modelId,
    },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to create prototype: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  // createPrototype sends the full document (toJSON → id), or occasionally a bare id string.
  const rawId =
    typeof data === 'string'
      ? data
      : data?.id || data?._id || data?.prototype_id;
  const prototypeId =
    typeof rawId === 'object' && rawId !== null
      ? String((rawId as { id?: string; _id?: string }).id || (rawId as { _id?: string })._id || '')
      : String(rawId || '');
  if (!prototypeId || prototypeId === '[object Object]') {
    throw new Error(`Create prototype response missing id: ${JSON.stringify(data)}`);
  }
  return { prototypeId, protoName: opts.name };
}

export async function getPrototypeViaApi(
  page: Page,
  prototypeId: string,
  auth?: AuthCredentials,
): Promise<{ id: string; code?: string; name?: string }> {
  const token = auth
    ? await getTokenForUser(page, auth.email, auth.password)
    : await getAuthToken(page);
  const res = await page.request.get(`${API_URL}/v2/prototypes/${prototypeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to get prototype: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  return {
    id: String(data?.id || data?._id || prototypeId),
    code: data?.code,
    name: data?.name,
  };
}

export function getPrototypeLibraryCreateWrapper(page: Page): Locator {
  return page
    .locator('[data-id="btn-create-new-prototype"]')
    .first()
    .locator('xpath=ancestor::div[contains(@class,"h-fit")][1]');
}

export async function assertPrototypeLibraryCreateEnabled(page: Page, enabled: boolean) {
  await expect(page.locator('[data-id="btn-create-new-prototype"]').first()).toBeVisible({
    timeout: 15000,
  });
  const wrapper = getPrototypeLibraryCreateWrapper(page);
  if (enabled) {
    await expect(wrapper).toHaveClass(/pointer-events-auto/);
    await expect(wrapper).not.toHaveClass(/pointer-events-none/);
  } else {
    await expect(wrapper).toHaveClass(/pointer-events-none/);
    await expect(wrapper).toHaveClass(/opacity-50/);
  }
}

export async function goToVehicleApiTab(page: Page, modelId: string) {
  await page.goto(`/model/${modelId}/api`);
  await expect(page.locator('.da-page-vehicle-api')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-id="search-signal-input"]')).toBeVisible({ timeout: 20000 });
}

export async function goToPrototypeDashboard(page: Page, modelId: string, prototypeId: string) {
  await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/dashboard`);
  await page.waitForTimeout(4000);
}

export async function goToPrototypeJourneyTab(page: Page, modelId: string, prototypeId: string) {
  await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/journey`);
  await page.waitForTimeout(3000);
}

export async function configureGlobalSearchNavAction(page: Page, placeholder = 'Search') {
  await setNavBarActionsViaApi(page, [
    {
      type: 'search',
      label: '',
      url: '',
      placeholder,
      position: 'right',
      icon: '',
    },
  ]);
  await reloadForNavBarConfig(page);
}

export async function openGlobalSearchDialog(page: Page) {
  const searchBtn = getNavBarCustomSearchButtons(page).first();
  await expect(searchBtn).toBeVisible({ timeout: 10000 });
  await searchBtn.click();
  await expect(page.getByPlaceholder('Search Model or Prototype')).toBeVisible({
    timeout: 10000,
  });
}

export type CreatedTestUser = {
  id: string;
  email: string;
  name: string;
};

export async function createTestUserViaApi(
  page: Page,
  opts?: { email?: string; password?: string; name?: string },
): Promise<CreatedTestUser> {
  const token = await getAuthToken(page);
  const email = opts?.email || `e2e${Date.now()}@example.com`;
  const password = opts?.password || TEST_USER.password;
  const name = opts?.name || TEST_USER.name;
  const res = await page.request.post(`${API_URL}/v2/users`, {
    data: { email, password, name },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to create user: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  const id = data?.id || data?._id;
  if (!id) {
    throw new Error(`Create user response missing id: ${JSON.stringify(data)}`);
  }
  return { id: String(id), email, name };
}

export async function deleteTestUserViaApi(page: Page, userId: string) {
  const token = await getAuthToken(page);
  const res = await page.request.delete(`${API_URL}/v2/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok() && res.status() !== 404) {
    throw new Error(`Failed to delete user: ${res.status()} ${await res.text()}`);
  }
}

export type FeatureRole = {
  id: string;
  name: string;
};

export async function fetchFeatureRolesViaApi(page: Page): Promise<FeatureRole[]> {
  const token = await getAuthToken(page);
  const res = await page.request.get(`${API_URL}/v2/permissions/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to fetch feature roles: ${res.status()} ${await res.text()}`);
  }
  const data = await res.json();
  return (Array.isArray(data) ? data : []).filter((f: { not_feature?: boolean }) => !f.not_feature);
}

export async function assignRoleToUserViaApi(page: Page, userId: string, roleId: string) {
  const token = await getAuthToken(page);
  const res = await page.request.post(`${API_URL}/v2/permissions`, {
    data: { user: userId, role: roleId },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to assign role: ${res.status()} ${await res.text()}`);
  }
}

export async function removeRoleFromUserViaApi(page: Page, userId: string, roleId: string) {
  const token = await getAuthToken(page);
  const res = await page.request.delete(`${API_URL}/v2/permissions`, {
    params: { user: userId, role: roleId },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok() && res.status() !== 404) {
    throw new Error(`Failed to remove role: ${res.status()} ${await res.text()}`);
  }
}

export async function addModelPermissionViaApi(
  page: Page,
  modelId: string,
  userId: string,
  role: 'model_contributor' | 'model_member',
  auth?: { email: string; password: string },
): Promise<void> {
  const token = auth
    ? await getTokenForUser(page, auth.email, auth.password)
    : await getAuthToken(page);
  const res = await page.request.post(`${API_URL}/v2/models/${modelId}/permissions`, {
    data: { role, userId },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to add model permission: ${res.status()} ${await res.text()}`);
  }
}

export async function removeModelPermissionViaApi(
  page: Page,
  modelId: string,
  userId: string,
  role: 'model_contributor' | 'model_member',
  auth?: { email: string; password: string },
): Promise<void> {
  const token = auth
    ? await getTokenForUser(page, auth.email, auth.password)
    : await getAuthToken(page);
  const res = await page.request.delete(`${API_URL}/v2/models/${modelId}/permissions`, {
    params: { userId, role },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok() && res.status() !== 404) {
    throw new Error(`Failed to remove model permission: ${res.status()} ${await res.text()}`);
  }
}

export async function deleteAssetViaApi(page: Page, assetId: string) {
  const token = await getAuthToken(page);
  const res = await page.request.delete(`${API_URL}/v2/assets/${assetId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok() && res.status() !== 404) {
    throw new Error(`Failed to delete asset: ${res.status()} ${await res.text()}`);
  }
}

export async function findMyPluginByNameViaApi(page: Page, name: string) {
  const token = await getAuthToken(page);
  const res = await page.request.get(`${API_URL}/v2/system/plugin/mine?limit=100&page=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    return null;
  }
  const data = await res.json();
  return (data?.results || []).find((p: { name: string }) => p.name === name) || null;
}

export async function configureHomePopularSection(
  page: Page,
  title = 'Popular Prototypes',
): Promise<void> {
  await setSiteConfigJson(page, 'CFG_HOME_CONTENT', [{ type: 'popular', title }]);
}

export async function configureHomeModelListSection(
  page: Page,
  title = 'Vehicle Models',
): Promise<void> {
  await setSiteConfigJson(page, 'CFG_HOME_CONTENT', [{ type: 'model-list', title }]);
}

export async function configureHomePrototypeListSection(
  page: Page,
  title = 'All Prototypes',
): Promise<void> {
  await setSiteConfigJson(page, 'CFG_HOME_CONTENT', [{ type: 'prototype-list', title }]);
}

export function getHomePrototypeListSection(page: Page, title = 'All Prototypes'): Locator {
  return page
    .locator('.da-page-home')
    .locator('h2', { hasText: title })
    .locator('xpath=ancestor::div[contains(@class,"container")][1]');
}

export async function gotoHomePrototypeList(page: Page, title = 'All Prototypes'): Promise<void> {
  const responsePromise = page
    .waitForResponse(
      (res) =>
        res.url().includes('/prototypes') &&
        res.request().method() === 'GET' &&
        res.ok(),
      { timeout: 20000 },
    )
    .catch(() => null);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 20000 });
  await responsePromise;
  await page.waitForTimeout(500);
}

export async function selectHomePrototypeCategory(
  page: Page,
  label: 'All' | 'My Prototypes',
): Promise<void> {
  const section = getHomePrototypeListSection(page);
  const responsePromise = page
    .waitForResponse(
      (res) =>
        res.url().includes('/prototypes') &&
        res.request().method() === 'GET' &&
        res.ok(),
      { timeout: 20000 },
    )
    .catch(() => null);
  await section.getByRole('button', { name: label, exact: true }).click();
  await responsePromise;
  await page.waitForTimeout(500);
}

export async function selectHomePrototypeSort(
  page: Page,
  option: string,
  title = 'All Prototypes',
): Promise<void> {
  const section = getHomePrototypeListSection(page, title);
  const sortButton = section.getByRole('button', {
    name: /Newest|Oldest|Name A-Z|Name Z-A|Last Viewed|First Viewed/,
  });
  await sortButton.click();
  await page
    .locator('ul')
    .locator('label')
    .filter({ has: page.getByText(option, { exact: true }) })
    .click();
  await page.waitForTimeout(1000);
}

export async function getVisibleHomePrototypeNames(
  page: Page,
  title = 'All Prototypes',
): Promise<string[]> {
  const section = getHomePrototypeListSection(page, title);
  const names = await section.locator('.prototype-grid-item-name').allTextContents();
  return names.map((n) => n.trim()).filter(Boolean);
}

export const HOME_PROTOTYPE_SORT_OPTIONS = [
  { label: 'Newest', param: 'newest' },
  { label: 'Oldest', param: 'oldest' },
  { label: 'Name A-Z', param: 'name-az' },
  { label: 'Name Z-A', param: 'name-za' },
  { label: 'Last Viewed', param: 'last-viewed' },
  { label: 'First Viewed', param: 'first-viewed' },
] as const;

export async function setPrototypeLastViewedMap(
  page: Page,
  entries: Record<string, number>,
): Promise<void> {
  await page.evaluate((map) => {
    localStorage.setItem('prototype_last_viewed', JSON.stringify(map));
  }, entries);
}

export async function assertHomePrototypeOrder(
  page: Page,
  firstName: string,
  secondName: string,
  title = 'All Prototypes',
): Promise<void> {
  await ensureHomePrototypeVisible(page, firstName, title);
  await ensureHomePrototypeVisible(page, secondName, title);
  const names = await getVisibleHomePrototypeNames(page, title);
  expect(names.indexOf(firstName)).toBeGreaterThanOrEqual(0);
  expect(names.indexOf(secondName)).toBeGreaterThanOrEqual(0);
  expect(names.indexOf(firstName)).toBeLessThan(names.indexOf(secondName));
}

export async function gotoHomeModelList(page: Page, title = 'Vehicle Models'): Promise<void> {
  const responsePromise = page
    .waitForResponse(
      (res) =>
        (res.url().includes('/models') || res.url().includes('/model')) &&
        res.request().method() === 'GET' &&
        res.ok(),
      { timeout: 20000 },
    )
    .catch(() => null);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 20000 });
  await responsePromise;
  await page.waitForTimeout(500);
}

export function getHomeModelListSection(page: Page, title = 'Vehicle Models'): Locator {
  return page
    .locator('.da-page-home')
    .locator('h2', { hasText: title })
    .locator('xpath=ancestor::div[contains(@class,"container")][1]');
}

export async function selectHomeModelCategory(
  page: Page,
  label: 'All' | 'My Models' | 'My Contributions' | 'Public',
  title = 'Vehicle Models',
): Promise<void> {
  const section = getHomeModelListSection(page, title);
  const desktopBtn = section.getByRole('button', { name: label, exact: true });
  if (await desktopBtn.isVisible().catch(() => false)) {
    await desktopBtn.click();
  } else {
    await section.getByRole('button').filter({ hasText: /All|My Models|My Contributions|Public/ }).first().click();
    await page.getByRole('menuitem', { name: label }).click();
  }
  await page.waitForTimeout(1500);
}

export async function selectHomeModelSort(
  page: Page,
  option: string,
  title = 'Vehicle Models',
): Promise<void> {
  const section = getHomeModelListSection(page, title);
  await section
    .getByRole('button', { name: /Last viewed|First viewed|Newest|Oldest|Name A-Z|Name Z-A/ })
    .click();
  await page.getByRole('menuitem', { name: option }).click();
  await page.waitForTimeout(1500);
}

export async function getVisibleHomeModelNames(
  page: Page,
  title = 'Vehicle Models',
): Promise<string[]> {
  const section = getHomeModelListSection(page, title);
  const names = await section.locator('h3.font-semibold').allTextContents();
  return names.map((n) => n.trim()).filter(Boolean);
}

export const HOME_MODEL_SORT_OPTIONS = [
  { label: 'Last viewed', param: 'last-viewed' },
  { label: 'First viewed', param: 'first-viewed' },
  { label: 'Newest', param: 'newest' },
  { label: 'Oldest', param: 'oldest' },
  { label: 'Name A-Z', param: 'name-az' },
  { label: 'Name Z-A', param: 'name-za' },
] as const;

export async function setModelLastViewedMap(
  page: Page,
  entries: Record<string, number>,
): Promise<void> {
  await page.evaluate((map) => {
    localStorage.setItem('model_last_viewed', JSON.stringify(map));
  }, entries);
}

export async function assertHomeModelOrder(
  page: Page,
  firstName: string,
  secondName: string,
  title = 'Vehicle Models',
): Promise<void> {
  await ensureHomeModelVisible(page, firstName, title);
  await ensureHomeModelVisible(page, secondName, title);
  const names = await getVisibleHomeModelNames(page, title);
  expect(names.indexOf(firstName)).toBeGreaterThanOrEqual(0);
  expect(names.indexOf(secondName)).toBeGreaterThanOrEqual(0);
  expect(names.indexOf(firstName)).toBeLessThan(names.indexOf(secondName));
}

export async function ensureHomeModelVisible(
  page: Page,
  modelName: string,
  title = 'Vehicle Models',
): Promise<void> {
  const section = getHomeModelListSection(page, title);
  const card = section.locator(`[aria-label="${modelName}"]`);

  for (let i = 0; i < 15; i++) {
    if (await card.isVisible().catch(() => false)) {
      return;
    }
    const loadMore = section.getByRole('button', { name: /Load More Models/i });
    if (!(await loadMore.isVisible().catch(() => false))) {
      break;
    }
    await loadMore.click();
    await page.waitForTimeout(500);
  }

  await expect(card).toBeVisible({ timeout: 10000 });
}

export async function ensureHomePrototypeVisible(
  page: Page,
  protoName: string,
  title = 'All Prototypes',
): Promise<void> {
  const section = getHomePrototypeListSection(page, title);
  const card = section.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`).first();

  for (let i = 0; i < 20; i++) {
    if (await card.isVisible().catch(() => false)) {
      return;
    }
    const rightBtn = section.locator('div.relative > button').last();
    if (!(await rightBtn.isEnabled().catch(() => false))) {
      break;
    }
    await rightBtn.click();
    await page.waitForTimeout(500);
  }

  await expect(card).toBeVisible({ timeout: 10000 });
}

export async function waitForModelInHomeList(
  page: Page,
  modelName: string,
  title = 'Vehicle Models',
): Promise<void> {
  await gotoHomeModelList(page, title);
  await selectHomeModelCategory(page, 'My Models', title);
  const section = getHomeModelListSection(page, title);
  await expect(section.locator(`[aria-label="${modelName}"]`)).toBeVisible({ timeout: 20000 });
}

export async function waitForPrototypeInHomeList(
  page: Page,
  protoName: string,
  title = 'All Prototypes',
): Promise<void> {
  await gotoHomePrototypeList(page, title);
  await selectHomePrototypeCategory(page, 'My Prototypes');
  const section = getHomePrototypeListSection(page, title);
  await expect(
    section.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`).first(),
  ).toBeVisible({ timeout: 20000 });
}

export async function renameModelViaHomeContextMenu(
  page: Page,
  oldName: string,
  newName: string,
  title = 'Vehicle Models',
): Promise<void> {
  const section = getHomeModelListSection(page, title);
  await openModelContextMenu(page, oldName, section);
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  const dialog = page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: 'Rename Model' }),
  });
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await dialog.locator('input').fill(newName);
  await dialog.getByRole('button', { name: 'Save' }).click();
  await page.waitForTimeout(2000);
}

export function getModelCard(page: Page, modelName: string, section?: Locator): Locator {
  const root = section ?? page;
  return root.locator(`[aria-label="${modelName}"]`).first();
}

export function getPrototypeCard(page: Page, protoName: string): Locator {
  return page.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`).first();
}

export async function openModelContextMenu(
  page: Page,
  modelName: string,
  section?: Locator,
): Promise<void> {
  const card = getModelCard(page, modelName, section);
  await expect(card).toBeVisible({ timeout: 20000 });
  await card.scrollIntoViewIfNeeded();
  await card.click({ button: 'right', force: true });
  await expect(page.getByRole('menuitem').first()).toBeVisible({ timeout: 10000 });
}

export async function openPrototypeContextMenu(page: Page, protoName: string): Promise<void> {
  const card = getPrototypeCard(page, protoName);
  await expect(card).toBeVisible({ timeout: 20000 });
  await card.scrollIntoViewIfNeeded();
  await card.click({ button: 'right', force: true });
  await expect(page.getByRole('menuitem').first()).toBeVisible({ timeout: 10000 });
}

export async function downloadViaContextMenuItem(
  page: Page,
  menuLabel: string,
): Promise<string> {
  const downloadDir = join(tmpdir(), `autowrx-e2e-${Date.now()}`);
  await mkdir(downloadDir, { recursive: true });

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    page.getByRole('menuitem', { name: menuLabel }).click(),
  ]);

  const suggestedName = download.suggestedFilename();
  const savePath = join(downloadDir, suggestedName);
  await download.saveAs(savePath);
  return savePath;
}

export async function confirmNameDialog(page: Page, name: string): Promise<void> {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 10000 });
  const input = dialog.locator('input[data-slot="input"], input').first();
  await input.fill(name);
  await dialog.getByRole('button', { name: 'Confirm' }).click();
  await page.waitForTimeout(2000);
}

export async function deleteModelViaApi(page: Page, modelId: string): Promise<void> {
  const token = await getAuthToken(page);
  const res = await page.request.delete(`${API_URL}/v2/models/${modelId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok() && res.status() !== 404) {
    throw new Error(`Failed to delete model: ${res.status()} ${await res.text()}`);
  }
}

export async function deletePrototypeViaApi(page: Page, prototypeId: string): Promise<void> {
  const token = await getAuthToken(page);
  const res = await page.request.delete(`${API_URL}/v2/prototypes/${prototypeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok() && res.status() !== 404) {
    throw new Error(`Failed to delete prototype: ${res.status()} ${await res.text()}`);
  }
}

export async function importModelZipOnHome(page: Page, zipPath: string): Promise<void> {
  const fileChooserPromise = page.waitForEvent('filechooser');
  const section = getHomeModelListSection(page);
  await section.getByRole('button', { name: /Import Model/i }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(zipPath);
  await page.waitForURL(/\/model\/.+/, { timeout: 120000 });
}

export async function importPrototypeZip(
  page: Page,
  zipPath: string,
  protoName?: string,
  modelId?: string,
): Promise<void> {
  const importButton = page.getByRole('button', { name: /Import Prototype/i }).first();
  await expect(importButton).toBeVisible({ timeout: 15000 });

  const fileChooserPromise = page.waitForEvent('filechooser');
  await importButton.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(zipPath);

  const dialog = page.getByRole('dialog', { name: /Import Prototype/i });
  await expect(dialog).toBeVisible({ timeout: 30000 });
  await expect(dialog.getByRole('button', { name: 'Import' })).toBeEnabled({ timeout: 60000 });

  if (protoName) {
    const nameInput = dialog.locator('input').first();
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(protoName);
  }

  await dialog.getByRole('button', { name: 'Import' }).click();
  await page.waitForURL(/\/library\/prototype\//, { timeout: 120000 }).catch(() => {});
  await expect(dialog).toBeHidden({ timeout: 120000 });

  if (modelId) {
    await page.goto(`/model/${modelId}/library/list`);
    await page.waitForTimeout(2000);
  }
}

export async function removeTempDownloadDir(dirPath: string): Promise<void> {
  try {
    await rm(dirPath, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup for temp download directories.
  }
}

export const DEFAULT_MODEL_IMAGE = '/imgs/default-model-image.png';
export const DEFAULT_PROTOTYPE_IMAGE = '/imgs/default_prototype_cover.jpg';

export async function setModelImageViaApi(
  page: Page,
  modelId: string,
  imageUrl: string,
): Promise<void> {
  const token = await getAuthToken(page);
  const res = await page.request.patch(`${API_URL}/v2/models/${modelId}`, {
    data: { model_home_image_file: imageUrl },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to set model image: ${res.status()} ${await res.text()}`);
  }
}

export async function setPrototypeImageViaApi(
  page: Page,
  prototypeId: string,
  imageUrl: string,
): Promise<void> {
  const token = await getAuthToken(page);
  const res = await page.request.patch(`${API_URL}/v2/prototypes/${prototypeId}`, {
    data: { image_file: imageUrl },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to set prototype image: ${res.status()} ${await res.text()}`);
  }
}

export async function routeBrokenImageUrls(
  page: Page,
  pattern = 'e2e-broken-image',
): Promise<() => Promise<void>> {
  const handler = async (route: { request: () => { url: () => string }; abort: (errorCode?: string) => Promise<void>; continue: () => Promise<void> }) => {
    if (route.request().url().includes(pattern)) {
      await route.abort('failed');
      return;
    }
    await route.continue();
  };
  await page.route('**/*', handler);
  return () => page.unroute('**/*', handler);
}

export async function expectCardImageFallback(
  card: Locator,
  expectedFallbackSrc: string,
): Promise<void> {
  const img = card.locator('img').first();
  await expect(img).toHaveAttribute('data-fallback-applied', 'true', { timeout: 15000 });
  await expect(img).toHaveAttribute(
    'src',
    new RegExp(expectedFallbackSrc.replace(/\//g, '\\/')),
  );
}

export async function checkLayoutAnomalies(page: Page, testName: string) {
  const overlapping = await page.evaluate(() => {
    const panel = document.querySelector('[data-id="runtime-control-panel"]');
    const panelRect = panel?.getBoundingClientRect();
    const isPanelCollapsed = panelRect ? panelRect.width <= 60 : false;

    const isEffectivelyHidden = (el: Element): boolean => {
      if (el.closest('[aria-hidden="true"]')) return true;

      let node: Element | null = el;
      while (node) {
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return true;
        }
        if (
          node !== el &&
          node.getAttribute('data-state') === 'closed' &&
          ['menu', 'dialog', 'listbox', 'tooltip'].includes(node.getAttribute('role') || '')
        ) {
          return true;
        }
        node = node.parentElement;
      }

      const rects = el.getClientRects();
      if (rects.length === 0) return true;

      let area = 0;
      for (const rect of rects) {
        area += rect.width * rect.height;
      }
      return area === 0;
    };

    const elements = document.querySelectorAll('button, a, input:not([type="hidden"])');
    const issues: string[] = [];
    elements.forEach((el) => {
      const input = el as HTMLInputElement;
      if (input.type === 'hidden') return;

      if (isPanelCollapsed && panel?.contains(el)) return;
      if (isEffectivelyHidden(el)) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        const label = el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 30) || '';
        issues.push(`Zero-size visible element: ${el.tagName} "${label}"`);
      }
    });
    return issues;
  });

  if (overlapping.length > 0) {
    await saveScreenshot(page, `layout-anomaly-${testName}`);
    console.warn('⚠️ Layout anomalies detected:', overlapping);
  }
  return overlapping;
}
