// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { defineConfig } from '@playwright/test';
import config from './playwright.config';
import { resolve } from 'path';
import { tmpdir } from 'os';

// Run the complete standard suite through Express (not Vite preview, which
// does not emit production CSP headers). Bootstrap a disposable stack first.
export default defineConfig({
  ...config,
  webServer: undefined,
  globalSetup: resolve(__dirname, 'csp-env-guard.ts'),
  outputDir: process.env.CSP_TEST_OUTPUT_DIR || resolve(tmpdir(), 'autowrx-csp-results'),
});
