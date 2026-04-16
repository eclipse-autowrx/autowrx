import { test, expect } from '@playwright/test';
import { loginAsAdmin, saveScreenshot, ADMIN, API_URL } from './helpers';

const PROTO_NAME = `AgentProto_${Date.now()}`;

// Helper: go to first model's library/prototype page, return modelId
async function goToFirstModelLibrary(page: any) {
  await page.goto('/model');
  await page.waitForTimeout(3000);

  const firstModel = page.locator('a[href*="/model/"]').first();
  await expect(firstModel).toBeVisible({ timeout: 20000 });
  const href = await firstModel.getAttribute('href');
  const modelId = href?.split('/model/')[1]?.split('/')[0];
  // Try /library/list first (new route), fallback /library/list (old route)
  await page.goto(`/model/${modelId}/library/list`);
  await page.waitForTimeout(4000);
  return modelId;
}

// Helper: create a prototype inside the first model, return { modelId, protoName }
async function createTestPrototype(page: any, name: string) {
  const modelId = await goToFirstModelLibrary(page);

  // Click "Create" button in library
  await page.locator('[data-id="btn-create-new-prototype"]').click();
  await page.waitForTimeout(1500);

  // Fill name
  const nameInput = page.locator('[data-id="prototype-name-input"]').first();
  await expect(nameInput).toBeVisible({ timeout: 15000 });
  await nameInput.fill(name);
  await page.waitForTimeout(300);

  // Submit (button text: "Confirm" in dialog context)
  const submitBtn = page.locator(
    'button:has-text("Confirm"), button:has-text("Create Prototype"), [data-id="btn-create-prototype"]'
  ).last();
  await submitBtn.click();
  await page.waitForTimeout(3000);

  return { modelId };
}

test.describe('Prototypes - CRUD', () => {

  // ─── CREATE ────────────────────────────────────────────────────────────────

  test('CREATE: go to new prototype page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/new-prototype');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'proto-new-page');

    await expect(page.locator('[data-id="prototype-name-input"]')).toBeVisible({ timeout: 15000 });
  });

  test('CREATE: create prototype from model library', async ({ page }) => {
    await loginAsAdmin(page);
    await goToFirstModelLibrary(page);
    await saveScreenshot(page, 'proto-library-before-create');

    // Click "Create" button
    await page.locator('[data-id="btn-create-new-prototype"]').click();
    await page.waitForTimeout(1500);
    await saveScreenshot(page, 'proto-create-dialog');

    // Fill name
    const nameInput = page.locator('[data-id="prototype-name-input"]').first();
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(PROTO_NAME);
    await page.waitForTimeout(300);
    await saveScreenshot(page, 'proto-create-filled');

    // Submit
    const submitBtn = page.locator(
      'button:has-text("Confirm"), button:has-text("Create Prototype"), [data-id="btn-create-prototype"]'
    ).last();
    await submitBtn.click();
    await page.waitForTimeout(4000);
    await saveScreenshot(page, 'proto-create-result');

    // URL should contain prototype_id or navigate to prototype detail
    const url = page.url();
    const hasProtoId = url.includes('prototype_id=') || url.includes('/prototype/');
    expect(hasProtoId).toBeTruthy();
    console.log('Created prototype, URL:', url);
  });

  // ─── READ ──────────────────────────────────────────────────────────────────

  test('READ: prototype library shows created prototype', async ({ page }) => {
    await loginAsAdmin(page);

    // Create first then read
    const protoName = `Read_${Date.now()}`;
    const { modelId } = await createTestPrototype(page, protoName);

    // Go back to library
    await page.goto(`/model/${modelId}/library/list`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('Library URL:', page.url());
    // Search for the prototype  
    const searchInput = page.locator('input[placeholder="Search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.click();
    await searchInput.fill(protoName);
    console.log('Searched for:', protoName);
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'proto-library-read');

    // Prototype should appear in the list
    const protoCard = page.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`).first();
    await expect(protoCard).toBeVisible({ timeout: 30000 });
    console.log('Prototype visible in library ✅');
  });

  test('READ: prototype detail page loads', async ({ page }) => {
    await loginAsAdmin(page);

    // Create then click into detail
    const protoName = `Detail_${Date.now()}`;
    const { modelId } = await createTestPrototype(page, protoName);

    // Go to library and click the prototype
    await page.goto(`/model/${modelId}/library/list`);
    await page.waitForTimeout(4000);

    const protoCard = page.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`).first();
    await expect(protoCard).toBeVisible({ timeout: 30000 });
    await protoCard.click();
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'proto-detail');

    // Should be on prototype detail
    const url = page.url();
    const isOnDetail = url.includes('/prototype/') || url.includes('prototype_id=');
    expect(isOnDetail).toBeTruthy();
  });

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  test('UPDATE: rename a prototype via API', async ({ page }) => {
    await loginAsAdmin(page);

    const protoName = `Rename_${Date.now()}`;
    const renamedName = `${protoName}_renamed`;
    const { modelId } = await createTestPrototype(page, protoName);

    // Go to library, find prototype id
    await page.goto(`/model/${modelId}/library/list`);
    await page.waitForTimeout(4000);

    const protoCard = page.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`).first();
    await expect(protoCard).toBeVisible({ timeout: 30000 });
    await saveScreenshot(page, 'proto-before-rename');

    const dataId = await protoCard.getAttribute('data-id');
    const protoId = dataId?.replace('prototype-item-', '');
    console.log('Prototype ID:', protoId);

    // Rename via API
    const loginRes = await page.request.post(`${API_URL}/v2/auth/login`, {
      data: { email: ADMIN.email, password: ADMIN.password }
    });
    const loginData = await loginRes.json();
    const token = loginData?.tokens?.access?.token;

    const renameRes = await page.request.patch(`${API_URL}/v2/prototypes/${protoId}`, {
      data: { name: renamedName },
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Rename API status:', renameRes.status());

    // Refresh and verify new name shows in UI
    await page.reload();
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'proto-after-rename');

    const renamedCard = page.locator(`[data-id="prototype-item-${protoId}"]`).first();
    await expect(renamedCard).toBeVisible({ timeout: 20000 });
    const cardText = await renamedCard.textContent();
    expect(cardText).toContain(renamedName);
    console.log('Prototype renamed successfully via API ✅');
  });

  // ─── DELETE ────────────────────────────────────────────────────────────────

  test('DELETE: delete a prototype via API', async ({ page }) => {
    await loginAsAdmin(page);

    const deleteName = `DELETE_PROTO_${Date.now()}`;
    const { modelId } = await createTestPrototype(page, deleteName);

    // Go to library, find prototype
    await page.goto(`/model/${modelId}/library/list`);
    await page.waitForTimeout(2000);
    const searchBox4 = page.locator('input[placeholder="Search"]').first();
    await searchBox4.click();
    await searchBox4.fill(deleteName);
    await page.waitForTimeout(2000);

    const protoCard = page.locator(`[data-id^="prototype-item-"]:has-text("${deleteName}")`).first();
    await expect(protoCard).toBeVisible({ timeout: 30000 });
    await saveScreenshot(page, 'proto-before-delete');

    const dataId = await protoCard.getAttribute('data-id');
    const protoId = dataId?.replace('prototype-item-', '');
    console.log('Deleting prototype ID:', protoId);

    // Delete via API
    const loginRes = await page.request.post(`${API_URL}/v2/auth/login`, {
      data: { email: ADMIN.email, password: ADMIN.password }
    });
    const loginData = await loginRes.json();
    const token = loginData?.tokens?.access?.token;

    const deleteRes = await page.request.delete(`${API_URL}/v2/prototypes/${protoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Delete API status:', deleteRes.status());

    // Refresh and verify gone from UI
    await page.reload();
    await page.waitForTimeout(3000);
    await saveScreenshot(page, 'proto-after-delete');

    const stillExists = await page.locator(`[data-id="prototype-item-${protoId}"]`).count();
    expect(stillExists).toBe(0);
    console.log('Prototype deleted, no longer in UI ✅');
  });

});
