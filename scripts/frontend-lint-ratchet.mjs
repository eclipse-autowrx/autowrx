// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Frontend ESLint ratchet: fails only when a change introduces lint problems.
// For every frontend file changed since the merge base (working tree included),
// lint the new content and the merge-base content with the same config, then
// compare per-file, per-rule problem counts (errors and warnings). A rule count
// that grows in a file fails; a file with old problems that stays equal or
// improves passes. Files outside the diff are never linted, so the legacy
// backlog cannot block an unrelated PR.
//
// Usage: node scripts/frontend-lint-ratchet.mjs [base-ref]
// base-ref defaults to $LINT_BASE_REF, then upstream/main (fork workflow), then origin/main.

import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontend = join(root, 'frontend');
const lintable = /[.](?:[cm]?js|jsx|tsx?)$/;

const git = (...args) =>
  execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });

const hasRef = (ref) => {
  try {
    git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`);
    return true;
  } catch {
    return false;
  }
};

const baseRef = [process.argv[2], process.env.LINT_BASE_REF, 'upstream/main', 'origin/main']
  .filter(Boolean)
  .find(hasRef);
if (!baseRef) {
  console.error('frontend-lint-ratchet: no base ref found (pass one, or fetch origin/main).');
  process.exit(2);
}
const mergeBase = git('merge-base', baseRef, 'HEAD').trim();

// path -> base path (null when the file is new)
const changed = new Map();
const diff = git('diff', '--name-status', '-M', '-z', '--diff-filter=ACMR', mergeBase).split('\0');
for (let i = 0; i < diff.length - 1; ) {
  const status = diff[i][0];
  if (status === 'R' || status === 'C') {
    changed.set(diff[i + 2], diff[i + 1]);
    i += 3;
  } else {
    changed.set(diff[i + 1], status === 'A' ? null : diff[i + 1]);
    i += 2;
  }
}
for (const p of git('ls-files', '--others', '--exclude-standard', '-z').split('\0')) {
  if (p) changed.set(p, null);
}

const files = [...changed.keys()].filter(
  (p) => p.startsWith('frontend/') && lintable.test(p) && existsSync(join(root, p)),
);
if (files.length === 0) {
  console.log(`frontend-lint-ratchet: no changed frontend source files vs ${baseRef}.`);
  process.exit(0);
}

const { ESLint } = createRequire(join(frontend, 'package.json'))('eslint');
const eslint = new ESLint({
  cwd: frontend,
  overrideConfig: { linterOptions: { reportUnusedDisableDirectives: 'warn' } },
});

const countRules = (messages) => {
  const counts = new Map();
  for (const m of messages) {
    const key = m.ruleId ?? (m.fatal ? 'parse-error' : 'unused-disable-directive');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};

let regressions = 0;
let checked = 0;
for (const file of files) {
  const abs = join(root, file);
  if (await eslint.isPathIgnored(abs)) continue;
  checked++;

  const [current] = await eslint.lintFiles([abs]);
  const now = countRules(current.messages);
  if (now.size === 0) continue;

  const basePath = changed.get(file);
  let before = new Map();
  if (basePath) {
    let text = null;
    try {
      text = git('show', `${mergeBase}:${basePath}`);
    } catch {
      // not present at the merge base: treat as new
    }
    if (text !== null) {
      // lint the old content as if it still lived at the new path so the same config applies
      const [old] = await eslint.lintText(text, { filePath: abs });
      before = countRules(old.messages);
    }
  }

  for (const [rule, count] of now) {
    const prev = before.get(rule) ?? 0;
    if (count <= prev) continue;
    regressions++;
    console.error(`\n${file}: ${rule} went from ${prev} to ${count}`);
    // line numbers can't tell old from new occurrences, so list them all
    for (const m of current.messages) {
      if ((m.ruleId ?? (m.fatal ? 'parse-error' : 'unused-disable-directive')) !== rule) continue;
      console.error(`  ${m.line}:${m.column}  ${m.message}`);
    }
  }
}

if (regressions > 0) {
  console.error(
    `\nfrontend-lint-ratchet: FAIL - ${regressions} rule/file regression(s) vs ${baseRef} (${mergeBase.slice(0, 9)}). Fix the new problems above (existing ones are tolerated).`,
  );
  process.exit(1);
}
console.log(
  `frontend-lint-ratchet: OK - ${checked} changed frontend file(s) checked vs ${baseRef} (${mergeBase.slice(0, 9)}), no new lint problems.`,
);
