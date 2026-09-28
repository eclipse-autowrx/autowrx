// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';
import baseConfig from './playwright.config';

const frontendDir = resolve(__dirname, '../frontend');

export default defineConfig({
  ...baseConfig,
  testMatch: 'admin-visibility.spec.ts',
  testIgnore: [],
  webServer: [
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 3211 --strictPort',
      cwd: frontendDir,
      url: 'http://127.0.0.1:3211',
      reuseExistingServer: false,
      env: { VITE_ADMIN_CLEAN_MODE: 'true' },
      timeout: 120000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 3212 --strictPort',
      cwd: frontendDir,
      url: 'http://127.0.0.1:3212',
      reuseExistingServer: false,
      env: {
        VITE_ADMIN_CLEAN_MODE: 'true',
        VITE_ADMIN_HIDDEN_SITE_CONFIG_SECTIONS: 'auth,staging',
        VITE_ADMIN_VISIBLE_FEATURE_CATEGORIES: 'Admin',
      },
      timeout: 120000,
    },
  ],
  projects: [
    {
      name: 'clean-mode',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3211' },
    },
    {
      name: 'custom-visibility',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:3212' },
    },
  ],
});
