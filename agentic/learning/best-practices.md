# Best Practices (seed)

Starting points for this stack — refine as we learn. Each entry has a `Last reviewed:` date and a source; if you re-verify, bump the date.

## AGENTS.md as vendor-neutral entry point

- Last reviewed: 2026-08-07
- Source: https://agents.md
- Keep `AGENTS.md` as the canonical always-loaded file; tool adapters (`CLAUDE.md`) import it via `@path` rather than duplicating rules.
- One procedure per skill file; skills are load-on-demand, not preloaded.

## Express thin-controller / service layer

- Last reviewed: 2026-08-07
- Source: [`docs/principles/principle.md`](../../docs/principles/principle.md)
- Controllers stay thin: parse/validate request, call a service, shape the response. Business logic lives in `services/`.
- Models (Mongoose) only express persistence; no HTTP-shaped errors thrown from models.

## React + Vite atomic structure

- Last reviewed: 2026-08-07
- Source: [`agentic/CONVENTIONS.md`](../CONVENTIONS.md), `frontend/src/components/`
- `atoms` → `molecules` → `organisms` → `pages`; don't put page-level data fetching inside an atom.
- State in Zustand stores (`stores/`); permissions via `hooks/usePermissionHook.ts`; routing in `configs/routes.tsx`.
- `npm run build` runs `tsc && vite build`, so type errors fail CI — treat the build as a typecheck gate.

## Playwright flakiness hygiene

- Last reviewed: 2026-08-07
- Source: [`.agents/TESTING.md`](../../.agents/TESTING.md)
- Prefer role/label selectors over CSS paths; retry only at the test level, never swallow assertions.
- Keep `.agents/SITEMAP.md` coverage status (✅/⚠️/❌) in sync when a page feature changes — it is the coverage source of truth.

## MongoDB indexes / TTL for token cleanup

- Last reviewed: 2026-08-07
- Source: general MongoDB best practice; confirm against `backend/src/models/` before applying.
- Add a TTL index on any timestamped cleanup collection (expired sessions, reset tokens) rather than relying on a cron sweep.
- Compound indexes should match actual query shapes seen in `services/` — don't index speculatively.