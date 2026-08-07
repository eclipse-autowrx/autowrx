# Compact Module Tree

One-line purpose per top-level dir / key subdir. Scannable, not exhaustive — no leaf files unless load-bearing. Verified against the working tree.

```
backend/src/                 Node/Express + MongoDB backend
  index.js                   process bootstrap
  app.js                     Express app: middleware + route mounting
  config/                    env/config loading
  controllers/               thin request handlers (no business logic)
  decorators/                route/metadata decorators
  docs/                      backend-local API docs
  middlewares/               auth, rateLimiter, error handlers
  models/                    Mongoose models (persistence layer)
  routes/v2/                 versioned API entry, grouped by domain:
    user-management/         auth, users, permissions, assets
    vehicle-data/            models, prototypes, custom/extended APIs
    content/                 discussions, feedback
    system/                  files, plugins, search, genai, site mgmt, templates
  services/                  business logic (called by controllers)
  scripts/                   one-off / scheduled jobs
  typedefs/                  shared TS-style type defs
  utils/                     helpers
  validations/               request schema validators

frontend/src/                React + Vite + TypeScript SPA (dev port 3210)
  App.tsx, main.tsx          app shell + bootstrap
  components/{atoms,molecules,organisms}/  atomic-design components
  pages/                     route-level views
  layouts/                   page wrappers
  stores/                    Zustand stores (auth, …)
  hooks/                     reusable hooks (usePermissionHook, …)
  services/                  API client layer
  configs/routes.tsx         single route table
  data/, providers/, lib/, utils/, types/   misc support

.agents/                     Playwright E2E suite
  tests/                     *.spec.ts
  SITEMAP.md                 page/feature coverage (✅/⚠️/❌)
  TESTING.md                 E2E conventions

instance-setup/              single-host Docker Compose deploy
  docker-compose.prod.yml    services: autowrx, autowrx-db, autowrx-dbdata, autowrx-network
  up.sh, down.sh             thin compose wrappers
  nginx-sample.conf          reverse-proxy template
  coder/                     code-server / VS Code-in-browser integration
  data/                      persisted volumes

docs/                        all human docs (index: docs/README.md)
  architecture/              subsystem deep-dives
  capabilities/              code-grounded endpoint/status/flag catalog
  getting-started/           README, concepts, local-development, codebase-tour, development-guide, contributing, internal/
  guides/                    custom-api-system, deployment, plugin
  principles/principle.md    design rules
  reference/, examples/      reference + examples

scripts/                     repo-level helper scripts
plans/                       planning notes / roadmap artifacts
```