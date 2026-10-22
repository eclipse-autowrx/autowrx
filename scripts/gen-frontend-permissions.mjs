// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Generates frontend/src/data/permission.ts from the single source of truth,
// backend/src/config/roles.js (PERMISSIONS and RESOURCES).
//   node scripts/gen-frontend-permissions.mjs          write the file
//   node scripts/gen-frontend-permissions.mjs --check  fail if it is out of date

import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { PERMISSIONS, RESOURCES } = require(join(root, 'backend', 'src', 'config', 'roles.js'));
const outPath = join(root, 'frontend', 'src', 'data', 'permission.ts');

const header = `// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// GENERATED from backend/src/config/roles.js by scripts/gen-frontend-permissions.mjs — do not edit.
`;

const body = (obj) =>
  Object.entries(obj)
    .map(([key, value]) => `  ${key}: '${value}',`)
    .join('\n');

const output = `${header}
export const PERMISSIONS = {
${body(PERMISSIONS)}
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const RESOURCES = {
${body(RESOURCES)}
} as const
`;

if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(outPath, 'utf8');
  } catch {}
  if (current !== output) {
    console.error(
      '[gen-permissions] frontend/src/data/permission.ts is out of date with backend/src/config/roles.js - run: node scripts/gen-frontend-permissions.mjs',
    );
    process.exit(1);
  }
  console.log('[gen-permissions] OK');
} else {
  writeFileSync(outPath, output);
  console.log('[gen-permissions] wrote frontend/src/data/permission.ts');
}
