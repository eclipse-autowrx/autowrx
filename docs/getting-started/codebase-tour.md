# Codebase Tour

A guided map of the monorepo for someone about to make their first change. For
the deep architecture, follow the links into
[docs/architecture/](../architecture/README.md).

---

## Top level

```
autowrx/
├── frontend/            React + Vite + TypeScript SPA (dev :3210)
├── backend/             Node.js + Express API + MongoDB (dev :3200)
├── docs/                documentation (you are here)
├── instance-setup/      production docker-compose + guides
└── .github/workflows/   CI: docker build/release, dev-stage deploy
```

The backend also **serves the built frontend** in production, so the two ship as
one image.

---

## Frontend (`frontend/src/`)

```
components/   atoms · molecules · organisms   (atomic design; Da* = project components)
pages/        route targets (PageHome, PageModelList, PagePrototypeDetail, …)
layouts/      shells (RootLayout, ModelDetailLayout)
hooks/        TanStack Query data hooks (useCurrentModel, usePermissionHook, …)
services/     axios API clients (base.ts + one module per domain)
stores/       Zustand client state (authStore, modelStore, runtimeStore, …)
providers/    QueryProvider, SuspenseProvider
configs/      routes.tsx, config.ts        types/ const/ data/ lib/ utils/
```

Deep dive: [architecture/frontend.md](../architecture/frontend.md).

## Backend (`backend/src/`)

```
routes/v2/    user-management · vehicle-data · content · system   (the REST surface)
controllers/  thin HTTP handlers (catchAsync)
services/     business logic + all DB access
models/       Mongoose schemas (the data model)
validations/  Joi schemas          middlewares/  auth, permission, validate, error
config/       config.js, passport.js, socket.js, roles.js, rolesV2.js
```

The request pipeline is `route → auth → permission → validate → controller →
service → model`. Deep dive: [architecture/backend.md](../architecture/backend.md).

---

## "Where do I change…?"

| I want to… | Look here |
|---|---|
| Add/adjust a **page or route** | `frontend/src/configs/routes.tsx` + `frontend/src/pages/` |
| Change a **UI component** | `frontend/src/components/{atoms,molecules,organisms}/` |
| Add a **REST endpoint** | `backend/src/routes/v2/<group>/`, then controller → service → (validation) |
| Change a **DB schema** | `backend/src/models/*.model.js` → [data-model.md](../architecture/data-model.md) |
| Touch **auth / permissions** | `backend/src/middlewares/{auth,permission}.js`, `services/permission.service.js`, `frontend/src/hooks/usePermissionHook.ts` → [auth-security.md](../architecture/auth-security.md) |
| Work on **live signals / runtime** | `frontend/src/components/molecules/DaRuntimeConnector.tsx`, `stores/runtimeStore.ts` → [realtime-signals.md](../architecture/realtime-signals.md) |
| Build a **plugin** | [Plugin guide](../guides/plugin/README.md) + [plugin-system.md](../architecture/plugin-system.md) |
| Add a **feature flag / site config** | `backend/src/models/siteConfig.model.js`, `config/predefinedSiteConfigs.js`; frontend `utils/siteConfig.ts` |
| Change **API client calls** | `frontend/src/services/*.service.ts` (all go through `base.ts`) |

---

## Conventions to match

- **Frontend**: atomic-design layering (pages compose organisms → molecules →
  atoms); pages hold layout, not business logic; server state via TanStack Query,
  client state via Zustand. Project components are `Da`-prefixed.
- **Backend**: keep controllers thin; put logic in services; validate with Joi;
  throw `ApiError`; never call Mongoose from a controller.
- **Both**: files carry the Eclipse **MIT SPDX header**; follow the existing
  style of the file you're editing.

See [Design Principles](../principles/principle.md) for the full rules.

Next: [Contributing »](./contributing.md)
