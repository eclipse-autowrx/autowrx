# AutoWRX Architecture

This section is a comprehensive, code-verified reference for how AutoWRX is
built. It is aimed at engineers who need to understand or extend the platform.
For the guiding *principles* behind these decisions, see
[Design Principles](../principles/principle.md) and [Platform Concepts](../principles/concept.md).

> **Scope of this document (`README.md`):** the big picture — system context,
> technology stack, repository layout, and a map of the deep-dive documents.
> Each subsystem has its own file (linked in [§6](#6-deep-dive-map)).

---

## 1. What AutoWRX is

AutoWRX is a cloud-based, rapid-prototyping environment for **software-defined
vehicle (SDV)** applications and part of the [digital.auto](https://digital.auto)
ecosystem. In the browser, a developer can browse vehicle API catalogs, build
and run prototypes (Python / C++ / Rust) against real vehicle signals, visualize
live data from vehicle runtimes, and package the result for migration to
production automotive runtimes such as Eclipse Velocitas.

It is a **monorepo** of two independently-runnable services — a React frontend
and an Express backend — backed by MongoDB, with real-time signal streaming over
Socket.IO and an extensible plugin layer.

---

## 2. System context

```mermaid
flowchart LR
    User([Developer / Browser])

    subgraph AutoWRX["AutoWRX platform (monorepo)"]
        FE["Frontend<br/>React + Vite + TS<br/>(:3210 dev)"]
        BE["Backend<br/>Express 4 API<br/>(:3200 dev)"]
    end

    DB[("MongoDB<br/>(Mongoose)")]
    KIT["Kit-manager server<br/>(external, e.g. kit.digitalauto.tech)<br/>→ vehicle runtimes / kits"]
    PL["Plugins<br/>(dynamic-URL JS bundle)"]

    User -->|HTTPS / REST| FE
    FE -->|REST /v2, cookies (JWT)| BE
    FE <-->|Socket.IO: live signals| KIT
    FE <-->|Socket.IO: OAuth push| BE
    BE --> DB
    FE -. loads UI components .-> PL
    BE -. stores / serves internal .-> PL
```

> **Important:** live vehicle-signal streaming does **not** go through the
> AutoWRX backend. The frontend connects **directly** to an external
> *kit-manager* server over Socket.IO. The backend's own Socket.IO is used only
> for authenticated push (e.g. GitHub OAuth results). See
> [realtime-signals.md](./realtime-signals.md).

In production the backend also **serves the built frontend** as static assets,
so the two ship together as one deployable image (see the root
[`README.md`](../../README.md) and `backend/Dockerfile`).

---

## 3. Technology stack

All versions below are taken from the current `package.json` files.

### Frontend (`frontend/`)

| Concern | Choice |
|---|---|
| Language / build | TypeScript, **Vite 5**, React 18 |
| Routing | `react-router-dom` 6 |
| Server state | **TanStack Query 5** (`@tanstack/react-query`) |
| Client state | **Zustand 5** stores |
| HTTP | `axios` |
| Styling | **Tailwind CSS 4** |
| Component model | Atomic design — `atoms / molecules / organisms` |
| Realtime | `socket.io-client` |

### Backend (`backend/`)

| Concern | Choice |
|---|---|
| Runtime / framework | Node.js, **Express 4** |
| Data | **MongoDB** via **Mongoose 8** |
| Auth | **Passport** + `jsonwebtoken` (JWT), HttpOnly cookies |
| Validation | **Joi** |
| Realtime | **Socket.IO 4** (`backend/src/config/socket.js`) |
| Logging | **Winston** |
| Proxying | `http-proxy-middleware` |

---

## 4. Repository layout

```
autowrx/
├── frontend/                 # React + Vite app (dev :3210)
│   └── src/
│       ├── components/        #   atoms / molecules / organisms
│       ├── pages/  layouts/   #   route targets & shells
│       ├── hooks/  services/  #   data fetching (TanStack Query + axios)
│       ├── stores/            #   Zustand client state
│       ├── providers/  lib/  utils/  types/  const/
│       └── main.tsx  App.tsx
├── backend/                  # Express API (dev :3200)
│   └── src/
│       ├── routes/            #   v2, content, system, user-management, vehicle-data
│       ├── controllers/       #   HTTP handlers
│       ├── services/          #   business logic
│       ├── models/            #   Mongoose schemas
│       ├── validations/       #   Joi schemas
│       ├── middlewares/  decorators/  typedefs/  config/  utils/
│       └── app.js  index.js
├── docs/                     # documentation (you are here)
└── instance-setup/           # production docker-compose + guides
```

---

## 5. The Core-vs-Plugin model (in brief)

AutoWRX keeps a **lean, stable core** (authentication, base page rendering,
model/prototype CRUD) and pushes most feature surface into **plugins**. Plugins
integrate in two ways:

1. **npm package** — the production path, versioned and built in.
2. **Dynamic URL loading** — a JavaScript bundle fetched at runtime and
   registered with the app, for rapid development or SaaS environments where the
   core is not rebuilt.

The frontend's **dynamic component architecture** lets plugin-provided UI render
inside core pages based on configuration. The full treatment is in
[plugin-system.md](./plugin-system.md); the philosophy is in
[core-vs-plugin.md](../principles/core-vs-plugin.md).

---

## 6. Deep-dive map

| Document | Covers |
|---|---|
| [frontend.md](./frontend.md) | Atomic-design components, routing, state (Zustand + TanStack Query), the axios service layer, dynamic plugin UI, Tailwind styling |
| [backend.md](./backend.md) | Express request pipeline (`route → Joi → controller → service → Mongoose`), route groups, middlewares, logging, error handling |
| [plugin-system.md](./plugin-system.md) | Core-vs-plugin in depth, npm vs dynamic-URL integration, dynamic component rendering |
| [auth-security.md](./auth-security.md) | Passport + JWT, access/refresh token lifecycle, HttpOnly cookies, RBAC, CORS & CSP |
| [data-model.md](./data-model.md) | MongoDB collections, Mongoose schemas, entity relationships |
| [realtime-signals.md](./realtime-signals.md) | Socket.IO flow, runtime/kit connection, live signal streaming |
| [request-lifecycle.md](./request-lifecycle.md) | End-to-end trace stitching frontend → backend → DB → realtime |

### Related existing references

- [Custom API System](../guides/custom-api-system.md)
- [Plugin guide (6 parts)](../guides/plugin/README.md)
- [Authentication cookie handling](../reference/authentication-cookie-handling.md)
- [CORS](../reference/cors.md) · [CSP](../reference/csp.md)
- [Backend: DB collections](../../backend/docs/db-collections.md)
