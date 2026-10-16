// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { defineConfig, devices } from '@playwright/test';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
dotenvConfig({ path: resolve(__dirname, '.env') });

// By default the suite runs against a production build served by
// `vite preview` (started below): dev-server page loads re-fetch and
// re-parse hundreds of unbundled modules in every fresh browser context,
// which turns transient machine hiccups into 15-60s render stalls and
// flaky tests. Set E2E_DEV_SERVER=1 and BASE_URL to the dev server
// (http://localhost:3210) to test against `vite dev` instead.
const useDevServer = process.env.E2E_DEV_SERVER === '1';

export default defineConfig({
  testDir: './tests',
  testIgnore: 'admin-visibility.spec.ts',
  globalSetup: resolve(__dirname, 'e2e-env-guard.ts'),
  globalTeardown: resolve(__dirname, 'e2e-teardown.ts'),
  timeout: 60000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['line'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  ...(useDevServer
    ? {}
    : {
        webServer: {
          command:
            'npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 3213 --strictPort',
          url: 'http://localhost:3213',
          cwd: resolve(__dirname, '..', 'frontend'),
          reuseExistingServer: true,
          timeout: 180_000,
        },
      }),
  use: {
    baseURL: process.env.BASE_URL,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.PLAYWRIGHT_CHANNEL
          ? { channel: process.env.PLAYWRIGHT_CHANNEL as 'chrome' | 'msedge' }
          : {}),
      },
    },
  ],
});
