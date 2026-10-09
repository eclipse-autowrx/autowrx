// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Specs that only use their own data (models/prototypes/plugins they create
// and clean up themselves). Safe to run with 1 worker, concurrently with the
// shared-state shard. Pair via scripts/test-parallel.mjs.
import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config";
import { SHARED_STATE_SPEC } from "./playwright.shared-state.config";

export default defineConfig({
  ...baseConfig,
  testIgnore: [SHARED_STATE_SPEC, "**/admin-visibility.spec.ts"],
  fullyParallel: false,
  workers: 1,
});
