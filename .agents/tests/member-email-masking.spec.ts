// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect, Page } from '@playwright/test';
import {
  API_URL,
  ADMIN,
  TEST_USER,
  loginAsAdmin,
  getAuthToken,
  getTokenForUser,
  createTestUserViaApi,
  deleteTestUserViaApi,
  createTestModelViaApi,
  deleteModelViaApi,
  addModelPermissionViaApi,
  CreatedTestUser,
} from './helpers';

test.describe.configure({ mode: 'serial' });

// Mirrors backend/src/utils/maskEmail.js
function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }
  const visibleChars = Math.min(3, Math.floor(username.length / 3));
  return `${username.substring(0, visibleChars)}***@${domain}`;
}

type ApiUser = { id: string; name?: string; email?: string };

test.describe('Contributor and member masking', () => {
  test.setTimeout(90000);

  const stamp = Date.now();
  const modelName = `E2E_MaskModel_${stamp}`;
  let modelId = '';
  let contributor: CreatedTestUser;
  let member: CreatedTestUser;
  let outsider: CreatedTestUser;

  async function getModelRaw(page: Page, token?: string) {
    const res = await page.request.get(`${API_URL}/v2/models/${modelId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    expect(res.status()).toBe(200);
    const raw = await res.text();
    return { raw, body: JSON.parse(raw) as Record<string, unknown> };
  }

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    contributor = await createTestUserViaApi(page, {
      email: `e2e_contributor_${stamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E Contributor ${stamp}`,
    });
    member = await createTestUserViaApi(page, {
      email: `e2e_memberuser_${stamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E Member ${stamp}`,
    });
    outsider = await createTestUserViaApi(page, {
      email: `e2e_outsider_${stamp}@example.com`,
      password: TEST_USER.password,
      name: `E2E Outsider ${stamp}`,
    });
    modelId = await createTestModelViaApi(page, modelName, 'public');
    await addModelPermissionViaApi(page, modelId, contributor.id, 'model_contributor');
    await addModelPermissionViaApi(page, modelId, member.id, 'model_member');
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsAdmin(page);
    if (modelId) await deleteModelViaApi(page, modelId).catch(() => {});
    for (const user of [contributor, member, outsider]) {
      if (user) await deleteTestUserViaApi(page, user.id).catch(() => {});
    }
    await page.close();
  });

  // #272
  test('#272 API as owner returns masked contributor and member emails and no full address', async ({
    page,
  }) => {
    const token = await getAuthToken(page);
    const { raw, body } = await getModelRaw(page, token);

    const contributors = body.contributors as ApiUser[];
    const members = body.members as ApiUser[];
    expect(Array.isArray(contributors)).toBe(true);
    expect(Array.isArray(members)).toBe(true);

    const contributorRow = contributors.find((u) => u.id === contributor.id);
    const memberRow = members.find((u) => u.id === member.id);
    expect(contributorRow, 'contributor listed in contributors[]').toBeTruthy();
    expect(memberRow, 'member listed in members[]').toBeTruthy();
    expect(contributorRow!.email).toBe(maskEmail(contributor.email));
    expect(memberRow!.email).toBe(maskEmail(member.email));
    expect(contributorRow!.email).toContain('***@');
    expect(memberRow!.email).toContain('***@');

    // No role list cross-contamination
    expect(members.find((u) => u.id === contributor.id)).toBeUndefined();
    expect(contributors.find((u) => u.id === member.id)).toBeUndefined();

    // Full addresses never appear anywhere in the body
    for (const user of [contributor, member]) {
      expect(raw).not.toContain(user.email);
    }

    // The owner identity is masked too
    const createdBy = body.created_by as ApiUser | undefined;
    if (createdBy?.email) {
      expect(createdBy.email).toBe(maskEmail(ADMIN.email));
      expect(raw).not.toContain(ADMIN.email);
    }
  });

  // #272
  test('#272 API without write access (member and unrelated user) returns no contributor or member lists', async ({
    page,
  }) => {
    for (const user of [member, outsider]) {
      const token = await getTokenForUser(page, user.email, TEST_USER.password);
      const { raw, body } = await getModelRaw(page, token);
      expect(body.id ?? body._id).toBeTruthy();
      expect(body.contributors).toBeUndefined();
      expect(body.members).toBeUndefined();
      for (const other of [contributor, member]) {
        expect(raw).not.toContain(other.email);
      }
    }
  });

  // #272
  test('#272 UI as owner shows masked emails and never the full address', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/model/${modelId}`);

    const contributorTab = page.getByText(/Contributor \(\d+\)/);
    await expect(contributorTab).toBeVisible({ timeout: 30000 });
    await expect(contributorTab).toHaveText('Contributor (1)');

    // Contributor tab (active by default)
    await expect(page.getByText(maskEmail(contributor.email), { exact: true })).toBeVisible();
    // Reader tab
    await page.getByText(/Reader \(\d+\)/).click();
    await expect(page.getByText(maskEmail(member.email), { exact: true })).toBeVisible();

    const html = await page.content();
    for (const user of [contributor, member]) {
      expect(html).not.toContain(user.email);
    }
  });

  // #272
  test('#272 UI as owner shows contributor and member names masked', async ({ page }) => {
    // DaContributorList renders through UserList, which prints user.name as-is
    // next to the masked email, so the names are shown unmasked today.
    test.fail(true, 'names shown unmasked: UserList renders user.name verbatim');

    await loginAsAdmin(page);
    await page.goto(`/model/${modelId}`);
    await expect(page.getByText(/Contributor \(\d+\)/)).toBeVisible({ timeout: 30000 });

    await expect(page.getByText(contributor.name, { exact: true })).toHaveCount(0);
    await page.getByText(/Reader \(\d+\)/).click();
    await expect(page.getByText(maskEmail(member.email), { exact: true })).toBeVisible();
    await expect(page.getByText(member.name, { exact: true })).toHaveCount(0);
  });
});
