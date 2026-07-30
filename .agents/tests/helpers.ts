import { Locator, Page, expect } from '@playwright/test';

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

export const LIBRARY_SEARCH_SELECTOR = 'input[placeholder="Search prototypes"]';

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.waitForTimeout(1500);

  // Open login modal
  const signInBtn = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
  await signInBtn.click();
  await page.waitForTimeout(1000);

  await page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  // Press Enter to submit (more reliable than clicking button with overlay)
  await page.locator('input[type="password"]').first().press('Enter');
  await page.waitForTimeout(2500);
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
  const loginRes = await page.request.post(`${API_URL}/v2/auth/login`, {
    data: { email: ADMIN.email, password: ADMIN.password },
  });
  const loginData = await loginRes.json();
  const token = loginData?.tokens?.access?.token;
  if (!token) {
    throw new Error(`Failed to get auth token: ${loginRes.status()}`);
  }
  return token;
}

export async function createTestModelViaApi(
  page: Page,
  name: string,
  visibility: 'public' | 'private',
): Promise<string> {
  const token = await getAuthToken(page);
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
  visibility: 'public' | 'private',
) {
  const token = await getAuthToken(page);
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
  await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/view`);
  await page.waitForTimeout(3000);
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
  await editBtn.scrollIntoViewIfNeeded();
  await editBtn.click();
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

export async function expectPrototypeInPopular(page: Page, name: string, visible: boolean) {
  await page.goto('/');
  await page.waitForTimeout(4000);

  const section = getPopularSection(page);
  const card = section.locator('.prototype-grid-item-name', { hasText: name });

  if (visible) {
    await expect(section).toBeVisible({ timeout: 10000 });
    await expect(card).toBeVisible({ timeout: 15000 });
  } else {
    await expect(card).toHaveCount(0, { timeout: 10000 });
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

export async function setPrototypeCodeViaApi(page: Page, prototypeId: string, code: string) {
  const token = await getAuthToken(page);
  const res = await page.request.patch(`${API_URL}/v2/prototypes/${prototypeId}`, {
    data: { code },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`Failed to update prototype code: ${res.status()} ${await res.text()}`);
  }
}

export async function goToPrototypeCodeTab(page: Page, modelId: string, prototypeId: string) {
  await page.goto(`/model/${modelId}/library/prototype/${prototypeId}/code`);
  await page.waitForTimeout(4000);
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

export async function waitForRuntimeReady(page: Page, timeoutMs = 30000) {
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

  await expandRuntimePanel(page);
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

export async function checkLayoutAnomalies(page: Page, testName: string) {
  const overlapping = await page.evaluate(() => {
    const panel = document.querySelector('[data-id="runtime-control-panel"]');
    const panelRect = panel?.getBoundingClientRect();
    const isPanelCollapsed = panelRect ? panelRect.width <= 60 : false;

    const elements = document.querySelectorAll('button, a, input:not([type="hidden"])');
    const issues: string[] = [];
    elements.forEach((el) => {
      const input = el as HTMLInputElement;
      if (input.type === 'hidden') return;

      if (isPanelCollapsed && panel?.contains(el)) return;

      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        issues.push(`Zero-size visible element: ${el.tagName} "${el.textContent?.slice(0, 30)}"`);
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
