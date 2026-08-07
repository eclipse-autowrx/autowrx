# AutoWRX Agentic Coding Framework

A **repo-resident, vendor-neutral** framework that lets any AI coding agent — Claude Code, opencode, openclaw, or the next tool — work the same way in this repo: load the same rules, memory, skills, and repo map; follow the same implement → test → review → commit → PR → deploy flow; and avoid re-scanning the whole repo each session.

> Issue: #612 · Design: [`docs/agentic-framework/PROPOSAL.md`](../docs/agentic-framework/PROPOSAL.md)

## Layout

```
AGENTS.md                       vendor-neutral entry point (read by every tool)
CLAUDE.md                       Claude Code adapter (@imports AGENTS.md)
agentic/
  README.md                     this file
  RULES.md                      hard rules (must / must-not)
  CONVENTIONS.md                naming, structure, commit, PR style
  SETUP.md                      how to wire this repo into each tool
  skills/                       skill playbooks (load-on-demand procedures)
    README.md                   skill index
    understand-the-repo.md
    implement-feature.md
    run-tests.md
    code-review.md
    security-review.md
    commit-and-pr.md
    deploy.md
    docs-update.md
    learn-and-update.md
  memory/                       repo-resident knowledge base (facts + index)
    MEMORY.md                   index (one line per fact)
  map/                          repo map: pointers to the real maps + compact tree
    INDEX.md
    TREE.md
  learning/                     continuous-learning layer
    README.md
    best-practices.md
    trends.md
    lessons.md
```

## How an agent uses this (the contract)

1. On start, read `AGENTS.md` (and the tool's adapter, e.g. `CLAUDE.md`). It imports `agentic/RULES.md` + `agentic/CONVENTIONS.md` — these are the **always-loaded** rules.
2. Before doing real work, run the **`understand-the-repo`** skill: load `agentic/map/INDEX.md` + `agentic/memory/MEMORY.md` instead of re-scanning the repo. Deep-read only the specific module you'll touch.
3. For a task, load the matching **skill** from `agentic/skills/` (skills are markdown; load on demand, not all at once).
4. Follow the canonical flow in `agentic/skills/implement-feature.md`.
5. When you learn something durable, propose it into `agentic/memory/` or `agentic/learning/` via a PR (see `learn-and-update` skill).

## What is NOT duplicated here

This framework **points to** existing repo knowledge rather than copying it:

- **Architecture / deep-dive** → [`docs/architecture/`](../docs/architecture/)
- **Capability catalog** → [`docs/capabilities/`](../docs/capabilities/) (the spec/acceptance reference)
- **Pages & feature coverage** → [`.agents/SITEMAP.md`](../.agents/SITEMAP.md)
- **Getting started / local dev / contributing** → [`docs/getting-started/`](../docs/getting-started/)
- **Design principles** → [`docs/principles/principle.md`](../docs/principles/principle.md)
- **E2E tests** → [`.agents/`](../.agents/) (Playwright)

`agentic/map/` is an **index of pointers** to the above, plus a compact `TREE.md`. Update pointers when docs move; don't copy their content.

## Vendor neutrality

Canonical content lives in `agentic/`. Tool-specific entry files are thin adapters:
- **Claude Code** → `CLAUDE.md` uses `@import` to pull in `AGENTS.md` / `agentic/*`.
- **opencode / openclaw / others** → read `AGENTS.md` natively (agents.md spec).
- **Skills** are plain markdown loaded on demand — every tool can read them. To get native Skill-tool invocation in Claude Code, see `SETUP.md` (symlink `agentic/skills/*` into `.claude/skills/`).

See [`SETUP.md`](./SETUP.md) for per-tool wiring.