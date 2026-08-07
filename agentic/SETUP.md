# Setup — wiring this repo into each AI tool

The framework is vendor-neutral; each tool just needs to find `AGENTS.md` (and optionally the skills). One-time setup per machine.

## Claude Code

`CLAUDE.md` already `@import`s `AGENTS.md` + rules, so rules load automatically when Claude Code opens this repo.

### Native skill invocation (optional but recommended)

Claude Code's Skill tool only sees skills in `.claude/skills/`. `.claude/` is gitignored (per-user), so symlink the canonical skills in:

```bash
# from repo root
mkdir -p .claude/skills
for s in agentic/skills/*.md; do
  name=$(basename "$s" .md)
  ln -sf "../../agentic/skills/$name.md" ".claude/skills/$name.md"
done
```

Now `/understand-the-repo`, `/run-tests`, etc. are invokable. (The skill files use the markdown-playbook format; Claude Code treats a `.md` skill as a set of instructions it loads when invoked.)

> Re-run after pulling if skills are added/renamed.

### Memory

Prefer repo-resident [`agentic/memory/`](./memory/) for shared facts. Keep `~/.claude/.../memory/` for personal preferences only.

## opencode

opencode reads `AGENTS.md` natively. Point it at the repo root; no extra config. To expose skills, symlink per opencode's skill dir convention into `agentic/skills/` (or set opencode's skills path to `agentic/skills/`).

## openclaw / other agents

Point the tool at `AGENTS.md` at repo root (this is the [agents.md](https://agents.md) convention). Skills are plain markdown — instruct the tool to load `agentic/skills/<skill>.md` when a task matches, or symlink into the tool's skill dir. Memory/map are markdown under `agentic/`.

## Verify it works

After setup, ask the agent: *"Where does the repo keep its agent rules and skills?"* Correct answer: `AGENTS.md` + `agentic/`. Then: *"Orient me on the repo without scanning everything"* — it should load `agentic/map/INDEX.md` + `agentic/memory/MEMORY.md`, not re-index the whole tree.