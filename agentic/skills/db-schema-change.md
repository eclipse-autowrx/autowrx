# Skill: db-schema-change
> Evolving Mongoose models safely when there is no migration tool (schema-on-read, no Mongo transactions).

## When to use
- When adding, renaming, removing, or re-typing a field on a Mongoose model in `backend/src/models/`.
- When adding an index (including TTL) or changing a default/validator.
- When a schema change requires backfilling existing documents.

## Steps
1. **Read the model first.** Open `backend/src/models/<area>.model.js` and the surrounding `services/<area>.service.js` to see how the field is queried/updated. Check `agentic/memory/gotchas.md` for known issues (e.g. the `Token` collection has **no TTL index** — revoked/abandoned refresh tokens accumulate; adding a TTL on an expiry/revoked-at field is a good candidate here).
2. **Prefer additive, optional, defaulted changes.** Add new fields as `{ type, default }` (or `required: false`). Schema-on-read means old docs simply lack the field — Mongoose returns the default for `lean` only with `defaults` set; for full docs the default applies on access. Avoid renaming or removing fields; if you must, plan a backfill (step 5) before dropping the old name.
3. **Edit the schema** in `models/<area>.model.js`. Add the field, `default`, any `enum`/`validate`/`ref`. Match the file's existing style (schema definition pattern, timestamps usage).
4. **Add an index if needed.** Define indexes on the schema (`<field>: 1`, unique compounds, TTL via `index({ <dateField>: 1 }, { expireAfterSeconds })`). Note: Mongoose creates the index on next app boot for a new field; for an existing field, ensure the index won't conflict with existing data (unique). Cite the Token TTL gap explicitly if you're adding a TTL there.
5. **Write a backfill script** in `backend/src/scripts/` when a default/transform is needed for old docs (e.g. set `newField = defaultValue` for all docs missing it, or compute `newField` from `oldField`). Make it idempotent (filter on `{ newField: { $exists: false } }` or `$or` checks) and dry-run-safe (log counts before/after; support a `--dry-run` flag). Run it against the target env explicitly — never auto-run in a migration hook.
6. **Update validations.** In `backend/src/validations/<area>.validation.js`, add the field to the relevant Joi schema (body/query) with the right type, optional/required, and `enum` if the model constrains it. Export from `validations/index.js` if introduced there.
7. **Update the service + controllers** that read/write the field. Don't leak the old name if renaming; keep a read shim during transition if needed.
8. **Update the capability doc.** Per [`./docs-update.md`](./docs-update.md), edit `docs/capabilities/<cluster>.md` — document the field, its default for old docs, the index, and any **Risks:** (e.g. "old docs read as default until backfill runs"). Verify the claim against the schema + script.
9. **Add a test.** Per [`./add-test.md`](./add-test.md) — unit test the model default, the backfill script's idempotency, and any service branch that depends on the field. Run `cd backend && npm test`.
10. **Lint/format:** `cd backend && npm run lint && npm run prettier`.
11. **Self-review.** [`./code-review.md`](./code-review.md); if the change affects query performance or large collections, also run [`./performance-review.md`](./performance-review.md). Add the Eclipse/MIT SPDX header to any new `.js` file ([`./license-check.md`](./license-check.md)).

## Guardrails
- **No migration tool.** Don't invent one. Backfills are one-off scripts in `backend/src/scripts/`, run by a human against a named env.
- **Don't remove or rename a field without a backfill** — old documents will break readers that expect the old name, and writers that set it.
- **Prefer additive changes**: optional field + default. Avoid `required: true` on a new field unless every old doc is backfilled first.
- **No `withTransaction` / Mongo transactions** — the deployment is not guaranteed to be a replica set.
- **Never drop a collection or index in a script** without explicit user confirmation. Adding indexes is fine; dropping is destructive.
- **Index cost:** adding an index on a large collection has a runtime + storage cost — call it out and prefer `performance-review` for hot paths.
- New `.js` files must carry the SPDX header.

## Exit criteria
- Schema change is additive (or a documented, idempotent backfill ships alongside a rename/remove).
- Index/TTL added intentionally (or explicitly skipped with a reason); Token TTL gap cited if relevant.
- Validations, service, controller, and capability doc updated and verified against code.
- Backfill script (if needed) is idempotent and dry-run-safe; Jest test added and green; lint clean.
- Self-review (+ performance-review where applicable) done; SPDX headers present.