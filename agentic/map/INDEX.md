# Map Index

Pointers to the real repo maps. **Load this INDEX + the relevant target map; do NOT scan the whole repo.** This file indexes, it does not duplicate — for content, open the target.

## Compact module tree

- [`TREE.md`](TREE.md) — one-line purpose per top-level dir / key subdir. Load first to orient.

## Where to find what

| When you need… | Load |
| --- | --- |
| Subsystem deep-dive (backend/frontend/deploy internals) | [`docs/architecture/`](../../docs/architecture/) |
| Per-cluster endpoint / status / flag spec (code-grounded) | [`docs/capabilities/`](../../docs/capabilities/) — load the cluster matching the area you're touching |
| Page / feature coverage status (✅/⚠️/❌) | [`.agents/SITEMAP.md`](../../.agents/SITEMAP.md) |
| Onboarding: codebase tour, local dev | [`docs/getting-started/codebase-tour.md`](../../docs/getting-started/codebase-tour.md) + [`local-development.md`](../../docs/getting-started/local-development.md) |
| Design rules / layering principles | [`docs/principles/principle.md`](../../docs/principles/principle.md) |
| E2E test conventions | [`.agents/TESTING.md`](../../.agents/TESTING.md) |
| Deploy topology | [`instance-setup/instance-setup-guide.md`](../../instance-setup/instance-setup-guide.md) + `docker-compose.prod.yml` |

## How to use

1. Read `TREE.md` to find the module path.
2. Open the one target map above that matches the task area.
3. Deep-read only the specific module you'll change — not its neighbors.