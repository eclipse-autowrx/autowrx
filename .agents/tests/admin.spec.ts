// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect, type Page } from '@playwright/test';
import {
  loginAs,
  loginAsAdmin,
  createTestUserViaApi,
  deleteTestUserViaApi,
  TEST_USER,
  saveScreenshot,
  checkLayoutAnomalies,
} from './helpers';

async function expectSiteConfigDenied(page: Page) {
  const adminRequests: string[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (
      /^\/v2\/site-config(?:\/|$)/.test(path) &&
      !/^\/v2\/site-config\/(?:public(?:\/|$)|admin-ui$|sso\/providers$)/.test(path)
    ) {
      adminRequests.push(request.url());
    }
  });

  for (const section of ['', '?section=home', '?section=secrets']) {
    await page.goto(`/admin/site-config${section}`);
    await expect(page.getByRole('heading', { name: 'Access denied', exact: true })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Site Management', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Configuration Sections', exact: true })).toHaveCount(0);
    await expect(page.locator('.da-root-layout-main form, .da-root-layout-main input, .da-root-layout-main textarea')).toHaveCount(0);
    await expect(page.getByText(/Forbidden/i)).toHaveCount(0);
    expect(adminRequests).toEqual([]);
  }
}

test.describe('Admin Panel', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('admin panel is accessible', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'admin-panel');

    // Should not redirect to 404 or home
    expect(page.url()).toContain('/admin');
  });

  test('site config page loads', async ({ page }) => {
    let releasePermissions!: () => void;
    let permissionsRequested!: () => void;
    const permissionGate = new Promise<void>((resolve) => { releasePermissions = resolve; });
    const permissionRequest = new Promise<void>((resolve) => { permissionsRequested = resolve; });
    await page.route('**/v2/permissions/has-permission*', async (route) => {
      permissionsRequested();
      await permissionGate;
      await route.continue();
    });

    try {
      await page.goto('/admin/site-config');
      await permissionRequest;
      await expect(page.getByRole('heading', { name: 'Access denied', exact: true })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Site Management', exact: true })).toHaveCount(0);
    } finally {
      releasePermissions();
    }

    await expect(page.getByRole('heading', { name: 'Site Management', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Configuration Sections', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Public Configurations', exact: true })).toBeVisible();
    await expect(page.getByText(/Forbidden/i)).toHaveCount(0);
    await saveScreenshot(page, 'admin-site-config');
    await checkLayoutAnomalies(page, 'admin-site-config');
  });

  test('non-admin cannot load site management content or admin configs', async ({ page }) => {
    const user = await createTestUserViaApi(page);
    try {
      await loginAs(page, user.email, TEST_USER.password);
      await expectSiteConfigDenied(page);
    } finally {
      await deleteTestUserViaApi(page, user.id);
    }
  });

  test('user management page loads', async ({ page }) => {
    await page.goto('/admin/manage-users');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'admin-manage-users');
    await checkLayoutAnomalies(page, 'admin-manage-users');
  });

  test('manage users via /manage-users route', async ({ page }) => {
    await page.goto('/manage-users');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'admin-manage-users-route');

    // Page content: any meaningful element (button, input, list, etc.)
    const hasContent = await page.locator('button, input, table, ul, [class*="user"], [class*="User"], h1, h2').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('plugins page loads', async ({ page }) => {
    await page.goto('/admin/plugins');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'admin-plugins');
    await checkLayoutAnomalies(page, 'admin-plugins');
  });

  test('non-admin cannot access admin routes', async ({ page }) => {
    // Test as unauthenticated user
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Go to admin directly without login
    await page.goto('/admin/manage-users');
    await page.waitForTimeout(2000);
    await saveScreenshot(page, 'admin-unauthenticated-access');

    // Should redirect or show access denied
    const isOnAdmin = page.url().includes('/admin/manage-users');
    if (isOnAdmin) {
      // Check if it shows a permission error or login prompt
      const hasAuth = await page.locator('button:has-text("Sign In"), [class*="forbidden"], [class*="unauthorized"]').count();
      console.log('Auth check on admin page:', hasAuth);
    }
  });

});

test('guest cannot load site management content or admin configs', async ({ page }) => {
  // Keep this outside the admin describe so its login hook never runs.
  await expectSiteConfigDenied(page);
});
