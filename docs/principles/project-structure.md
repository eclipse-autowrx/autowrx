# Project structure

AutoWRX is a monorepo with two applications — a Node/Express **backend** and a
React/Vite **frontend** — plus deployment/tooling directories. In production the
backend also serves the built frontend, so the two ship as one image.

```
- project-root
    - backend/                     # Node.js + Express API + MongoDB
        - src/
            - index.js             # entry point: connect Mongo, boot, listen :3200
            - app.js               # Express app + ordered middleware chain
            - config/              # config.js (Joi env), passport.js, socket.js, roles(.js/V2)
            - routes/v2/           # REST surface, 4 groups:
            -   - user-management/   (auth, users, assets, permissions)
            -   - vehicle-data/      (models, prototypes, apis, extendedApis, custom-api-sets)
            -   - content/           (discussions, feedbacks)
            -   - system/            (health, search, file, site-config, plugin, *-template, genai)
            - controllers/          # thin HTTP handlers (catchAsync)
            - services/             # business logic + all DB access
            - models/               # Mongoose schemas
            - validations/          # Joi schemas
            - middlewares/          # auth, permission, validate, error, upload, rateLimiter
            - decorators/  typedefs/  utils/  scripts/  docs/
        - static/                  # served statically
            - global.css           # main stylesheet (admin-editable via site config)
            - frontend-dist/       # built frontend (output of `frontend/` build)
            - builtin-widgets/  images/  plugin/  uploads/
        - Dockerfile  Dockerfile.dev  ecosystem.config.json  jest.config.js
        - package.json  yarn.lock
    - frontend/                    # React 18 + Vite + TypeScript SPA (dev :3210)
        - src/
            - main.tsx  App.tsx
            - components/{atoms,molecules,organisms}   # atomic design (Da* = project comps)
            - pages/  layouts/  configs/  hooks/  services/  stores/
            - providers/  types/  const/  data/  lib/  utils/
        - vite.config.ts           # dev :3210, proxies /v2 /d /static /plugin /images ... to :3200
        - package.json  yarn.lock
    - instance-setup/              # production docker-compose + guides
        - docker-compose.prod.yml  up.sh  down.sh  instance-setup-guide.md  nginx-sample.conf
    - dev-stage/                   # shared dev-stage deploy (PM2) + its compose files
    - scripts/                     # auto-update.sh, setup-auto-update.sh
    - docs/                        # this documentation
    - .github/workflows/           # CI: build-docker.yml, deploy-dev-stage.yml
    - build-frontend.sh  README.md  LICENSE
```

## `backend/`

The server-side application. Entry point `src/index.js` connects MongoDB, runs
startup scripts (`convertLogsCap → initializeRoles → assignAdmins →
seedPredefinedSiteConfigs / seedProjectTemplates`), and listens on **:3200**.

- **`src/routes/v2/`** — the REST API, organized into four groups
  (`user-management`, `vehicle-data`, `content`, `system`). The request pipeline
  is `route → auth → permission → validate → controller → service → model`.
- **`src/static/`** — static assets served to the client:
  - **`global.css`** — the main stylesheet; admins can update it at runtime via
    the site-config API.
  - **`frontend-dist/`** — the compiled frontend (produced by building
    `frontend/`); served by the backend in production.
- **`Dockerfile`** — builds the production image (builds the frontend, then runs
  the backend which serves it).

## `frontend/`

The client-side source (React + Vite + TypeScript). Dev server runs on **:3210**
and proxies API paths to the backend. See
[../architecture/frontend.md](../architecture/frontend.md) for the component
model, state management, and routing.

## Production layout

There is no top-level `frontend-dist/` or root `Dockerfile`/`docker-compose.yml`.
The build output lives at `backend/static/frontend-dist/`, the image is built
from `backend/Dockerfile`, and the production stack is defined in
`instance-setup/docker-compose.prod.yml` (MongoDB + the app image).

For the deep, code-verified layout see
[../architecture/README.md](../architecture/README.md) and
[../getting-started/codebase-tour.md](../getting-started/codebase-tour.md).
