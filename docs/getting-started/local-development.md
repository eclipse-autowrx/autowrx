# Local Development

Get the full AutoWRX stack running locally: **MongoDB → backend (:3200) →
frontend (:3210)**. Target time: ~10 minutes.

> This is the quickstart. For exhaustive setup, environment variables, and
> troubleshooting, see the detailed [Development Guide](development-guide.md)
> and the [Backend Dev Setup](../../backend/docs/setup-dev.md).

---

## Prerequisites

- **Node.js 18+** and **Yarn** (the repo uses Yarn 1.x)
- **Docker** (simplest way to run MongoDB) — or a local MongoDB
- **Git**

---

## 1. Clone

```bash
git clone https://github.com/eclipse-autowrx/autowrx.git
cd autowrx
```

## 2. Start MongoDB

A single Docker container is enough for development:

```bash
docker run -d --name autowrx-mongodb -p 27017:27017 \
  -v autowrx-dev-dbdata:/data/db mongo:4.4.6-bionic
```

The backend expects `MONGODB_URL=mongodb://localhost:27017/autowrx` (already the
default in the dev `.env`).

## 3. Backend → http://localhost:3200

```bash
cd backend
yarn install
# ensure a .env exists (see development-guide.md for the full list);
# key dev values: PORT=3200, MONGODB_URL=mongodb://localhost:27017/autowrx,
#                 STRICT_AUTH=false, ADMIN_EMAILS=..., ADMIN_PASSWORD=...
yarn dev
```

On first boot the backend connects to MongoDB, seeds roles / an admin user /
predefined site configs and project templates, and listens on **:3200**. You
should see `Connected to MongoDB` and `Listening to port 3200`.

> `STRICT_AUTH=false` opens the auth feature flags (public viewing,
> self-registration) so you can browse without friction while developing. See
> [Auth & Security](../architecture/auth-security.md#5-site-auth-configs-feature-gates).

## 4. Frontend → http://localhost:3210

In a **new terminal**:

```bash
cd frontend
yarn install
yarn dev
```

Vite serves the app on **:3210** and proxies API calls to the backend.

## 5. Open the app

Go to **http://localhost:3210**. Sign in with the admin credentials from the
backend `.env` (`ADMIN_EMAILS` / `ADMIN_PASSWORD`), or register a new user
(self-registration is on when `STRICT_AUTH=false`).

---

## Everyday commands

| Task | Command (in `backend/` or `frontend/`) |
|---|---|
| Run backend (watch) | `yarn dev` |
| Run frontend (watch) | `yarn dev` |
| Backend tests | `yarn test` (Jest) |
| Frontend typecheck | `npx tsc --noEmit` |
| Frontend production build | `yarn build` |

---

## Common gotchas

- **Backend won't start / Mongo errors** → is the `autowrx-mongodb` container
  running? `docker ps`. Restart with `docker start autowrx-mongodb`.
- **CORS errors in the browser** → the backend `CORS_ORIGINS` must allow
  `localhost:<port>` (the default regex does).
- **401s / can't stay logged in** → the refresh token is an HttpOnly cookie;
  make sure you're on `http://localhost:3210` (not `127.0.0.1`, unless that
  origin is allowed) so cookies match. See
  [Auth & Security](../architecture/auth-security.md).
- **Ports busy** → backend is `:3200`, frontend `:3210`; stop stale processes
  first.

For anything not covered here, the [Development Guide](development-guide.md)
has the full detail and a troubleshooting section.

Next: [Codebase Tour »](./codebase-tour.md)
