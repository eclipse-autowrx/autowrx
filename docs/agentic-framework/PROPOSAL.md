# Proposal: Vendor-Neutral Agentic Coding Framework for AutoWRX

> Issue: #612 · Branch: `feat/612-agentic-coding-framework`
> Status: **Implemented (full framework, all layers).** Canonical content lives in `agentic/` at repo root (chosen over `.agent/` to avoid colliding with the existing `.agents/` E2E suite). The framework **wires into** existing repo knowledge (`docs/architecture/`, `docs/capabilities/`, `.agents/SITEMAP.md`, `docs/getting-started/`, `docs/principles/`) rather than duplicating it. Entry points: `AGENTS.md` + `CLAUDE.md`. See [`agentic/README.md`](../../agentic/README.md). The decisions below were resolved as: dir `agentic/`; reuse `docs/capabilities/` as the map; committed map + CI drift check; learning included with manual trigger; full scope (no phasing).

## 1. Problem

How an AI coding assistant behaves in this repo depends on which tool we run (Claude Code, opencode, openclaw, …). Each tool:

- re-learns the repo and re-scans/indexes code every session → **token waste**;
- follows its own implicit rules → **inconsistent** commits, tests, PRs;
- stores context in tool-specific, often user-local locations → **not portable**, lost across tools or machines.

There is no repo-resident source of truth for *how an agent should work here*.

## 2. Goals

1. **One set of rules, memory, and skills that lives in the repo** — any agent loads the same context.
2. **Vendor-neutral** — no lock-in to Claude Code / opencode / openclaw; expressed in portable formats each tool can consume.
3. **Token-efficient** — agents load a pre-built map + memory instead of re-scanning the whole repo each session.
4. **Consistent flow** — same branch → implement → test → self-review → commit → PR → deploy discipline regardless of tool.
5. **Self-improving** — a mechanism to capture best practices/trends (from the internet and from real sessions) and fold them back into skills/memory.

## 3. Principles

- **Repo as the source of truth.** Agent config travels with the repo, not the user's home dir.
- **Canonical content written once, mapped per tool.** Write rules/memory/skills in vendor-neutral files; thin tool-specific adapters point to them.
- **Load-on-demand.** Entry files stay tiny; detail is imported/referenced so token cost scales with what's actually needed.
- **Human-reviewable.** Everything is markdown a human can read and edit; no opaque binary state.

## 4. Architecture (layers)

```
┌─────────────────────────────────────────────────────────┐
│  Layer 0 — Entry points (tool adapters, tiny)           │
│  CLAUDE.md  ·  AGENTS.md  ·  .opencode/  ·  openclaw cfg │
│      │ each imports/points to Layer 1                    │
├─────────────────────────────────────────────────────────┤
│  Layer 1 — Rules & conventions (canonical)              │
│  .agent/RULES.md  ·  .agent/CONVENTIONS.md              │
├─────────────────────────────────────────────────────────┤
│  Layer 2 — Skills / playbooks (procedures)              │
│  .agent/skills/*.md  (understand, review, test, deploy, │
│   commit, pr, security-review, docs-update, …)          │
├─────────────────────────────────────────────────────────┤
│  Layer 3 — Memory & knowledge base (repo-resident)      │
│  .agent/memory/*.md  +  MEMORY.md index                 │
├─────────────────────────────────────────────────────────┤
│  Layer 4 — Repo map (always-current codebase index)     │
│  .agent/map/TREE.md  ·  ARCHITECTURE.md  ·  DATAFLOW.md │
├─────────────────────────────────────────────────────────┤
│  Layer 5 — Continuous learning                          │
│  .agent/learning/*.md  +  learn-and-update skill        │
└─────────────────────────────────────────────────────────┘
```

Everything under `.agent/` is **canonical and vendor-neutral**. Tool-specific entry files (Layer 0) are thin adapters that import/point into `.agent/`.

## 5. Proposed file layout

```
AGENTS.md                      # vendor-neutral entry (agents.md spec); imports .agent/*
CLAUDE.md                      # Claude Code entry; imports agentic/* via @path (Claude Code supports @path imports)
.agent/
  RULES.md                     # hard rules (must / must-not)
  CONVENTIONS.md               # naming, structure, commit, PR style
  skills/
    README.md                  # skill index
    understand-the-repo.md
    implement-feature.md
    run-tests.md
    code-review.md
    security-review.md
    commit-and-pr.md
    deploy.md
    docs-update.md
    learn-and-update.md
  memory/
    MEMORY.md                  # index (one line per fact)
    architecture.md
    gotchas.md
    verified-facts.md
    decisions.md               # ADR-style
  map/
    TREE.md                    # repo file tree w/ one-line purpose per module
    ARCHITECTURE.md            # subsystems + boundaries
    DATAFLOW.md                # request/data flow diagrams
  learning/
    README.md                  # how learning works
    best-practices.md          # captured, dated, sourced
    trends.md
.opencode/                     # opencode adapter (symlinks/pointers to .agent)
.claude/                       # Claude Code adapter (skills symlinked to .agent/skills)
```

## 6. Vendor-neutral mapping

| Artifact | Canonical | Claude Code | opencode | openclaw / other |
|---|---|---|---|---|
| Entry rules | `AGENTS.md` | `CLAUDE.md` imports it via `@path` | reads `AGENTS.md` natively | reads `AGENTS.md` (agents.md spec) |
| Rules/conventions | `.agent/RULES.md`, `CONVENTIONS.md` | imported via `CLAUDE.md` | imported via `AGENTS.md` | imported via `AGENTS.md` |
| Skills | `.agent/skills/*.md` | `.claude/skills/` → symlink/point to `.agent/skills` | opencode skills dir → same | read from `.agent/skills` |
| Memory | `.agent/memory/*.md` + index | `CLAUDE.md` instructs load on start | `AGENTS.md` instructs load | same |
| Repo map | `.agent/map/*` | loaded on demand by `understand-the-repo` skill | same | same |
| Learning | `.agent/learning/*` | `learn-and-update` skill | same | same |

**Key:** write once in `.agent/`, adapt in Layer 0. If a tool lacks a native concept (e.g. no "skills"), the entry file instructs the agent to read the skill markdown when the task matches — skills are just markdown either way.

## 7. Skills catalog (Layer 2)

Each skill is a markdown playbook: *when to use · steps · guardrails · exit criteria*.

- **understand-the-repo** — load `.agent/map/*` + memory instead of re-scanning; returns a concise mental model. (Primary token saver.)
- **implement-feature** — branch → load relevant map/memory → implement → run `test` + `review` skills → commit → PR.
- **run-tests** — how tests are run here (frontend/backend), what passing looks like, how to interpret failures.
- **code-review** — self-review checklist before commit (reuse, simplification, correctness, altitude).
- **security-review** — security review of the diff (the repo already has a `/security-review` skill — fold it in).
- **commit-and-pr** — commit with the contributor's own ECA-signed identity, conventional messages, PR template, ECA note.
- **deploy** — instance-setup flow (`instance-setup/up.sh`, docker-compose.prod.yml), env requirements.
- **docs-update** — keep `docs/capabilities/*` and `.agent/map/*` in sync with code changes.
- **learn-and-update** — periodically research current best practices/trends on the web, capture dated+sourced notes in `.agent/learning/`, and propose updates to skills/memory via PR.

## 8. Memory & repo map (Layers 3–4)

- **Memory** — repo-resident facts (architecture, gotchas, verified facts, decisions). One fact per file + a `MEMORY.md` index. Crucially: this lives **in the repo**, unlike Claude Code's default user-local memory, so it's shared across tools/machines and reviewable in PRs.
- **Repo map** — a committed, human+agent-readable index: `TREE.md` (module → one-line purpose), `ARCHITECTURE.md` (subsystems/boundaries), `DATAFLOW.md` (request/data flow). The agent reads ~a few KB instead of indexing thousands of files each session. Kept current by the `docs-update` skill (regenerate on structural changes; guard against drift with a CI check).

**Token-savings estimate (rough):** a cold session today may scan dozens of files (tens of thousands of tokens) to orient. With map+memory the agent loads a curated few KB (~1–3k tokens) and only deep-reads the specific module it touches. Order-of-magnitude reduction on the orientation step, repeated every session.

## 9. Canonical flows (wired into skills)

```
feature request
  → implement-feature skill
    → branch off main
    → understand-the-repo (load map+memory)
    → implement (follow CONVENTIONS)
    → run-tests
    → code-review (self)  →  security-review (if touching auth/data/runtime)
    → commit-and-pr
  → (human) review & merge
  → docs-update (sync map/capabilities if structure changed)
```

Deploy and learn-and-update are separate flows triggered on demand or on a schedule.

## 10. Continuous learning (Layer 5)

- `learn-and-update` skill: on trigger (manual or scheduled), research current best practices / trends / well-known patterns for the stack (Express + Mongo + React + Coder/Docker), write dated + sourced notes to `.agent/learning/`, and open a PR proposing concrete updates to skills/memory/map.
- Every real session can append a one-line "lesson learned" to `.agent/learning/lessons.md` (via a lightweight hook/reminder), so the framework gets better from actual use, not just web research.
- Guardrail: learning notes are proposals, never auto-applied to rules — a human approves via PR.

## 11. Migration path (phased)

1. **Phase 1 — Skeleton (this issue, small PR):** add `AGENTS.md` + `CLAUDE.md` adapter + `.agent/` structure with `RULES.md`, `CONVENTIONS.md`, `skills/README.md`, and seed `map/TREE.md` + `memory/MEMORY.md`. Wire Claude Code via `@path` imports. No behavior change yet beyond consistent loading.
2. **Phase 2 — Skills:** author the core skills (understand-the-repo, implement-feature, run-tests, code-review, commit-and-pr, deploy). Migrate existing `/security-review` and `/run`-style skills into `.agent/skills`.
3. **Phase 3 — Memory & map population:** fill memory + map from the now-merged `docs/capabilities/` catalog (single source reused). Add a CI drift check for the map.
4. **Phase 4 — Learning loop:** add `learn-and-update` + session-lessons capture.
5. **Phase 5 — Multi-tool validation:** run the same task with Claude Code + opencode + openclaw against the framework; confirm identical loading/flow; fix adapter gaps.

Each phase is an independent PR. Nothing is forced on existing workflows until Phase 2.

## 12. Decisions I need from you

1. **Directory name:** `.agent/` (hidden, clean tree) vs `agentic/` (visible). I propose `.agent/`.
2. **Single source for repo knowledge:** reuse the `docs/capabilities/` catalog as the canonical map (link from `.agent/map/`) instead of duplicating — agree?
3. **Map freshness:** committed + CI drift check (my recommendation) vs git-ignored + regenerated each session.
4. **Learning loop trigger:** manual only (safer) vs scheduled recurring job (faster improvement). I propose manual first, scheduled in Phase 4.
5. **Scope of Phase 1 PR:** just the skeleton + adapters (no skills yet), or skeleton + the two highest-value skills (`understand-the-repo`, `commit-and-pr`) so we feel the benefit immediately?

## 13. Out of scope (for now)

- Replacing any tool; this is a portability layer, not a tool choice.
- Auto-merging learning proposals; humans stay in the loop.
- Moving existing `.claude/` user settings into the repo beyond the adapter symlink.