# Skills

Repo-specific procedures an agent loads **on demand** when a task matches. Each skill is a markdown file with *When to use · Steps · Guardrails · Exit criteria*. Don't preload all skills — load the one that fits.

## Index

| Skill | When to use | File |
|---|---|---|
| **Understand the repo** | Before any real work — orient cheaply via map + memory instead of scanning the whole repo. | [understand-the-repo.md](./understand-the-repo.md) |
| **Implement feature** | The canonical flow: branch → understand → implement → test → review → commit → PR. Start here for any change. | [implement-feature.md](./implement-feature.md) |
| **Run tests** | Before declaring done; after code changes. Jest (backend) + Playwright (`.agents/`). | [run-tests.md](./run-tests.md) |
| **Code review** | Self-review the diff before commit (correctness, reuse, simplification, altitude, style). | [code-review.md](./code-review.md) |
| **Security review** | When the diff touches auth, tokens, permissions, file ops, runtime/exec, plugins, secrets, CORS/CSP, uploads, or user data. | [security-review.md](./security-review.md) |
| **License check** | When the diff adds/modifies `.js`/`.ts`/`.tsx` or dependencies — verify Eclipse/MIT headers + no incompatible-license code. | [license-check.md](./license-check.md) |
| **Commit & PR** | When asked to commit / open a PR. ECA, sign-off, PR template. | [commit-and-pr.md](./commit-and-pr.md) |
| **Deploy** | When asked to deploy an instance. `instance-setup/` Docker Compose. | [deploy.md](./deploy.md) |
| **Docs update** | After structural/endpoint changes — keep `docs/capabilities/`, `.agents/SITEMAP.md`, and `agentic/map/` in sync. | [docs-update.md](./docs-update.md) |
| **Learn & update** | Periodically — research best practices/trends, capture lessons, propose framework updates via PR. | [learn-and-update.md](./learn-and-update.md) |

## The core flow

```
implement-feature
  ├─ understand-the-repo   (orient)
  ├─ implement             (per CONVENTIONS)
  ├─ run-tests
  ├─ code-review
  │   ├─ security-review   (if auth/data/runtime/plugins)
  │   └─ license-check     (if new/changed .js/.ts/.tsx or deps)
  └─ commit-and-pr
after merge → docs-update   (if structure/endpoint changed)
on schedule → learn-and-update
```

## Wiring into Claude Code

Skills are plain markdown. To invoke them via Claude Code's Skill tool natively, symlink each into `.claude/skills/` (see [`../SETUP.md`](../SETUP.md)). Otherwise just load the file when the task matches.