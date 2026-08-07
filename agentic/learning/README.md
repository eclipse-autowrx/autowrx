# Learning Layer

Continuous-learning notes for agents working in this repo. Three files, each with a different cadence:

- [`best-practices.md`](best-practices.md) — dated, sourced practices for this stack. Reviewed periodically; mark `Last reviewed:` so staleness is visible.
- [`trends.md`](trends.md) — light watch-list of things to research next; explicitly a seed, not authoritative.
- [`lessons.md`](lessons.md) — append-only log of concrete lessons from real sessions, one line per entry.

## The loop

1. During a session, the [`learn-and-update`](../skills/learn-and-update.md) skill researches a topic (web/docs/code) and captures **dated + sourced** notes into `best-practices.md` or `trends.md`.
2. Concrete session lessons (a bug, a surprise, a correction) get appended to `lessons.md` as one line: `- YYYY-MM-DD — <session> — <lesson> (source)`.
3. **Updates to `RULES.md` / `CONVENTIONS.md` / `agentic/memory/` are PROPOSALS via PR, never auto-applied.** The always-loaded rule set stays stable and reviewable; learning lives here until it earns a promotion.

## When to update

- You re-discovered something a previous session clearly already knew → it belongs in `memory/` (propose it).
- You hit a stack-specific gotcha → append to `lessons.md` and, if recurring, propose a `memory/gotchas.md` entry.
- A best practice may have shifted (new Node/Vite/Playwright release) → research via the skill, update `best-practices.md` with a new `Last reviewed:` date.