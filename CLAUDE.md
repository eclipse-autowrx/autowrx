# CLAUDE.md — AutoWRX (Claude Code adapter)

This is a thin adapter. The canonical agent rules live in vendor-neutral files and are imported below (Claude Code `@path` syntax — they expand at launch). Do not duplicate rules here.

@AGENTS.md
@agentic/RULES.md
@agentic/CONVENTIONS.md

## Claude Code specifics

- **Skills:** the repo's skill playbooks are markdown in [`agentic/skills/`](./agentic/skills/). To invoke them via Claude Code's Skill tool natively, symlink them into `.claude/skills/` (see [`agentic/SETUP.md`](./agentic/SETUP.md)). Otherwise, load the matching skill file directly when a task fits.
- **Memory:** Claude Code's default memory is user-local (`~/.claude/...`). For this repo, prefer the **repo-resident** memory in [`agentic/memory/`](./agentic/memory/) so knowledge is shared across tools/machines and reviewable in PRs. Use user-local memory only for personal preferences.
- **Git identity:** commit with **your own** ECA-signed identity — each contributor uses their own account (this user's personal identity lives in user-local memory, not in repo rules). Always `git commit -s`. ECA must be signed.
- **Plan mode:** for non-trivial implementations, enter plan mode and get sign-off before coding (per Claude Code defaults).
- **Don't push/deploy unless explicitly asked**; commit only when asked. Each is separate authorization.

## Quick orientation

Read [`AGENTS.md`](./AGENTS.md) → run `understand-the-repo` skill → load the task's skill → follow `implement-feature`.