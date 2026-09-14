# Skill: performance-review
> Review a diff or area for performance regressions across backend (Mongo/external calls), frontend (bundle/re-renders), and Socket.IO fan-out.

## When to use
- Before merging a change that touches list endpoints, DB queries, external HTTP, frontend bundles, or realtime broadcasts.
- When a user reports slowness or scaling issues in a specific area.
- Periodic audit of a hot path (auth, prototype list, runtime, plugin load).

## Steps

### 1. Scope the review
- Identify the diff/area: `git diff main...<branch>` for a PR, or a named module/route. Read the changed controllers/services/models, frontend components/stores, and socket handlers.
- Note the user-facing flow and expected scale (rows, concurrent users, subscribers).

### 2. Backend — MongoDB
- **N+1 / over-population:** scan for loops that call `.populate()` per item, or `.find()` inside a `.map()`/`for`. Prefer a single query with `.populate()`/`aggregate` or batched lookups.
- **Pagination:** list endpoints must use the existing `page, limit, fields, include_stats` filters (see list controllers). Flag any new list route that returns unbounded results.
- **Indexes:** for any new query filter or `sort`, check the Mongoose model for a matching index. Missing indexes on hot filters → flag. Known gap: the **Token collection has NO TTL index** (see `agentic/memory/gotchas.md`) — don't add auth-token leaks that rely on cleanup; surface the gap if relevant.
- **Projection:** large docs (prototypes with code, assets) should use field projection / `fields` filter rather than returning full payloads.

### 3. Backend — external calls
- Calls proxied to `CACHE_URL` (`/get-recent-activities/:userId`) and `LOG_URL` are configured in `backend/config/axios.js`. Check:
  - Are independent external calls `await`ed sequentially when they could run in parallel (`Promise.all`)?
  - Are repeated identical calls cached (in-memory or via the cache service) instead of re-fetched per request?
  - Are timeouts/retries set so one slow downstream doesn't block the request?
- Flag any blocking CPU work on the event loop (large sync JSON parse, crypto on hot path).

### 4. Frontend (`frontend/`)
- **Bundle size:** run `cd frontend && npm run build` and inspect the `rollup-plugin-visualizer` output (configured in `vite.config.ts`). Flag large new deps or chunks that regressed the main bundle.
- **Re-renders:** check heavy components are memoized (`React.memo`, `useMemo`, `useCallback`) when parents re-render often; flag context values recreated each render.
- **Zustand selectors:** ensure components subscribe to the minimal slice via scoped selectors (`useStore(s => s.x)`) rather than whole-store subscriptions that re-render on every change.
- **Lists:** virtualize long lists; avoid inline keys that force re-mounts.

### 5. Socket.IO
- For `emit`/broadcast paths, check fan-out: does one event emit to all sockets when a room/channel would suffice? Flag O(sockets) loops that could be O(subscribers) via rooms.

### 6. Rank and report
- Rank findings by impact (user-visible latency at scale > theoretical micro-opts). For each: location (file:line), why it's slow, proposed fix, and expected effect.
- Where feasible, **measure before/after** (e.g. query `explain()`, build size diff, Playwright trace timing) rather than asserting from intuition.

## Guardrails
- Don't optimize blindly — measure and confirm the hot path before refactoring.
- Preserve correctness: pagination limits, auth/permission checks, and field projection must not bypass RBAC or leak private fields.
- Don't add an index without checking the existing model indexes (avoid duplicates); index additions are a schema change — cross-link `db-schema-change`.
- Don't trade readability for micro-gains; surface the trade-off if contested.
- Don't introduce a new dependency to shave bundle size without running `license-check` (MIT-compatible only).

## Exit criteria
- A ranked findings list with file:line, evidence (measurement or code pattern), and a concrete fix per item.
- "No issue found" is valid only if each surface (Mongo, external, frontend, socket) was actually inspected — say what you checked.
- Cross-link: `debug` for reproducing a reported slowdown, `db-schema-change` if an index/migration is the fix.