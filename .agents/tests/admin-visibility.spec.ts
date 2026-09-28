// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

const roles = [
  { id: 'admin', name: 'Admin', not_feature: false },
  { id: 'unlimited', name: 'Unlimited model', not_feature: false },
  { id: 'other', name: 'Other feature', not_feature: false },
];

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test('Site Config hides sections and rejects a hidden section URL', async ({ page }, testInfo) => {
  const isCleanMode = testInfo.project.name === 'clean-mode';
  await page.goto('/admin/site-config?section=auth');

  const sidebar = page.locator('nav').filter({
    has: page.getByRole('button', { name: 'Public Config', exact: true }),
  });
  await expect(page.getByRole('heading', { name: 'Configuration Sections' })).toBeVisible();
  await expect(sidebar.getByRole('button', { name: 'Auth Config' })).toHaveCount(0);
  await expect(sidebar.getByRole('button', { name: 'Standard Staging Frame' })).toHaveCount(0);
  await expect(sidebar.getByRole('button', { name: 'Public Config' })).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/site-config\?section=public$/);

  const genai = sidebar.getByRole('button', { name: 'GenAI / ProtoPilot' });
  if (isCleanMode) {
    await expect(genai).toHaveCount(0);
    await expect(sidebar.getByRole('button', { name: 'SSO Config' })).toHaveCount(0);
    await expect(sidebar.getByRole('button', { name: 'Email Config' })).toHaveCount(0);
    await expect(sidebar.getByRole('button', { name: 'Secret Config' })).toHaveCount(0);
  } else {
    await expect(genai).toBeVisible();
    await genai.click();
    await expect(page).toHaveURL(/\/admin\/site-config\?section=genai$/);
  }
});

test('Manage Features shows only configured categories', async ({ page }, testInfo) => {
  await page.route('**/v2/permissions/roles', async (route) => {
    await route.fulfill({ json: roles });
  });
  await page.route('**/v2/permissions/users-by-roles', async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.goto('/manage-features');

  const categories = page.getByRole('heading', { name: 'Feature Categories' }).locator('..');
  await expect(categories.getByText('Admin', { exact: true })).toBeVisible();
  await expect(categories.getByText('Other feature', { exact: true })).toHaveCount(0);

  const unlimited = categories.getByText('Unlimited model', { exact: true });
  if (testInfo.project.name === 'clean-mode') {
    await expect(unlimited).toBeVisible();
  } else {
    await expect(unlimited).toHaveCount(0);
  }
});
