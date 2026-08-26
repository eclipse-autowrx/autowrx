# Skill: Tracking issue (full traceability)
> Find or create the tracking ticket, and keep every workstream traceable end-to-end: issue ↔ PR ↔ review ↔ release ↔ deployment.

## When to use
- Starting a recurring workstream (review duty, ops monitoring, a long feature) that needs a home
- After any review/merge/release/deploy event that must be findable later
- Before closing any issue — to keep the chain unbroken

## Steps
1. **Find the home first.** Before working a task, look for an existing tracking issue (search open issues for the workstream; check the maintainer board, e.g. the PR-review tracking issue). **No home exists → create one** (one per workstream: review duty, VM/service monitoring, a migration…), stated in outcomes not incidents.
2. **Associate at creation.** New PRs and issues cross-link their origin: `Closes #n` / `Refs #n` in the body; for work discovered mid-flight, comment `Related issue: #n` on the PR (e.g. the incident that motivated a hardening change). Nothing should exist without a pointer back to why.
3. **Record the lifecycle, not just the verdict.** The board's per-PR row carries the full chain: `PR | Verdict | Status | Release/Deployed | Notes` — e.g. `request-changes → fixed → approved → merged 08-25 → v2026.08.25 → staging 08-25`. Plus a **Deployment status** section: latest release, per-environment versions, unreleased-on-`main` list (and "nothing unreleased" as an explicit healthy state).
4. **Update on every event.** Merge → update row + deployment section; release cut → versions; deploy → environment line; new finding → Related-open-items entry with context. A board that lags reality is worse than none — the Aug-19 board was four days stale until an automated sync.
5. **Close without losing tails.** Before closing any issue: move still-open checklist items to the issue that owns them (verify the target actually has them), state the closure reason in the body/comment (`completed` vs `not planned` + rationale), and record where each follow-up now lives. Reopen-ability note if conditions could change.

## Guardrails
- **Public issues are sanitized**: no host paths, container names, ports, restart counts tied to specific infra, or secret-adjacent values. Concept-level detail that any engineer can map to their own deployment (the #651 style).
- One authoritative board per workstream — don't fork tracking into side comments; link instead.
- Automated syncs to a tracking issue are fine **only after authorization** — an agent editing the board uninvited gets reverted (Aug-24 incident); the operator's word is the only trigger.
- Full traceability means the chain answers, from one page: *what was reviewed, what shipped, in which release, deployed where, verified how, and what remains open.*

## Exit criteria
- Every active workstream has exactly one findable home; every PR/issue in it is associated
- The board reflects current reality (verdicts, merges, releases, deployments)
- Any closure preserved its open follow-ups elsewhere, with the reason on record
