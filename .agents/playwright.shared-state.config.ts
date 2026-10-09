// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Specs that mutate instance-wide state (site config sections, runtime
// server config, feature flags). They must never run concurrently with each
// other: 1 worker. Pair with playwright.isolated.config.ts via
// scripts/test-parallel.mjs.
import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";

const SHARED_STATE_FILES = [
  "api-architecture",
  "home-model-list",
  "home-prototype-list",
  "home-prototypes",
  "home-sections",
  "image-fallback",
  "import-export",
  "model-customization-menu",
  "model-delete-recreate-and-prototype-rename",
  "model-editable-visibility",
  "nav-bar-actions",
  "project-editor-allow-adding-files",
  "prototype-runtime",
  "site-config-legacy-hidden",
  "site-config-restore-default",
];

export const SHARED_STATE_SPEC = new RegExp(
  "tests/(" + SHARED_STATE_FILES.join("|") + ")[.]spec[.]ts$",
);

export default defineConfig({
  ...baseConfig,
  testMatch: SHARED_STATE_SPEC,
  testIgnore: [],
  fullyParallel: false,
  workers: 1,
});
