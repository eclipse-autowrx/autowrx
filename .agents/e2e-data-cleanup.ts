// Copyright (c) 2026 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

/**
 * Global E2E data cleanup, shared by globalSetup and globalTeardown.
 *
 * Aborted runs leak entities (models/prototypes/plugins/assets/users named
 * with the E2E prefixes used by the specs) into the shared test DB. Leaked
 * public/released rows break the deterministic guest home-list assertions
 * (they add pages of cards ahead of the fresh ones) and leaked test users
 * accumulate roles. Aborted runs also skip the in-spec restore of shared
 * site-config keys.
 *
 * This module resets that state as admin via the backend API so runs start
 * (and end) deterministic. It only runs on environments that passed the
 * e2e-env-guard check — never behind E2E_ALLOW_ANY_ENV=1.
 */
import { execFile } from 'child_process';
import { readdir, rm } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const API_URL = process.env.API_URL || process.env.BASE_URL?.replace(':3210', ':3200') || '';

// Name prefixes used by specs when creating disposable entities.
// Keep in sync with the `E2E_…`/template names in tests/*.spec.ts.
const LEAKED_NAME_RE = new RegExp(
  [
    '^E2E_',
    '^e2e', // covers e2e_contrib_…, e2e_home_my_model_…, …
    '^AAA_',
    '^ZZZ_',
    '^First_',
    '^Second_',
    '^Sort_',
    '^Search_',
    '^Rename_',
    '^Read_',
    '^Detail_',
    '^DELETE_',
    '^RuntimeRun_',
    '^StatusRelease_',
    '^NewPage_',
    '^NotifyTabTest_',
    '^NotifyTabNoopTest_',
    '^AgentTest_',
    '^AgentProto_',
    '^HomePublic',
    '^HomePrivate',
    '^HomeDeveloping_',
    '^HomePopular_',
    '^ExtTab_',
    '^ZipTab_',
    '^UpdateProtoTab_',
  ].join('|'),
);

const LEAKED_USER_EMAIL_RE = /^e2e.*@example\.com$/i;

// Shared site-config keys the specs mutate; reset to the app's predefined
// defaults (see backend/src/config/predefinedSiteConfigs.js) so an aborted
// run cannot pollute the next one.
const DEFAULT_SITE_CONFIG: Record<string, unknown> = {
  NAV_BAR_ACTIONS: [],
  ALLOW_ADDING_FILES: false,
};

const MAX_PAGES = 20;

async function isTestEnvVerified(): Promise<boolean> {
  // Same fail-closed check as e2e-env-guard; teardown must not mutate an
  // environment the guard did not verify (setup abort does not stop teardown).
  try {
    const res = await fetch(
      `${API_URL}/v2/site-config/public/E2E_TEST_ENABLED?scope=site`,
    );
    if (!res.ok) return false;
    const payload = await res.json();
    return payload?.value === true;
  } catch {
    return false;
  }
}

type Entity = { id?: string; _id?: string; name?: string; email?: string };

const entityId = (e: Entity) => String(e.id || e._id || '');

async function loginAsAdminViaApi(): Promise<string> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('[e2e-data-cleanup] ADMIN_EMAIL/ADMIN_PASSWORD not configured');
  }
  const res = await fetch(`${API_URL}/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => null);
  const token = data?.tokens?.access?.token;
  if (!token) {
    throw new Error(`[e2e-data-cleanup] admin login failed: ${res.status}`);
  }
  return token as string;
}

async function api(
  path: string,
  token: string,
  init: { method?: string; body?: unknown } = {},
): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: init.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
}

async function listAll(path: string, token: string): Promise<Entity[]> {
  const out: Entity[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await api(`${path}${path.includes('?') ? '&' : '?'}limit=500&page=${page}`, token);
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    const data = await res.json().catch(() => null);
    const results: Entity[] = Array.isArray(data) ? data : data?.results || [];
    if (results.length === 0) break;
    out.push(...results);
    if (results.length < 500) break;
  }
  return out;
}

async function deleteMatching(
  kind: string,
  entities: Entity[],
  matches: (e: Entity) => boolean,
  deletePath: (id: string) => string,
  token: string,
): Promise<number> {
  let deleted = 0;
  const failures: string[] = [];
  for (const e of entities) {
    const id = entityId(e);
    if (!id || !matches(e)) continue;
    try {
      const res = await api(deletePath(id), token, { method: 'DELETE' });
      if (res.ok || res.status === 404) deleted++;
      else failures.push(`${e.name || e.email || id}:${res.status}`);
    } catch (err) {
      failures.push(`${e.name || e.email || id}:${(err as Error).message}`);
    }
  }
  if (failures.length > 0) {
    console.warn(`[e2e-data-cleanup] ${kind} delete failures: ${failures.join(', ')}`);
  }
  return deleted;
}

async function removeLeakedPluginDirs(): Promise<number> {
  // Uploaded/extracted plugins live in backend/static/plugin/<slug>; only the
  // sample-* seed dirs are tracked, everything else there is runtime state.
  const pluginDir = join(__dirname, '..', 'backend', 'static', 'plugin');
  let removed = 0;
  const entries = await readdir(pluginDir).catch(() => [] as string[]);
  for (const entry of entries) {
    if (!/^e2e/i.test(entry)) continue;
    await rm(join(pluginDir, entry), { recursive: true, force: true }).catch(() => {});
    removed++;
  }
  return removed;
}

async function restoreVssJsonIfModified(): Promise<void> {
  // The backend refreshes data/vss.json (a tracked seed/cache of COVESA
  // releases) from GitHub on boot; restore the committed content so runs do
  // not leave the worktree dirty.
  const repoRoot = join(__dirname, '..');
  try {
    const { stdout } = await execFileAsync('git', [
      '-C',
      repoRoot,
      'status',
      '--porcelain',
      '--',
      'backend/data/vss.json',
    ]);
    if (stdout.trim() === '') return;
    await execFileAsync('git', ['-C', repoRoot, 'checkout', '--', 'backend/data/vss.json']);
    console.log('[e2e-data-cleanup] restored backend/data/vss.json');
  } catch (err) {
    console.warn(`[e2e-data-cleanup] vss.json restore skipped: ${(err as Error).message}`);
  }
}

export async function runE2eDataCleanup(stage: 'setup' | 'teardown'): Promise<void> {
  if (process.env.E2E_ALLOW_ANY_ENV === '1') {
    console.warn(
      '[e2e-data-cleanup] E2E_ALLOW_ANY_ENV=1 — skipping data cleanup (non-disposable target).',
    );
    return;
  }
  if (!API_URL) {
    throw new Error('[e2e-data-cleanup] No API_URL/BASE_URL configured');
  }
  if (!(await isTestEnvVerified())) {
    console.warn(
      '[e2e-data-cleanup] target does not declare E2E_TEST_ENABLED=true — skipping data cleanup.',
    );
    return;
  }

  const token = await loginAsAdminViaApi();
  const summary: string[] = [];

  summary.push(
    `prototypes:${await deleteMatching(
      'prototypes',
      await listAll('/v2/prototypes', token).catch(() => [] as Entity[]),
      (e) => !!e.name && LEAKED_NAME_RE.test(e.name),
      (id) => `/v2/prototypes/${id}`,
      token,
    )} deleted`,
  );
  summary.push(
    `models:${await deleteMatching(
      'models',
      await listAll('/v2/models', token).catch(() => [] as Entity[]),
      (e) => !!e.name && LEAKED_NAME_RE.test(e.name),
      (id) => `/v2/models/${id}`,
      token,
    )} deleted (prototypes cascade)`,
  );
  summary.push(
    `plugins:${await deleteMatching(
      'plugins',
      await listAll('/v2/system/plugin/admin', token).catch(() => [] as Entity[]),
      (e) => !!e.name && LEAKED_NAME_RE.test(e.name),
      (id) => `/v2/system/plugin/${id}`,
      token,
    )} deleted`,
  );
  const assets = await listAll('/v2/assets/manage', token).catch(async () => {
    // Fall back to the owner-scoped list when the admin route is unavailable.
    return listAll('/v2/assets', token).catch(() => [] as Entity[]);
  });
  summary.push(
    `assets:${await deleteMatching(
      'assets',
      assets,
      (e) => !!e.name && LEAKED_NAME_RE.test(e.name),
      (id) => `/v2/assets/${id}`,
      token,
    )} deleted`,
  );
  summary.push(
    `users:${await deleteMatching(
      'users',
      await listAll('/v2/users', token).catch(() => [] as Entity[]),
      (e) =>
        !!e.email &&
        LEAKED_USER_EMAIL_RE.test(e.email) &&
        e.email !== process.env.ADMIN_EMAIL,
      (id) => `/v2/users/${id}`,
      token,
    )} deleted`,
  );

  for (const [key, value] of Object.entries(DEFAULT_SITE_CONFIG)) {
    try {
      const res = await api(`/v2/site-config/key/${key}`, token, {
        method: 'PATCH',
        body: { value },
      });
      if (!res.ok) console.warn(`[e2e-data-cleanup] reset ${key} failed: ${res.status}`);
    } catch (err) {
      console.warn(`[e2e-data-cleanup] reset ${key} failed: ${(err as Error).message}`);
    }
  }

  // The in-suite "restore default" specs reset site-config keys to their
  // snapshots, which nulls this guard key for subsequent runs — re-arm it.
  try {
    const res = await api('/v2/site-config/key/E2E_TEST_ENABLED', token, {
      method: 'PATCH',
      body: { value: true },
    });
    if (!res.ok) console.warn(`[e2e-data-cleanup] re-arm E2E_TEST_ENABLED failed: ${res.status}`);
  } catch (err) {
    console.warn(`[e2e-data-cleanup] re-arm E2E_TEST_ENABLED failed: ${(err as Error).message}`);
  }

  summary.push(`pluginDirs:${await removeLeakedPluginDirs()} removed`);
  if (stage === 'teardown') {
    await restoreVssJsonIfModified();
  }

  console.log(`[e2e-data-cleanup] (${stage}) ${summary.join(' | ')}`);
}
