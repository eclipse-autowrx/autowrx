import { test, expect, Page } from '@playwright/test';
import { API_URL, loginAsAdmin, getAdminToken } from './helpers';

// Legacy = site config rows the app no longer defines. They must be hidden in
// each tab and removed by that tab's "Restore default".
const SECTIONS = [
  { section: 'public', category: 'general', restoreText: 'Restore all public configs' },
  { section: 'auth', category: 'auth', restoreText: 'Restore all auth configs' },
  { section: 'model_prototype', category: 'model_prototype', restoreText: 'Restore all Model & Prototype configs' },
  { section: 'genai', category: 'genai', restoreText: 'Restore all GenAI configs' },
];

const legacyKey = (section: string, stamp: number) => `E2E_LEGACY_${section.toUpperCase()}_${stamp}`;

async function createLegacyConfig(page: Page, key: string, category: string) {
  const token = await getAdminToken(page);
  const res = await page.request.post(`${API_URL}/v2/site-config`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { key, scope: 'site', value: 'legacy', valueType: 'string', secret: false, category },
  });
  expect(res.ok(), `create ${key}: ${res.status()}`).toBeTruthy();
}

async function configExists(page: Page, key: string): Promise<boolean> {
  const token = await getAdminToken(page);
  const res = await page.request.get(`${API_URL}/v2/site-config/key/${key}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.status() === 200;
}

async function deleteConfigQuietly(page: Page, key: string) {
  const token = await getAdminToken(page);
  await page.request.delete(`${API_URL}/v2/site-config/key/${key}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

test.describe('Site Config - legacy cleanup', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const { section, category, restoreText } of SECTIONS) {
    test(`${section}: legacy config is hidden and removed by Restore default`, async ({ page }) => {
      const key = legacyKey(section, Date.now());
      await createLegacyConfig(page, key, category);

      try {
        await page.goto(`/admin/site-config?section=${section}`);
        await expect(page.getByRole('button', { name: 'Restore default' })).toBeVisible();
        await expect(page.getByText(key)).toHaveCount(0);
        expect(await configExists(page, key)).toBe(true);

        page.once('dialog', async (dialog) => {
          expect(dialog.message()).toContain(restoreText);
          expect(dialog.message()).toContain('legacy');
          await dialog.accept();
        });
        await page.getByRole('button', { name: 'Restore default' }).click();

        await expect.poll(() => configExists(page, key), { timeout: 15000 }).toBe(false);
      } finally {
        await deleteConfigQuietly(page, key);
      }
    });
  }

  test('secret configs are never pruned by Restore default', async ({ page }) => {
    const token = await getAdminToken(page);
    const key = `E2E_LEGACY_SECRET_${Date.now()}`;
    const res = await page.request.post(`${API_URL}/v2/site-config`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { key, scope: 'site', value: 'secret', valueType: 'string', secret: true },
    });
    expect(res.ok()).toBeTruthy();

    try {
      await page.goto(`/admin/site-config?section=public`);
      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: 'Restore default' }).click();
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      expect(await configExists(page, key)).toBe(true);
    } finally {
      await deleteConfigQuietly(page, key);
    }
  });
});
