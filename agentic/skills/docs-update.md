# Skill: docs-update
> Keep docs, the capability catalog, and the agent map in sync with code changes.

## When to use
- Right after a code change that alters a route/endpoint, response status, feature flag, page, or module structure.
- When closing a feature/fix PR — docs drift is a defect too.
- When `understand-the-repo` surfaces a mismatch between the map and the code.

## Steps
1. **Classify the change** and update only the affected surfaces:
   - **Route / endpoint / status / flag changed** → update `docs/capabilities/<cluster>.md`. Open the matching route/controller/service in `backend/src/routes/v2/` + `backend/src/controllers/` + `backend/src/services/` and verify every technical claim against the code. Preserve the format from `docs/capabilities/README.md`: per-capability **Description / Who uses it / value / Acceptance criteria / Quality control / Security + Risks: / Data protection + Risks:**, with mermaid diagrams where they already exist.
   - **Page or feature changed** → update `.agents/SITEMAP.md` coverage status (✅ / ⚠️ / ❌) for the affected row.
   - **Module structure changed** (file moved, layer added, new service) → update `agentic/map/TREE.md` (compact module tree) and `agentic/map/INDEX.md` pointers. Don't copy content — point to the real doc.
   - **Durable fact learned** (non-obvious layering rule, gotcha, convention) → propose into `agentic/memory/` + a one-line index entry in `agentic/memory/MEMORY.md` (see `./learn-and-update.md`).
2. **Run the map-drift check** if present:
   ```bash
   scripts/check-agent-map.sh    # only if it exists in the repo
   ```
   If it doesn't exist, manually verify every pointer in `agentic/map/INDEX.md` resolves to a real file path.
3. **Cross-link, don't duplicate.** If the content already lives in `docs/architecture/`, `docs/getting-started/`, or `docs/principles/`, link to it instead of restating. `agentic/map/` is an index of pointers, not a second copy.
4. **Commit docs with the code change** (when authorized) under a `docs/...` branch or folded into the feature commit; follow `./commit-and-pr.md`.

## Guardrails
- Never change a capability's endpoint/status/flag claim without reading the route/controller code — the catalog is code-grounded (`RULES.md`).
- Never fabricate paths, statuses, or flags; if map and code disagree, read the code and fix the map.
- Don't duplicate content that lives elsewhere — link to it.
- Don't edit `agentic/RULES.md` here; durable rules go through `learn-and-update` as a proposal PR.

## Exit criteria
- The changed capability/page/module is reflected in the matching doc (`docs/capabilities/`, `.agents/SITEMAP.md`, `agentic/map/`).
- All `agentic/map/INDEX.md` pointers resolve (verified by `check-agent-map.sh` if present, else by manual check).
- No duplicated content — only links to existing docs where they already cover it.