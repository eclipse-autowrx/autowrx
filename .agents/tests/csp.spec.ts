// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { test, expect } from '@playwright/test';
import { loginAsAdmin, createTestModelViaApi, deleteModelViaApi, createTestPrototypeViaApi, goToPrototypeCodeTab, updatePrototypeViaApi } from './helpers';

test.describe('Enforced production CSP', () => {
  test.beforeEach(async ({ request }) => {
    const response = await request.get('/');
    test.skip(!response.headers()['content-security-policy']?.includes("script-src-attr 'none'"),
      'Requires the backend-served build with CSP_MODE=enforce; use playwright.csp.config.ts');
  });

  test('blocks injected scripts, eval and unapproved network destinations', async ({ page }) => {
    for (const path of ['/', '/index.html', '/static/frontend-dist/index.html']) {
      const response = await page.request.get(path);
      const nonce = (await response.text()).match(/name="csp-nonce" content="([^"]+)"/)?.[1];
      expect(nonce).toBeTruthy();
      expect(response.headers()['content-security-policy']).toContain(`'nonce-${nonce}'`);
      expect(response.headers()['cache-control']).toBe('no-store');
    }
    await page.route('**/__csp-eval-probe.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: `try { new Function('window.__cspEvalRan = true')(); } catch { window.__cspEvalBlocked = true; }`,
    }));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
    const result = await page.evaluate(async () => {
      const violations: string[] = [];
      document.addEventListener('securitypolicyviolation', event => violations.push(event.effectiveDirective));
      const inline = document.createElement('script');
      inline.textContent = 'window.__cspInlineRan = true';
      document.body.appendChild(inline);
      const evaluator = document.createElement('script');
      evaluator.src = '/__csp-eval-probe.js';
      document.body.appendChild(evaluator);
      const external = document.createElement('script');
      external.src = 'https://csp-blocked.invalid/probe.js';
      document.body.appendChild(external);
      await fetch('https://csp-blocked.invalid/collect').catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        inlineRan: Boolean((window as any).__cspInlineRan),
        evalRan: Boolean((window as any).__cspEvalRan),
        evalBlocked: Boolean((window as any).__cspEvalBlocked), violations,
      };
    });
    expect(result.inlineRan).toBe(false);
    expect(result.evalRan).toBe(false);
    expect(result.evalBlocked).toBe(true);
    expect(result.violations).toEqual(expect.arrayContaining(['script-src-elem', 'script-src', 'connect-src']));
  });

  test('loads the editor and language workers without vendor CDN requests', async ({ page }) => {
    const cdnRequests: string[] = [];
    const workerUrls: string[] = [];
    page.on('worker', worker => workerUrls.push(worker.url()));
    page.on('request', request => {
      if (/cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com/.test(request.url())) cdnRequests.push(request.url());
    });
    await loginAsAdmin(page);
    const modelId = await createTestModelViaApi(page, `E2E_CspEditor_${Date.now()}`, 'private');
    try {
      const { prototypeId } = await createTestPrototypeViaApi(page, { modelId, name: 'E2E_CspEditor' });
      await updatePrototypeViaApi(page, prototypeId, { language: 'javascript', code: 'const answer = 42;\nconsole.log(answer);' });
      await goToPrototypeCodeTab(page, modelId, prototypeId);
      await expect(page.locator('.monaco-editor').first()).toBeVisible();
      await expect.poll(() => workerUrls.length).toBeGreaterThan(0);
      expect(workerUrls.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
      expect(cdnRequests).toEqual([]);
    } finally {
      await deleteModelViaApi(page, modelId);
    }
  });

  test('runs bundled widget scripts with no inline-script exemption', async ({ page }) => {
    await page.goto('/builtin-widgets/simple-fan/index.html');
    await expect(page.locator('#speedValue')).toHaveText('0');
    expect(await page.evaluate(() => typeof (window as any).onWidgetLoaded)).toBe('function');
    expect(await page.locator('script:not([src])').count()).toBe(0);
  });
});
