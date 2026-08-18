# Skills

Repo-specific procedures an agent loads **on demand** when a task matches. Each skill is a markdown file with *When to use · Steps · Guardrails · Exit criteria*. Don't preload all skills — load the one that fits.

## Index

### Orient & flow
| Skill | When to use | File |
|---|---|---|
| **Understand the repo** | Before any real work — orient cheaply via map + memory instead of scanning the whole repo. | [understand-the-repo.md](./understand-the-repo.md) |
| **Implement feature** | The canonical flow: branch → understand → implement → test → review → commit → PR. Start here for any change. | [implement-feature.md](./implement-feature.md) |
| **Run tests** | Before declaring done; after code changes. Jest (backend) + Playwright (`.agents/`). | [run-tests.md](./run-tests.md) |
| **Code review** | Self-review the diff before commit (correctness, reuse, simplification, altitude, style). | [code-review.md](./code-review.md) |
| **Security review** | When the diff touches auth, tokens, permissions, file ops, runtime/exec, plugins, secrets, CORS/CSP, uploads, or user data. | [security-review.md](./security-review.md) |
| **License check** | When the diff adds/modifies `.js`/`.ts`/`.tsx` or dependencies — verify Eclipse/MIT headers + no incompatible-license code. | [license-check.md](./license-check.md) |
| **Commit & PR** | When asked to commit / open a PR. ECA, sign-off, PR template. | [commit-and-pr.md](./commit-and-pr.md) |
| **Docs update** | After structural/endpoint changes — keep `docs/capabilities/`, `.agents/SITEMAP.md`, and `agentic/map/` in sync. | [docs-update.md](./docs-update.md) |
| **Learn & update** | Periodically — research best practices/trends, capture lessons, propose framework updates via PR. | [learn-and-update.md](./learn-and-update.md) |

### Debug & correctness
| Skill | When to use | File |
|---|---|---|
| **Debug** | Something is broken and you need to find where — symptom→where-to-look decision tree (winston/morgan, Docker/pm2 logs, browser console, Socket.IO frames, Playwright trace). | [debug.md](./debug.md) |
| **Find race conditions** | Suspected concurrency bug — no Mongo transactions, so atomicity is doc-level; check read-modify-write, counters, token single-flight, Socket.IO ordering, seed-vs-save races. | [find-race-conditions.md](./find-race-conditions.md) |

### Build (add / change)
| Skill | When to use | File |
|---|---|---|
| **Add endpoint** | Adding a new v2 API endpoint — route → controller → service → model → auth gating → validation → capability doc → SITEMAP. | [add-endpoint.md](./add-endpoint.md) |
| **Add frontend feature** | Adding a page/component — atomic-design placement, route table, store/hook, API client, permission gate, E2E spec. | [add-frontend-feature.md](./add-frontend-feature.md) |
| **DB schema change** | Evolving a Mongoose model — additive fields, indexes/TTL, backfill scripts (no migration tool; no transactions). | [db-schema-change.md](./db-schema-change.md) |
| **Realtime event** | Adding a Socket.IO event — contract, `config/socket.js`, kit-server relay, subscribe→run→stop lifecycle, frontend listener. | [realtime-event.md](./realtime-event.md) |
| **Add test** | Adding a Jest spec (backend) or Playwright spec (`.agents/`) — fixtures, helpers, snapshot policy. | [add-test.md](./add-test.md) |

### Review & health
| Skill | When to use | File |
|---|---|---|
| **Performance review** | Perf review of a diff/area — Mongo N+1/`populate`/indexes, external `CACHE_URL`/`LOG_URL` calls, frontend bundle, Socket.IO fan-out. | [performance-review.md](./performance-review.md) |
| **Dependency upgrade** | Upgrading an npm dep / clearing a Dependabot alert — audit, breaking-change check, tests, license compatibility. | [dependency-upgrade.md](./dependency-upgrade.md) |

### Deploy & ops
| Skill | When to use | File |
|---|---|---|
| **Deploy** | When asked to deploy an instance — `instance-setup/` Docker Compose happy path. | [deploy.md](./deploy.md) |
| **Troubleshoot deploy** | When the stack won't come up — symptom→cause→fix (env, ports, Mongo, prototypes bind-mount, Coder reachability). | [troubleshoot-deploy.md](./troubleshoot-deploy.md) |
| **Coder workspace** | Debugging/extending the VS Code-in-browser integration — `instance-setup/coder/` + `plans/`, workspace lifecycle, `CODER_URL`. | [coder-workspace.md](./coder-workspace.md) |

### Specialized
| Skill | When to use | File |
|---|---|---|
| **Plugin authoring** | Writing a plugin — `window.DAPlugins`/`PluginAPI`, unsandboxed model, `e2e-simple-plugin` fixture, upload. | [plugin-authoring.md](./plugin-authoring.md) |
| **Secrets incident** | A secret may have leaked — identify, blast radius, rotate-at-source, scrub logs/PRs, incident note. | [secrets-incident.md](./secrets-incident.md) |

## The core flow

```
implement-feature
  ├─ understand-the-repo   (orient)
  ├─ implement             (per CONVENTIONS)
  │   ├─ add-endpoint / add-frontend-feature / db-schema-change / realtime-event  (by task type)
  │   └─ add-test          (add coverage as you go)
  ├─ run-tests
  ├─ code-review
  │   ├─ security-review   (if auth/data/runtime/plugins)
  │   ├─ license-check     (if new/changed .js/.ts/.tsx or deps)
  │   └─ performance-review (if perf-sensitive area)
  └─ commit-and-pr
broken?    → debug → find-race-conditions
after merge → docs-update   (if structure/endpoint changed)
on schedule → learn-and-update · dependency-upgrade
deploy broken? → troubleshoot-deploy · coder-workspace
secret leaked? → secrets-incident
```

## Wiring into Claude Code

Skills are plain markdown. To invoke them via Claude Code's Skill tool natively, symlink each into `.claude/skills/` (see [`../SETUP.md`](../SETUP.md)). Otherwise just load the file when the task matches.