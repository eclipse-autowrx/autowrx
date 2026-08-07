# Skill: learn-and-update
> The continuous-learning loop: research, record dated+sourced notes, then propose rule/map/memory updates via PR.

## When to use
- When a durable lesson, gotcha, or better pattern surfaces during a task.
- On manual trigger (or a future scheduled run) to refresh best-practices/trends for the stack.
- When `understand-the-repo` or `docs-update` reveals something worth keeping for the next session.

## Steps
1. **Identify the trigger.** Either a session lesson (a specific failure/insight from this task) or a research refresh (broader best-practices/trends for the stack).
2. **Research (for a refresh).** Web-search current best-practices, trends, and well-known conventions for this stack:
   - Express + MongoDB (Node backend), React + Vite + TypeScript (frontend), Playwright (E2E), Docker Compose (deploy).
   - Agent-coding conventions: `agents.md`, `AGENTS.md`, repo-resident memory/skills patterns.
   Record the search date and source URLs with each note — do not present web content as repo fact.
3. **Write notes to the right file** under `agentic/learning/`:
   - `best-practices.md` — recommended patterns for the stack (dated + sourced).
   - `trends.md` — emerging tools/shifts worth tracking (dated + sourced).
   - `lessons.md` — concrete session lessons: what went wrong, what worked, the fix, and the rule it implies.
   Each entry: a timestamp/date, a one-line summary, the source (URL or `code: path/to/file`), and the proposed implication. If `agentic/learning/` doesn't yet exist, create it (the layout in `agentic/README.md` expects these files).
4. **Open a proposal PR.** Translate the notes into concrete, reviewable changes:
   - New/updated memory fact → `agentic/memory/<fact>.md` + one-line index entry in `MEMORY.md`.
   - Map drift → `agentic/map/TREE.md` / `INDEX.md` pointer updates.
   - Skill tweak → edit to `agentic/skills/<skill>.md`.
   - **Never auto-apply to `agentic/RULES.md`.** Rules are human-approved via PR only; the PR description proposes the rule change and links the supporting lesson/source.
5. **Document the decision.** If the outcome is "no change needed", record that in `lessons.md` with the reason so the next session doesn't re-investigate.

## Guardrails
- Learning notes are **proposals**, not applied rules — human-approved via PR.
- Cite sources + dates for every note; web content is never repo fact.
- Don't edit `RULES.md` directly; propose rule changes in the PR body.
- Don't dump raw web articles — distill to the actionable implication for this repo.
- One logical change per PR; follow `./commit-and-pr.md` for branch/commit/PR style.

## Exit criteria
- `agentic/learning/{best-practices,trends,lessons}.md` updated with dated + sourced entries, **and**
- a proposal PR opened (with concrete memory/map/skill/rule updates) **or** a documented decision not to change anything recorded in `lessons.md`.