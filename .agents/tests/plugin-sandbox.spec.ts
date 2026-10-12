// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Issue #626: non-admins may only register external http(s) plugins, zip
// upload is admin-only, and plugins created by non-admins run in an
// opaque-origin sandboxed iframe behind a postMessage PluginAPI bridge.

import { test, expect, type Page } from '@playwright/test';
import {
  loginAsAdmin,
  saveScreenshot,
  createTestModelViaApi,
  createTestUserViaApi,
  deleteTestUserViaApi,
  getTokenForUser,
  getAdminToken,
  deletePluginViaApi,
  routeExternalPluginScript,
  E2E_PLUGIN_MARKER,
  API_URL,
  TEST_USER,
  type CreatedTestUser,
} from './helpers';

const PROBE_PLUGIN_URL = 'http://127.0.0.1:18765/e2e-sandbox-probe/index.js';

// Reports what the plugin can reach from inside the sandbox.
const PROBE_PLUGIN_JS = `
(function () {
  function attempt(fn) {
    try { fn(); return 'allowed'; } catch (e) { return 'blocked'; }
  }
  function Page(props) {
    var React = window.React;
    var api = (props && props.api) || {};
    var s = React.useState({ rpc: 'pending', denied: 'pending' });
    var state = s[0], setState = s[1];
    React.useEffect(function () {
      Promise.resolve()
        .then(function () { return api.listVSSVersions(); })
        .then(function (v) { return Array.isArray(v) ? 'ok' : 'bad'; }, function () { return 'error'; })
        .then(function (rpc) {
          var deniedP = typeof api.searchUserByEmail === 'function'
            ? api.searchUserByEmail('x@example.com').then(function () { return 'allowed'; }, function () { return 'denied'; })
            : Promise.resolve('denied');
          return deniedP.then(function (denied) { setState({ rpc: rpc, denied: denied }); });
        });
    }, []);
    return React.createElement('div', null,
      React.createElement('p', { 'data-testid': 'probe-storage' }, 'storage:' + attempt(function () { return window.localStorage.length; })),
      React.createElement('p', { 'data-testid': 'probe-cookie' }, 'cookie:' + attempt(function () { return document.cookie; })),
      React.createElement('p', { 'data-testid': 'probe-parent' }, 'parent:' + attempt(function () { return window.parent.document.title; })),
      React.createElement('p', { 'data-testid': 'probe-rpc' }, 'rpc:' + state.rpc),
      React.createElement('p', { 'data-testid': 'probe-denied' }, 'denied:' + state.denied)
    );
  }
  window.DAPlugins = window.DAPlugins || {};
  window.DAPlugins['page-plugin'] = { components: { Page: Page } };
})();
`;

async function createPluginAsUser(page: Page, token: string, data: Record<string, unknown>) {
  return page.request.post(`${API_URL}/v2/system/plugin`, {
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
}

test.describe('Plugin authorization & sandbox (#626)', () => {
  let user: CreatedTestUser | null = null;
  let userToken = '';
  const pluginIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    user = await createTestUserViaApi(page, { email: `e2e-sbx-${Date.now()}@example.com` });
    userToken = await getTokenForUser(page, user.email, TEST_USER.password);
  });

  test.afterEach(async ({ page }) => {
    for (const id of pluginIds.splice(0)) {
      await deletePluginViaApi(page, id).catch(() => {});
    }
    if (user) {
      await deleteTestUserViaApi(page, user.id).catch(() => {});
      user = null;
    }
  });

  test('non-admin cannot upload a zip or register an internal/same-origin plugin', async ({ page }) => {
    const upload = await page.request.post(`${API_URL}/v2/system/plugin/upload/e2e-sbx-${Date.now()}`, {
      multipart: { file: { name: 'p.zip', mimeType: 'application/zip', buffer: Buffer.from('PK') } },
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(upload.status()).toBe(403);

    const internal = await createPluginAsUser(page, userToken, {
      name: `E2E_Sbx_Int_${Date.now()}`,
      is_internal: true,
      url: '/plugin/whatever/index.js',
    });
    expect(internal.status()).toBe(403);

    const relative = await createPluginAsUser(page, userToken, {
      name: `E2E_Sbx_Rel_${Date.now()}`,
      is_internal: false,
      url: '/d/evil.js',
    });
    expect(relative.status()).toBe(400);
  });

  test('admin-created plugin is trusted and renders in-page', async ({ page }) => {
    test.setTimeout(90000);
    const route = await routeExternalPluginScript(page);
    const res = await page.request.post(`${API_URL}/v2/system/plugin`, {
      data: { name: `E2E_Sbx_Admin_${Date.now()}`, is_internal: false, url: route.url },
      headers: { Authorization: `Bearer ${await getAdminToken(page)}` },
    });
    expect(res.status()).toBe(201);
    const created = await res.json();
    pluginIds.push(created.id);
    expect(created.is_trusted).toBe(true);

    const modelId = await createTestModelViaApi(page, `E2E_Sbx_Model_${Date.now()}`, 'public');
    await page.goto(`/model/${modelId}/plugin?plugid=${created.slug}`);
    await expect(page.getByText(E2E_PLUGIN_MARKER)).toBeVisible({ timeout: 30000 });
    await expect(page.locator('iframe[sandbox]')).toHaveCount(0);
  });

  test('non-admin plugin runs in an opaque-origin sandbox with a restricted API bridge', async ({ page }) => {
    test.setTimeout(90000);
    await page.route(PROBE_PLUGIN_URL, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: PROBE_PLUGIN_JS,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }),
    );

    const res = await createPluginAsUser(page, userToken, {
      name: `E2E_Sbx_User_${Date.now()}`,
      is_internal: false,
      url: PROBE_PLUGIN_URL,
    });
    expect(res.status()).toBe(201);
    const created = await res.json();
    pluginIds.push(created.id);
    expect(created.is_trusted).toBe(false);

    const modelName = `E2E_Sbx_Model_${Date.now()}`;
    const modelId = await createTestModelViaApi(page, modelName, 'public');
    await page.goto(`/model/${modelId}/plugin?plugid=${created.slug}`);

    const iframe = page.locator('iframe[sandbox]');
    await expect(iframe).toHaveCount(1, { timeout: 30000 });
    const sandboxAttr = (await iframe.getAttribute('sandbox')) || '';
    expect(sandboxAttr).toContain('allow-scripts');
    expect(sandboxAttr).not.toContain('allow-same-origin');

    const frame = page.frameLocator('iframe[sandbox]');
    await expect(frame.getByTestId('probe-storage')).toHaveText('storage:blocked', { timeout: 30000 });
    await expect(frame.getByTestId('probe-cookie')).toHaveText('cookie:blocked');
    await expect(frame.getByTestId('probe-parent')).toHaveText('parent:blocked');
    await expect(frame.getByTestId('probe-rpc')).toHaveText('rpc:ok', { timeout: 30000 });
    await expect(frame.getByTestId('probe-denied')).toHaveText('denied:denied', { timeout: 30000 });
    await saveScreenshot(page, 'plugin-sandbox-probe');
  });
});
