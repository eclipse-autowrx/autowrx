import { test, expect } from '@playwright/test';
import { loginAsAdmin, saveScreenshot } from './helpers';

const PROTO_NAME = `AgentProto_${Date.now()}`;

// Helper: go to first model's library/prototype page, return modelId
async function goToFirstModelLibrary(page: any) {
  await page.goto('/model');
  await page.waitForTimeout(3000);

  const firstModel = page.locator('a[href*="/model/"]').first();
  await expect(firstModel).toBeVisible({ timeout: 8000 });
  const href = await firstModel.getAttribute('href');
  const modelId = href?.split('/model/')[1]?.split('/')[0];
  await page.goto(`/model/${modelId}/library/prototype`);
  await page.waitForTimeout(2500);
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
  await expect(nameInput).toBeVisible({ timeout: 5000 });
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

    await expect(page.locator('[data-id="prototype-name-input"]')).toBeVisible({ timeout: 5000 });
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
    await expect(nameInput).toBeVisible({ timeout: 5000 });
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
    await page.goto(`/model/${modelId}/library/prototype`);
    await page.waitForTimeout(2500);
    await saveScreenshot(page, 'proto-library-read');

    // Prototype should appear in the list
    const protoCard = page.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`).first();
    await expect(protoCard).toBeVisible({ timeout: 8000 });
    console.log('Prototype visible in library ✅');
  });

  test('READ: prototype detail page loads', async ({ page }) => {
    await loginAsAdmin(page);

    // Create then click into detail
    const protoName = `Detail_${Date.now()}`;
    const { modelId } = await createTestPrototype(page, protoName);

    // Go to library and click the prototype
    await page.goto(`/model/${modelId}/library/prototype`);
    await page.waitForTimeout(2500);

    const protoCard = page.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`).first();
    await expect(protoCard).toBeVisible({ timeout: 8000 });
    await protoCard.click();
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'proto-detail');

    // Should be on prototype detail
    const url = page.url();
    const isOnDetail = url.includes('/prototype/') || url.includes('prototype_id=');
    expect(isOnDetail).toBeTruthy();
  });

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  test('UPDATE: rename a prototype', async ({ page }) => {
    await loginAsAdmin(page);

    const protoName = `Rename_${Date.now()}`;
    const renamedName = `${protoName}_new`;
    const { modelId } = await createTestPrototype(page, protoName);

    // Go back to library
    await page.goto(`/model/${modelId}/library/prototype`);
    await page.waitForTimeout(2500);

    // Find our prototype card
    const protoCard = page.locator(`[data-id^="prototype-item-"]:has-text("${protoName}")`).first();
    await expect(protoCard).toBeVisible({ timeout: 8000 });

    // Hover to reveal actions
    await protoCard.hover();
    await page.waitForTimeout(500);
    await saveScreenshot(page, 'proto-hover');

    // Click last button (3-dot / actions menu)
    const menuBtn = protoCard.locator('button').last();
    await menuBtn.click();
    await page.waitForTimeout(800);
    await saveScreenshot(page, 'proto-context-menu');

    // Click Rename
    const renameItem = page.locator('[role="menuitem"]:has-text("Rename"), button:has-text("Rename")').first();
    await expect(renameItem).toBeVisible({ timeout: 5000 });
    await renameItem.click();
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'proto-rename-dialog');

    // Clear and fill new name
    const renameInput = page.locator('input').filter({ hasText: '' }).first();
    await renameInput.clear();
    await renameInput.fill(renamedName);
    await page.waitForTimeout(300);

    // Confirm
    const confirmBtn = page.locator('button:has-text("Save"), button:has-text("Confirm"), button:has-text("Rename")').first();
    await confirmBtn.click();
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'proto-rename-result');

    // New name should be visible
    const renamedCard = page.locator(`text=${renamedName}`).first();
    await expect(renamedCard).toBeVisible({ timeout: 5000 });
    console.log('Prototype renamed successfully ✅');
  });

  // ─── DELETE ────────────────────────────────────────────────────────────────

  test('DELETE: delete a prototype', async ({ page }) => {
    await loginAsAdmin(page);

    const deleteName = `DELETE_PROTO_${Date.now()}`;
    const { modelId } = await createTestPrototype(page, deleteName);

    // Go back to library
    await page.goto(`/model/${modelId}/library/prototype`);
    await page.waitForTimeout(2500);

    // Find our prototype
    const protoCard = page.locator(`[data-id^="prototype-item-"]:has-text("${deleteName}")`).first();
    await expect(protoCard).toBeVisible({ timeout: 8000 });

    // Hover → open menu → Delete
    await protoCard.hover();
    await page.waitForTimeout(400);
    const menuBtn = protoCard.locator('button').last();
    await menuBtn.click();
    await page.waitForTimeout(800);
    await saveScreenshot(page, 'proto-delete-menu');

    const deleteItem = page.locator('[role="menuitem"]:has-text("Delete")').first();
    await expect(deleteItem).toBeVisible({ timeout: 5000 });
    await deleteItem.click();
    await page.waitForTimeout(1000);
    await saveScreenshot(page, 'proto-delete-confirm');

    // Confirm delete
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Delete")').last();
    await confirmBtn.click();
    await page.waitForTimeout(2500);
    await saveScreenshot(page, 'proto-after-delete');

    // Prototype should be gone
    await page.goto(`/model/${modelId}/library/prototype`);
    await page.waitForTimeout(2000);
    const stillExists = await page.locator(`text=${deleteName}`).count();
    expect(stillExists).toBe(0);
    console.log('Prototype deleted successfully ✅');
  });

});
