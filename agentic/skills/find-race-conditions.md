# Skill: Find Race Conditions
> Hunt concurrency bugs in a codebase that has NO MongoDB transactions.

## When to use
Run this when a bug is timing-sensitive: flaky under load, "works on second click", lost updates, duplicate counters, stale lists, or any symptom that disappears when you add a log/print (serialization). Also run proactively on diffs that touch counters, read-modify-write flows, token refresh, Socket.IO event ordering, or prototype/file seeding. This repo has **no** `withTransaction` / `session.startTransaction` anywhere — atomicity is document-level only (`findOneAndUpdate`, `$inc`, `$push`). Pair with `./run-tests.md` and `./add-test.md` to lock a repro.

## Steps

### 1. Find read-modify-write sequences
Grep the touched area for the unsafe pattern: a `find()`/`findById()` (or `findOne()`) followed by in-JS mutation and `.save()` (or a second update).
```
backend/src/services: grep -nE "\.findById\(|\.findOne\(|\.find\(" *.service.js
backend/src/services: grep -nE "\.save\(\)|\.updateOne\(|\.updateMany\(" *.service.js
```
Any doc read, mutated in JS, then `.save()` is a lost-update candidate. Convert to **atomic** `findOneAndUpdate` / `findByIdAndUpdate` with `$set`, `$inc`, `$push`, `$pull` so the read+write is one Mongo op. If you need read-then-write semantics that can't be a single operator, use an optimistic-concurrency guard (`__v` / version key or a `updatedAt` compare in the filter) — still document-level, no session.

### 2. Counter increments
Any `count = doc.count; doc.count = count + 1; doc.save()` is wrong. Use `findOneAndUpdate({ _id }, { $inc: { count: 1 } })`. Check `models/*.model.js` for counter fields and audit their increment sites.

### 3. Token-refresh single-flight (frontend)
`frontend/src/stores/authStore.ts` (and the 401-interceptor) implements single-flight refresh: concurrent 401s queue, the first triggers refresh, queued requests replay after success; on refresh failure, `logOut`. Bugs to look for: a second refresh firing before the first resolves (double `POST /auth/refresh` → rotated refresh token invalidated → cascade logout), queued requests replayed with the wrong token, or the queue not cleared on failure. Verify the inflight promise is shared, not re-created per caller.

### 4. Socket.IO event ordering
Server: `backend/src/config/socket.js`. Events: `subscribe_apis`, `run_python_app`, `run_rust_app`, `stop_python_app`, `run_until_complete`, `fetchSignalMapping`, `replaceSignalMapping`, `fetchVss`, `replaceVss`, `replaceApi`.
- **subscribe must precede run:** a `run_*` without a prior `subscribe_apis` (or one that arrives after a reconnect) silently no-ops. Confirm subscribe is awaited/acked before run is emitted.
- **concurrent run/stop:** `stop_*` racing `run_*` can leave the runtime thinking an app is running while the UI thinks it's stopped, or vice versa. Serialize per-app (per-id in-flight guard) or use an explicit state machine.
- **replace* races:** `replaceSignalMapping` / `replaceVss` / `replaceApi` issued back-to-back can interleave at the kit server; if order matters, await each ack before emitting the next.

### 5. Seed-vs-save race (canonical example)
Commit **6bd6ccb** fixed the prototype seed race: `seedPrototypeFiles` only ran at workspace-prepare time and bailed if the folder was non-empty; the frontend POSTed files via `/v2/prototypes/:id/files` before prepare, so the seed was always skipped and new prototypes got no README/main.* templates. The fix moved `seedPrototypeFiles` **into `createPrototype` synchronously before the response returns**, so no frontend save can race it. When you see any new "create X then async-init X then user writes X" flow, apply the same pattern: init synchronously inside the create handler, or guard the init against concurrent writes with an atomic flag/lock. Files: `backend/src/services/prototype.service.js`, `backend/src/services/orchestrator.service.js`.

### 6. CACHE_URL eventual consistency
Recent/popular prototypes come from `${CACHE_URL}/get-recent-activities/:userId` (`services/prototype.service.js` ~line 260), **not** the DB. A create followed immediately by a "recent" list read may return stale data (the cache hasn't caught up). Don't "fix" this by reading the DB instead; either invalidate/bust the cache on write, or design the UI to tolerate eventual consistency. Note any new list endpoint backed by `CACHE_URL` so callers know it's not read-after-write consistent.

### 7. Other concurrency surfaces
- Filesystem races in plugin unzip (`spawn('unzip', …)` in `controllers/plugin.controller.js`) — concurrent uploads to the same slug/dir.
- `Promise.all` over a shared mutable array where order matters.
- Async middleware that doesn't `await` before `next()`.

## Guardrails
- **Do not introduce `withTransaction` / `session.startTransaction`** without confirming the Mongo deployment is a replica set and the team is OK with the operational cost. Prefer atomic single-doc ops.
- Prefer `findOneAndUpdate` with atomic operators over read-then-`.save()`. Only escalate to optimistic concurrency or a logical lock if a single operator can't express the update.
- **Add a test that reproduces the concurrency** (parallel requests / interleaved events) before fixing — see `./add-test.md`. A race "fix" without a repro test is not verified.
- Don't paper over a race with a `setTimeout`/`sleep` or by adding a log line that serializes the code. That hides it, not fixes it.
- When fixing frontend single-flight, don't rotate the refresh token twice — that invalidates every queued caller.

## Exit criteria
Return: each race found with **`file:line`**, the **interleaving** that triggers it (concrete sequence of events/requests), the **fix** (atomic op / single-flight / serialize / synchronous-init), and the **repro test** added (path) or why one wasn't possible. If you reviewed a diff and found none, list the concurrency surfaces you checked (counters, RMW, refresh, socket ordering, seed, cache) so the caller knows the audit was real.