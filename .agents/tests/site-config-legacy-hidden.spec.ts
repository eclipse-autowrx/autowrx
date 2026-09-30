import { test, expect, Page } from '@playwright/test';
import { API_URL, loginAsAdmin, getAdminToken } from './helpers';

// Legacy = site config rows the app no longer defines. They stay in the DB but
// must not be listed in the tabs that read by category.
const SECTIONS = [
  { section: 'auth', category: 'auth', supportedKey: 'PUBLIC_VIEWING' },
  { section: 'model_prototype', category: 'model_prototype', supportedKey: 'HIDE_MODEL_PAGE' },
  { section: 'genai', category: 'genai', supportedKey: 'GENAI_MARKETPLACE_URL' },
];

async function createConfig(page: Page, key: string, category: string) {
  const token = await getAdminToken(page);
  const res = await page.request.post(`${API_URL}/v2/site-config`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { key, scope: 'site', value: 'legacy', valueType: 'string', secret: false, category },
  });
  expect(res.ok(), `create ${key}: ${res.status()}`).toBeTruthy();
}

async function deleteConfigQuietly(page: Page, key: string) {
  const token = await getAdminToken(page);
  await page.request.delete(`${API_URL}/v2/site-config/key/${key}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

test.describe('Site Config - legacy keys are hidden', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const { section, category, supportedKey } of SECTIONS) {
    test(`${section}: unsupported key is hidden, supported key is listed`, async ({ page }) => {
      const key = `E2E_LEGACY_${section.toUpperCase()}_${Date.now()}`;
      await createConfig(page, key, category);

      try {
        await page.goto(`/admin/site-config?section=${section}`);
        await expect(page.getByText(supportedKey, { exact: true }).first()).toBeVisible({
          timeout: 15000,
        });
        await expect(page.getByText(key)).toHaveCount(0);
      } finally {
        await deleteConfigQuietly(page, key);
      }
    });
  }
});
