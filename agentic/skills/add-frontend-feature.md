# Skill: add-frontend-feature
> Placing a frontend feature correctly in atomic design and wiring routes/state/permissions without bypassing the layering.

## When to use
- When the task adds a UI feature: a new page, a reusable component, a UI-gated action, or a new screen flow.
- When you need to call a backend endpoint from the frontend and expose it to users.

## Steps
1. **Choose the layer by scope.**
   - **Atom** (`components/atoms/`): single-purpose primitive (button, input, badge). No page logic, no API calls.
   - **Molecule** (`components/molecules/`): a small composition of atoms (form field, card). No API calls; receives props/callbacks.
   - **Organism** (`components/organisms/`): a self-contained section that may fetch data via `services/` and hold local state.
   - **Page** (`pages/`): route-level screen composing organisms/molecules. Page-level effects and data orchestration live here.
   - **Layout** (`layouts/`): shell shared by pages (nav, chrome).
   Match the existing component style/props pattern in the chosen folder — read 1-2 neighbors first.
2. **Register the route** (if page-level) in `frontend/src/configs/routes.tsx` — the single route table. Don't invent a parallel router. Add the lazy import and the `<Route>` entry with its permission guard if applicable.
3. **Add a Zustand store** in `frontend/src/stores/` **only** if state must persist across unrelated components/pages. For local or component-tree state, use React state/props. Match `authStore.ts` style.
4. **Add a hook** in `frontend/src/hooks/` for reusable logic (data fetching wrapper, derived flag, etc.). Gate UI permissions through `hooks/usePermissionHook.ts` — don't scatter raw role checks.
5. **Call the API via `services/`.** Add/extend a client in `frontend/src/services/` that hits the backend endpoint (see [`./add-endpoint.md`](./add-endpoint.md)). Never call `fetch`/`axios` directly from a molecule or atom; organisms/pages call service functions, atoms/molecules receive data via props.
6. **Type everything.** TS types for props, store shape, API responses. No `any` unless the surrounding code uses it.
7. **Build + lint:** `cd frontend && npm run build` (runs `tsc && vite build` — the typecheck gate) and `npm run lint` (ESLint, `--max-warnings 0`). Fix your own errors; don't silence rules.
8. **Add a Playwright spec** in `.agents/tests/*.spec.ts` per [`./add-test.md`](./add-test.md) for the user-facing flow. Run `cd .agents && npx playwright test`.
9. **Update `.agents/SITEMAP.md`** — flip the page/feature from ❌/⚠️ to ✅ (or add a row) to track coverage.
10. **Update docs.** If the feature exposes a new capability or changes a user-facing flow, run [`./docs-update.md`](./docs-update.md) against `docs/capabilities/<cluster>.md` (code-grounded; verify claims against the new component/route).
11. **Self-review.** [`./code-review.md`](./code-review.md); add the Eclipse/MIT SPDX header to any new `.ts`/`.tsx` file ([`./license-check.md`](./license-check.md)).

## Guardrails
- No page logic or API calls in atoms or molecules. Atoms/molecules receive data + callbacks as props.
- Don't bypass `configs/routes.tsx` — no ad-hoc routers or hardcoded nav.
- Don't add a Zustand store for one-component state; use React state.
- Don't bypass `usePermissionHook.ts` for role/permission gating.
- Don't ignore `tsc` errors — `npm run build` is the gate; lint must be `--max-warnings 0`.
- New `.ts`/`.tsx` files must carry the SPDX header.
- Don't fabricate component paths — read the folder before adding.

## Exit criteria
- Component placed at the correct atomic layer; route registered in the table (if page-level).
- State in a store only if cross-component; permissions via the hook; API calls via `services/`.
- `npm run build` + `npm run lint` green; Playwright spec added and passing.
- `.agents/SITEMAP.md` and capability doc updated; SPDX headers present; self-review done.