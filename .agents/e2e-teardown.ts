// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { runE2eDataCleanup } from './e2e-data-cleanup';

/**
 * Playwright globalTeardown — best-effort: never let cleanup failures mask
 * test results.
 */
export default async function globalTeardown() {
  try {
    await runE2eDataCleanup('teardown');
  } catch (err) {
    console.warn(`[e2e-teardown] cleanup skipped: ${(err as Error).message}`);
  }
}
