// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Guards docs/testing/e2e-test-cases.md against drift: fails when the number
// of Playwright test declarations in .agents/tests no longer matches the
// number of catalog rows (beyond a small tolerance).

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const testsDir = join(process.cwd(), '.agents', 'tests');
const catalogPath = join(process.cwd(), 'docs', 'testing', 'e2e-test-cases.md');
const maxDelta = Number(process.argv[2] ?? process.env.MAX_DELTA ?? 2);

let declared = 0;
const specPattern = /[.]spec[.]ts$/;
for (const file of readdirSync(testsDir)) {
  if (!specPattern.test(file)) continue;
  const source = readFileSync(join(testsDir, file), 'utf8');
  // count test(...) and test.skip(with-args) declarations; bare `test.skip();`
  // markers create no test. describe blocks never match.
  declared += (source.match(/(?<![.\w])test\s*\(|(?<![.\w])test\.skip\s*\([^)]/g) ?? []).length;
}

const catalog = readFileSync(catalogPath, 'utf8');
let rows = 0;
for (const line of catalog.split('\n')) {
  const t = line.trim();
  if (!t.startsWith('|')) continue;
  if (t.includes('Test case') || t.startsWith('|--') || t.startsWith('| --')) continue;
  rows++;
}

const delta = declared - rows;
console.log(`[test-catalog] Playwright test declarations: ${declared}`);
console.log(`[test-catalog] catalog rows in e2e-test-cases.md: ${rows}`);
console.log(`[test-catalog] delta: ${delta} (allowed +/- ${maxDelta})`);

if (Math.abs(delta) > maxDelta) {
  console.error(
    `[test-catalog] OUT OF SYNC - add or remove rows in docs/testing/e2e-test-cases.md so the catalog matches the suite.`,
  );
  process.exit(1);
}
console.log('[test-catalog] OK');
