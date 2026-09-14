# Skill: code-review
> Self-review your own diff before commit — correctness, reuse, simplicity, altitude, style, and secrets.

## When to use
- Before every commit (RULES.md: self-review your diff before commit).
- As the final check in [`./implement-feature.md`](./implement-feature.md), before [`./commit-and-pr.md`](./commit-and-pr.md).

## Steps
1. **Produce the diff to review:**
   ```bash
   git diff main...HEAD        # everything on this branch
   git diff                    # unstaged
   git diff --staged           # staged
   ```
2. **Walk this checklist against the diff:**
   - **Correctness:** Does it do what the task asked? Edge cases handled? Error/empty states covered?
   - **Reuse:** Did you duplicate an existing util/service/hook/component? Search before adding new. Prefer extending `services/` logic over re-implementing in a controller.
   - **Simplification:** Anything dead, overly clever, or copy-pasted that could be simpler? Consider the `simplify` skill.
   - **Efficiency:** N+1 queries, unnecessary re-renders, blocking I/O on hot paths, repeated work in loops.
   - **Altitude (right layer):** Backend — is the controller thin and logic in `services/`? Frontend — is logic in the right atomic level (no page logic in atoms)? See `docs/principles/principle.md`.
   - **Matches surrounding style:** naming, comment density, idioms, export style. No drive-by reformatting outside the change's scope.
   - **No secrets:** `.env*`, tokens, keys, cookies, internal URLs not in the diff.
   - **No fabricated claims:** new endpoint/status/flag in `docs/capabilities/` matches the actual route/controller code.
3. **Run verification:**
   ```bash
   cd backend && npm run lint && npm run prettier
   cd frontend && npm run lint && npm run tsc
   ```
   Then [`./run-tests.md`](./run-tests.md) for affected suites. Fix your own lint errors; don't disable rules silently.
4. **Sensitive change?** If the diff touches auth, tokens, file operations, runtime execution, or plugins, also run [`./security-review.md`](./security-review.md) before commit. If it adds/modifies `.js`/`.ts`/`.tsx` or dependencies, also run [`./license-check.md`](./license-check.md) (Eclipse/MIT header + no incompatible-license code).
5. **Docs in sync?** If structure/capabilities changed, run [`./docs-update.md`](./docs-update.md) so `agentic/map/` and `docs/capabilities/` stay code-grounded.

## Guardrails
- This is self-review on your own diff — don't skip it because "it's small." Review every diff.
- No drive-by reformatting outside the change's scope; match surrounding code.
- Don't mark "reviewed" if lint or tests fail. Report honestly.
- Don't weaken tests/lint to pass; fix the code or surface the conflict.

## Exit criteria
- Every checklist item answered (mentally or in notes) with no open correctness/reuse/altitude/style/secrets issues.
- Lint + prettier + tsc + affected tests are green (or honestly reported as unrun).
- Security-review completed where applicable.
- The diff is ready for [`./commit-and-pr.md`](./commit-and-pr.md).