# Skill: add-test
> Add a new test to the repo by kind — backend Jest unit/integration, or `.agents/` Playwright E2E.

## When to use
- After implementing/fixing a feature and needing coverage for it (RULES.md: run tests before declaring done).
- When closing a coverage gap surfaced by `run-tests` or `code-review`.
- When a Playwright spec is missing for a page/flow you changed (check `.agents/SITEMAP.md` coverage status).

## Steps

### 1. Pick the kind
- Backend logic (services, controllers, models, utils) → Jest in `backend/`.
- Frontend page/flow or full request→response behavior → Playwright in `.agents/`.
- Frontend pure logic has no unit runner wired — prefer Playwright or refactor logic into a testable module; do not invent a Vitest/Jest setup.

### 2. Backend Jest (`backend/`)
- Colocate the spec next to the code, or place it under the existing tests dir. Only ~8 Jest files exist — read one first and **match the existing spec style** (describe/it layout, setup/teardown, naming).
- File name: `<name>.test.js` (or match the neighbor's convention).
- Mock external calls so tests don't depend on live services:
  - `CACHE_URL` (`/get-recent-activities/:userId`) and `LOG_URL` calls go through `backend/config/axios.js` — mock that module rather than hitting the network.
  - Mock Mongoose models or use a real Mongo instance (see next bullet) per existing specs.
- If the spec needs MongoDB and none is running, start the local container:
  ```bash
  docker run -d --name autowrx-mongo-test -p 27017:27017 mongo:4.4.6-bionic
  ```
- Run the file, then the whole suite to confirm no regressions:
  ```bash
  cd backend && npx jest path/to/file.test.js
  cd backend && npm test
  cd backend && npm run lint && npm run prettier
  ```

### 3. Playwright E2E (`.agents/`)
- Add `tests/<area>.spec.ts`. Read 1-2 existing specs first and mirror their structure (`test.describe`, `test.beforeEach` login, selectors from `helpers.ts`).
- Reuse `tests/helpers.ts` rather than re-implementing:
  - `ADMIN` (from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env), `TEST_USER` (`testuser@autowrx.test` / `TestPass123!`).
  - `API_URL` (defaults from `BASE_URL` :3210 → :3200), `RUNTIME_SERVER_URL` (default `http://localhost:3090`), `RUNTIME_SERVER_CONFIG`.
  - `loginAs`/`loginAsAdmin`/`logout`, `getAuthToken`, `createTestModelViaApi`, `createTestPrototype`, `setPrototypeStateViaApi`.
  - Selectors: `LIBRARY_SEARCH_SELECTOR`, `[data-id="..."]` attributes used across specs.
- For plugin tests, use the `e2e-simple-plugin` fixture: `E2E_PLUGIN_FIXTURE_DIR` (`tests/fixtures/e2e-simple-plugin/`), `E2E_PLUGIN_ZIP_PATH`, `routeExternalPluginScript`, `createInternalPluginViaAdminZip`, `expectPluginDetailLoaded` with `E2E_PLUGIN_MARKER`.
- Follow the snapshot policy in `.agents/TESTING.md`: screenshots to `tests/screenshots/`, baseline updates via `--update-snapshots`, `--screenshot=only-on-failure` for runs.
- Run:
  ```bash
  cd .agents && npx playwright test tests/<area>.spec.ts
  cd .agents && npx playwright test                          # full sweep
  cd .agents && npx playwright show-report                   # on failure
  ```
- After the spec is green, update `.agents/SITEMAP.md` coverage status to ✅ for the page/flow now covered.

### 4. License header
- New `.js`/`.ts`/`.tsx` source files (including test files) must start with the Eclipse/MIT `SPDX-License-Identifier: MIT` header — see `license-check` skill. `.md`/`.sh`/`.yml` do not carry it.

## Guardrails
- Don't commit `.env` (`.agents/.env`, `backend/.env`) — gitignored. Copy from `.env.example` locally only.
- Don't make tests depend on execution order or shared mutable state between specs. Keep specs atomic; clean up created entities (or use uniquely-named ones per run).
- Don't disable lint/test rules silently to make green — fix the code or surface the conflict.
- Don't assert on brittle selectors/text that flake; prefer `[data-id="..."]` attributes and `getByRole` over CSS classes.
- Don't invent a frontend unit-test framework. If you believe one is needed, propose it first.

## Exit criteria
- The new test passes locally with the exact command(s) cited, and the surrounding suite is still green.
- Lint/format pass on the touched files.
- `.agents/SITEMAP.md` updated (for E2E) and any new source file carries the MIT header.
- Cross-link: hand off to `run-tests` for full runs, `code-review` for diff review, `docs-update` if a capability/coverage doc changed.