# Decisions (ADR-style)

Key choices and their rationale, kept short. Date each entry; supersede, don't silently rewrite.

## 2026-08-07 — Agentic framework is repo-resident and vendor-neutral

- **Context:** multiple AI coding tools (Claude Code, opencode, openclaw) work in this repo.
- **Decision:** canonical rules/memory/skills/map live in `agentic/`; tool-specific entry files (`CLAUDE.md`, `AGENTS.md`) are thin adapters that import canonical content (Claude Code via `@path`).
- **Rationale:** avoids drift between tools; one place to update rules.
- **Consequences:** never duplicate rules into an adapter; update `agentic/*` and let adapters pull through.

## 2026-08-07 — Map is pointers, not copies

- **Context:** `docs/architecture/`, `docs/capabilities/`, `.agents/SITEMAP.md` already describe the repo.
- **Decision:** `agentic/map/` is an index of pointers + a compact `TREE.md`; it does not re-narrate those docs.
- **Rationale:** duplication rots; the source docs are code-grounded and maintained.
- **Consequences:** when docs move, update pointers; when code structure changes, update `TREE.md` and (if a capability changed) `docs/capabilities/`.

## 2026-08-07 — Learning updates are proposals via PR

- **Context:** agents learn things every session; auto-editing rules is dangerous.
- **Decision:** new best-practices/trends/lessons land in `agentic/learning/`; changes to `RULES.md` / `CONVENTIONS.md` / `memory/` are PR proposals, never auto-applied.
- **Rationale:** keeps the always-loaded rule set stable and reviewable.