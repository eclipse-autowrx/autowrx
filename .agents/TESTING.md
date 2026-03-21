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

# With screenshots on failure
npx playwright test --screenshot=only-on-failure

# Headed (see browser)
npx playwright test --headed
```

## Test Suites

| File | Coverage |
|------|----------|
| `tests/auth.spec.ts` | Login, logout, register |
| `tests/vehicle-models.spec.ts` | Create/Read/Update/Delete vehicle models |
| `tests/prototype.spec.ts` | Create/Read/Update/Delete prototypes |
| `tests/admin.spec.ts` | Admin panel: user management, site config |
| `tests/layout.spec.ts` | Layout, responsive, visual snapshots |

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
2. Check `http://192.168.1.6:3210` is reachable
3. After test run, send screenshots of any FAILs to Theo via Telegram
4. PASS = silent, FAIL = notify immediately
