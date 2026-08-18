# Skill: run-tests
> Run the repo's test suites — backend Jest and/or `.agents/` Playwright — and read the results honestly.

## When to use
- Before declaring any code change done (RULES.md: run tests before declaring done).
- After implementing/fixing in `backend/` or `frontend/`, and for E2E flows in `.agents/`.
- When asked to verify a specific spec or flow.

## Steps
### Backend (Jest, `backend/`)
```bash
cd backend && npm test                       # all tests, --detectOpenHandles
cd backend && npm run test:watch             # watch mode for the file you're editing
cd backend && npm run coverage               # with coverage
cd backend && npx jest path/to/file.test.js  # one spec file
```
- Backend Jest specs are colocated or under a tests dir. Match existing spec style when adding.
- If a test env needs MongoDB and none is running, start one locally:
  ```bash
  docker run -d --name autowrx-mongo-test -p 27017:27017 mongo:4.4.6-bionic
  ```
  (Stop with `docker stop autowrx-mongo-test` when done.)

### Frontend (`frontend/`)
- No unit-test runner is wired; rely on type-check + build + lint:
  ```bash
  cd frontend && npm run tsc        # type-check
  cd frontend && npm run lint       # ESLint --max-warnings 0
  cd frontend && npm run build      # tsc && vite build
  ```

### E2E (Playwright, `.agents/`)
```bash
cd .agents && npm install && npx playwright install chromium
cd .agents && npx playwright test                              # all specs
cd .agents && npx playwright test tests/auth.spec.ts           # one spec
cd .agents && npx playwright test --headed                    # visible browser
cd .agents && npx playwright test --screenshot=only-on-failure
```
- Copy `.agents/.env.example` → `.agents/.env` (gitignored) before running E2E.

### Lint/format (run alongside tests)
```bash
cd backend && npm run lint && npm run prettier
cd frontend && npm run lint
```

## What passing looks like
- Jest: `Tests: N passed, N total` and exit code 0. Open handles warnings should be investigated, not ignored.
- Playwright: `N passed (N total)` with exit code 0; `only-on-failure` produces no screenshots.
- ESLint/Prettier/tsc/vite build: exit 0, no errors. Frontend lint fails on any warning (`--max-warnings 0`).

## How to read failures
- Read the first failure's stack first; later failures are often downstream.
- For Playwright, open the HTML report (`npx playwright show-report`) and the failure screenshot/trace.
- Distinguish: assertion failure (your code) vs infrastructure (DB down, port in use, missing `.env`) vs flake (re-run once to confirm).

## Guardrails
- Don't mark done if tests fail. If you can't run a suite (no DB, no browser, no env), say so explicitly and report what you did run.
- Don't disable lint/test rules silently to make green — fix the code or surface the conflict.
- Don't run destructive commands (`rm -rf`, `down.sh` on prod) to "fix" a test env.

## Exit criteria
- The affected suites are green (with exact commands + counts cited), OR failures are reported honestly with output and a next-step proposal.