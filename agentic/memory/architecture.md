# Architecture facts

Durable structural facts that span layers and aren't obvious from a single file. For deep-dive narratives, load [`docs/architecture/`](../../docs/architecture/) instead.

- **Two-process backend:** `backend/src/index.js` boots the Express app (`app.js`); `app.js` wires middleware + mounts `routes/v2` under a versioned prefix. There is no separate worker process — scheduled/cron-style work lives in `scripts/`.
- **Route grouping by domain, not by HTTP verb:** `routes/v2/{user-management,vehicle-data,content,system}/` each have an `index.js` that aggregates that domain's `*.route.js` files. Add a new endpoint to the matching domain, not a flat list.
- **Layering is enforced by convention, not by tooling:** routes → thin controllers → services (logic) → models (Mongoose). Nothing prevents a controller from importing a model directly; reviewers must hold the line. See [`docs/principles/principle.md`](../../docs/principles/principle.md).
- **Frontend state is Zustand, not Redux:** stores in `frontend/src/stores/` (`authStore.ts`, …). Permissions read via `hooks/usePermissionHook.ts`. Routing is a single file: `configs/routes.tsx`.
- **Deploy is a single Compose stack:** `instance-setup/docker-compose.prod.yml` defines `autowrx`, `autowrx-db`, `autowrx-dbdata`, `autowrx-network`. `up.sh` / `down.sh` are thin wrappers around `docker compose`. No k8s, no separate CDN.