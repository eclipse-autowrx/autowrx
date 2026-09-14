# Skill: understand-the-repo
> Orient cheaply before touching code — load the map + memory, deep-read only the module you'll change.

## When to use
- At the start of any non-trivial task (feature, fix, refactor, docs change).
- Before answering "how does X work" or "where does Y live" questions.
- When you're tempted to `grep`/scan the whole tree — use this instead.

## Steps
1. Load `agentic/map/INDEX.md` — the index of pointers to the real maps.
2. Load `agentic/memory/MEMORY.md` — durable repo facts (one line each). Jump to the linked memory file only if relevant.
3. From the index, pick the matching map for the area in question:
   - Backend structure/layering → `docs/architecture/` + `docs/principles/principle.md` (thin controllers, services hold logic).
   - Endpoint/status/flag spec → `docs/capabilities/<cluster>.md` (code-grounded; verify claims against `routes/v2/*` + `controllers/` + `services/`).
   - Pages / feature coverage → `.agents/SITEMAP.md`.
   - Local dev / contributing / tour → `docs/getting-started/`.
4. Deep-read **only** the specific module/route/component you'll touch:
   - Backend: `backend/src/routes/v2/<domain>/` → `backend/src/controllers/<area>.controller.js` → `backend/src/services/<area>.service.js` → `backend/src/models/<area>.model.js`. (Routes are grouped by domain: `content/`, `system/`, `user-management/`, `vehicle-data/`; controllers/services/models are flat `<area>.*`.)
   - Frontend: `frontend/src/components/{atoms,molecules,organisms}/`, `frontend/src/pages/`, `frontend/src/stores/`, `frontend/src/hooks/`, routing in `frontend/src/configs/routes.tsx`.
5. Confirm the change surface: name the exact file(s) that will change and why, plus adjacent files to match style (e.g. sibling controller, sibling component).
6. If a durable fact emerged (e.g. a non-obvious layering rule), propose it to `agentic/memory/` via the `learn-and-update` skill — don't edit rules in-place.

## Guardrails
- Do NOT scan or dump the whole repo into context. The map exists so you don't have to.
- Do NOT fabricate endpoints, statuses, flags, or paths. If the map and code disagree, read the code and note it.
- Do NOT edit `docs/capabilities/*` technical claims without re-verifying against route/controller code.
- Don't duplicate content already in `docs/architecture/`, `docs/capabilities/`, `docs/getting-started/` — point to it.

## Exit criteria
- You can state, without a full repo scan: (a) which file(s) will change, (b) why, (c) the layer they live in, and (d) the sibling code whose style you'll match.
- The next skill (typically `implement-feature`) has a concrete starting file path.