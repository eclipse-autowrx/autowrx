# autowrx — Agent Testing Guide

This folder contains automated test suites for the autowrx frontend.
Tests are written in Playwright (TypeScript) and can be run by AI agents
or developers to validate app behavior after changes.

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
| `tests/admin.spec.ts` | Admin panel: user management, site config |
| `tests/site-config-restore-default.spec.ts` | Public config restore default (accept + cancel) |
| `tests/import-export.spec.ts` | Model/prototype export and import round-trips |
| `tests/prototype-context-menu.spec.ts` | Admin delete prototype via context menu |
| `tests/home-model-list.spec.ts` | Home model-list: guest visibility, logged-in UI, category filters, all 6 sort options, rename, My Contributions contributor/reader |
| `tests/home-prototype-list.spec.ts` | Home prototype-list: guest visibility, category tabs, My Prototypes filter, all 6 sort options, navigation |
| `tests/image-fallback.spec.ts` | Model and prototype cards fall back to default images when primary image fails to load |
| `tests/model-editable-visibility.spec.ts` | Editable model visibility: non-owner prototype create, guest home shows editable+public, template inheritance |
| `tests/layout.spec.ts` | Layout, responsive, visual snapshots |

## Environment guard (fail-closed)

Every run checks the target environment **before any test executes** (`e2e-env-guard.ts` global setup): it fetches the public site-config key `E2E_TEST_ENABLED` from `API_URL` and **aborts the whole run unless the value is exactly `true`**. Instances that have not opted in — production, shared staging, fresh deployments — are un-testable by default.

- **Disposable test stacks**: after seeding the admin, set the key once — `PATCH /v2/site-config/key/E2E_TEST_ENABLED {"value": true}` — and the guard passes
- **Production-grade instances**: never set the key. To run suites in a maintenance window, set `E2E_ALLOW_ANY_ENV=1` for that run only — the suites mutate site-config (homepage/nav) and create `E2E_*` data, and their restore hooks do not run if the run is killed mid-flight
- **Non-mutating subset** (auth, image-fallback, read-only flows) is the only category ever defensible outside a window

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
