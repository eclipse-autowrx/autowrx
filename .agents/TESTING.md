# autowrx — Agent Testing Guide

This folder contains automated test suites for the autowrx frontend.
Tests are written in Playwright (TypeScript) and can be run by AI agents
or developers to validate app behavior after changes.

> **Non-technical reader?** The plain-language list of every test case lives in
> [`../docs/testing/e2e-test-cases.md`](../docs/testing/e2e-test-cases.md).

## Setup

```bash
cd .agents
npm install
npx playwright install chromium
```

## Running Tests

`yarn test` / `npm test` self-setup: a `pretest` hook (`.agents/scripts/setup-env.mjs`) ensures, before any test runs:

1. `.env` files exist (backend, frontend, `.agents` — created from the `*.env.example` when missing; `.agents/.env` admin creds are aligned with the backend's `ADMIN_EMAILS`/`ADMIN_PASSWORD` bootstrap values when available)
2. `node_modules` installed (backend, frontend, `.agents`) and Playwright chromium downloaded
3. backend (`API_URL`, default `:3200`) and frontend (`BASE_URL`, default `:3210`) dev servers running — started detached when down, logs in `.agents/.setup-logs/`, left running afterwards
4. admin login works (the backend creates admins at startup from `backend/.env` `ADMIN_EMAILS`/`ADMIN_PASSWORD`)
5. site-config keys `E2E_TEST_ENABLED=true` and `PUBLIC_VIEWING=true` are set

Steps 3-5 are applied only to local targets
### Parallel run (experimental — known unstable on constrained hosts)

`yarn test:fast` splits the suite into two concurrent Playwright processes:
15 site-config-mutating files run serially (77 tests, 1 worker) while the
other 25 self-contained files run in a second process (78 tests, 1 worker).
Measured on a 32 GB host: 35 m wall vs 43-46 m serial, but with 9 failures
and 11 flakes vs 0-3 serial — 3 concurrent browsers saturate the box and
not every spec is hermetic yet. Use `yarn test` (serial) as the source of
truth; try `test:fast` only on beefier machines. Follow-up: hermetic
fixtures everywhere, then revisit sharding.
 (`localhost`/`127.0.0.1`) unless `E2E_ALLOW_ANY_ENV=1` — the same fail-closed convention as the env guard. Individual suites (`yarn test:<name>`) do not run the setup hook; run `yarn exec node scripts/setup-env.mjs` once first if the environment isn't up.

```bash
# All tests (with automatic environment setup)
npx playwright test

# Specific suite
npx playwright test tests/auth.spec.ts
npx playwright test tests/vehicle-models.spec.ts
npx playwright test tests/import-export.spec.ts
npx playwright test tests/prototype-context-menu.spec.ts
npx playwright test tests/home-model-list.spec.ts
npx playwright test tests/home-prototype-list.spec.ts
npx playwright test tests/image-fallback.spec.ts
npx playwright test tests/model-editable-visibility.spec.ts

# Admin visibility variants (starts two dedicated Vite servers)
npx playwright test --config=playwright.admin-visibility.config.ts

# With screenshots on failure
npx playwright test --screenshot=only-on-failure

# Headed (see browser)
npx playwright test --headed
```

### Windows (CMD / PowerShell)

Playwright treats the file argument as a **regex**. Use **forward slashes** (not `\`) or `npm run`:

```powershell
cd C:\repo\autowrx\.agents
npm run test:home-model-list
npm run test:model-editable-visibility
```

Or with `npx` (forward slashes work on Windows):

```powershell
npx playwright test tests/home-model-list.spec.ts
npx playwright test tests/import-export.spec.ts
npx playwright test tests/prototype-context-menu.spec.ts
npx playwright test tests/home-prototype-list.spec.ts
npx playwright test tests/image-fallback.spec.ts
npx playwright test tests/model-editable-visibility.spec.ts
```

Run several suites:

```powershell
npx playwright test tests/import-export.spec.ts tests/prototype-context-menu.spec.ts tests/home-model-list.spec.ts
npx playwright test tests/model-editable-visibility.spec.ts
```

## Test Suites

| File | Coverage |
|------|----------|
| `tests/auth.spec.ts` | Login, logout, register |
| `tests/vehicle-models.spec.ts` | Create/Read/Update/Delete vehicle models |
| `tests/prototype.spec.ts` | Create/Read/Update/Delete prototypes |
| `tests/prototype-dashboard-remount.spec.ts` | Applying a dashboard template delivers new widget options to mounted widgets |
| `tests/admin.spec.ts` | Admin panel: user management, site config |
| `tests/site-config-restore-default.spec.ts` | Public config restore default (accept + cancel) |
| `tests/import-export.spec.ts` | Model/prototype export and import round-trips |
| `tests/prototype-context-menu.spec.ts` | Admin delete prototype via context menu |
| `tests/home-model-list.spec.ts` | Home model-list: guest visibility, logged-in UI, category filters, all 6 sort options, rename, My Contributions contributor/reader |
| `tests/home-prototype-list.spec.ts` | Home prototype-list: guest visibility, category tabs, My Prototypes filter, all 6 sort options, navigation |
| `tests/image-fallback.spec.ts` | Model and prototype cards fall back to default images when primary image fails to load |
| `tests/model-editable-visibility.spec.ts` | Editable model visibility: non-owner prototype create, guest home shows editable+public, template inheritance |
| `tests/admin-visibility.spec.ts` | Site Config sections and Manage Features categories under clean mode and explicit overrides; run with `playwright.admin-visibility.config.ts` |
| `tests/layout.spec.ts` | Layout, responsive, visual snapshots |

## Environment guard (fail-closed)

Every run checks the target environment **before any test executes** (`e2e-env-guard.ts` global setup): it fetches the public site-config key `E2E_TEST_ENABLED` from `API_URL` and **aborts the whole run unless the value is exactly `true`**. Instances that have not opted in — production, shared staging, fresh deployments — are un-testable by default.

- **Disposable test stacks**: after seeding the admin, set the key once — `PATCH /v2/site-config/key/E2E_TEST_ENABLED {"value": true}` — and the guard passes
- **Production-grade instances**: never set the key. To run suites in a maintenance window, set `E2E_ALLOW_ANY_ENV=1` for that run only — the suites mutate site-config (homepage/nav) and create `E2E_*` data, and their restore hooks do not run if the run is killed mid-flight
- **Non-mutating subset** (auth, image-fallback, read-only flows) is the only category ever defensible outside a window

The admin visibility suite needs a disposable backend on `localhost:3200`, an
admin account, and `.agents/.env` with `BASE_URL`, `API_URL`, `ADMIN_EMAIL`, and
`ADMIN_PASSWORD`. The normal `E2E_TEST_ENABLED=true` guard still applies. The
suite starts its own Vite servers on ports 3211 and 3212, so leave those ports
free and keep the three `VITE_ADMIN_*` visibility variables out of
`frontend/.env` while running it. The standard Playwright config excludes this
suite because it requires these dedicated frontend variants.

## Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
BASE_URL=http://localhost:3210
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-password
```

⚠️ Never commit `.env` — it is gitignored.

## Snapshot Policy

- Snapshots saved to `tests/screenshots/`
- On layout anomaly: screenshot auto-saved and logged
- Baseline snapshots updated with: `npx playwright test --update-snapshots`

## Agent Notes

When running as an AI agent:
1. Start backend + frontend on Jetson before testing
2. Check `BASE_URL` is reachable
3. After test run, send screenshots of any FAILs to Theo via Telegram
4. PASS = silent, FAIL = notify immediately
