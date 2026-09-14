/**
 * Fail-closed environment guard for E2E runs.
 *
 * The suites mutate state (site-config, E2E_* entities) and must only run
 * against disposable test environments. Production and shared instances
 * live at the same kinds of URLs as test stacks (often plain localhost),
 * so the hostname cannot distinguish them — the TARGET INSTANCE declares
 * itself a test target instead, via the public site-config key
 * `E2E_TEST_ENABLED` (exactly `true`).
 *
 * - Key absent / not `true`  → the whole run aborts before any test.
 * - `E2E_ALLOW_ANY_ENV=1`   → deliberate override (maintenance window on a
 *                             production-grade instance, or an environment
 *                             where the public config route is unreachable).
 *
 * Set the key on disposable stacks after seeding the admin, e.g.:
 *   PATCH /v2/site-config/key/E2E_TEST_ENABLED  { "value": true }
 */
export default async function globalSetup() {
  if (process.env.E2E_ALLOW_ANY_ENV === '1') {
    console.warn(
      '[e2e-env-guard] E2E_ALLOW_ANY_ENV=1 set — skipping environment check. ' +
        'Ensure this is intentional (maintenance window) and the target is not a shared instance.',
    );
    return;
  }

  const baseUrl = process.env.BASE_URL || '';
  const apiUrl = process.env.API_URL || baseUrl.replace(':3210', ':3200') || '';
  if (!apiUrl) {
    throw new Error(
      '[e2e-env-guard] No API_URL/BASE_URL configured — cannot verify the target environment. ' +
        'Set .env, or set E2E_ALLOW_ANY_ENV=1 to override deliberately.',
    );
  }

  const url = `${apiUrl.replace(/\/$/, '')}/v2/site-config/public/E2E_TEST_ENABLED?scope=site`;
  let payload = null;
  try {
    const res = await fetch(url);
    if (res.ok) payload = await res.json();
  } catch {
    // unreachable endpoint — treat as not-a-test-env (fail closed)
  }

  if (!payload || payload.value !== true) {
    throw new Error(
      '[e2e-env-guard] ABORTED: target environment does not allow E2E tests ' +
        `(E2E_TEST_ENABLED is not true at ${apiUrl}).\n` +
        '  - Disposable test stack: set the site-config key E2E_TEST_ENABLED=true after seeding.\n' +
        '  - Production-grade instance: use a maintenance window and set E2E_ALLOW_ANY_ENV=1 ' +
        'for that run only, understanding the suites mutate site-config and create data.',
    );
  }
  console.log(`[e2e-env-guard] ${apiUrl} declares E2E_TEST_ENABLED=true — proceeding.`);
}
