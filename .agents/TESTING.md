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

```bash
# All tests
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
| `tests/vss-validation.spec.ts` | VSS preflight authentication, invalid replacement preserves data, built-in Play/rebuild guard (requires runtime server) |
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

## CI

The `e2e` job in `.github/workflows/ci.yml` runs the default suite on every PR
and push to `main` (advisory: failures add a warning annotation, the job stays
green). It boots a throwaway MongoDB + backend, seeds the admin via
`ADMIN_EMAILS`/`ADMIN_PASSWORD`, sets `E2E_TEST_ENABLED=true`, then runs
`npx playwright test`. Runtime specs skip (no kit-manager in CI). Download the
`e2e-report` artifact for the HTML report, `test-results/`, and `backend.log`.

## Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
BASE_URL=http://localhost:3213
API_URL=http://localhost:3200
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-password
```

⚠️ Never commit `.env` — it is gitignored.

### Frontend under test: production build via `vite preview` (default)

The suite runs against a **production build** served by `vite preview` on
port **3213**. `playwright.config.ts` starts it automatically as a
`webServer` (build into `frontend/dist-e2e`, then preview; reuses an
already-running server). The built app uses same-origin API calls —
preview inherits `server.proxy` from `frontend/vite.config.ts`, so
`/v2`, `/static`, `/plugin`, etc. reach the backend on `localhost:3200`
exactly as they do in dev.

Why not the dev server: every fresh Playwright browser context re-fetches
and re-parses hundreds of unbundled modules from `vite dev`, so a page
load costs seconds of CPU. Transient machine hiccups (cron jobs, file
indexers, container activity) then blow through 15-20s expect timeouts and
show up as blank/partially-rendered-page flakes — observed repeatedly on
shared developer machines. The production build loads a handful of hashed
assets instead and is immune to that amplification.

To run against a dev server anyway (e.g. debugging HMR behavior):

```bash
cd frontend && npm run dev        # vite on :3210
cd ../.agents
E2E_DEV_SERVER=1 BASE_URL=http://localhost:3210 npx playwright test
```

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
