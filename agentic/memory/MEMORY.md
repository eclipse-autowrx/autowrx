# Memory Index

Repo-resident knowledge base. Each entry is a short, durable, non-obvious fact — not something the code or git log already shows. Load this index + the relevant file; don't re-derive facts every session.

- [Architecture](architecture.md) — durable structural facts that span layers and aren't obvious from one file.
- [Gotchas](gotchas.md) — repo-specific traps and known gaps that bite if you don't know them.
- [Verified facts](verified-facts.md) — non-obvious facts confirmed by reading the code, worth not re-discovering.
- [Decisions](decisions.md) — ADR-style record of key choices and their rationale.
- [VSS validation](vss-validation.md) — validate complete trees before wishlist extraction; runtime checks use the assembled tree.
- [Commit identity](commit-identity.md) — explicit user override: keep the configured identity and do not ask again about the known ECA mismatch.

Update rule: propose changes via PR (see [`../skills/learn-and-update.md`](../skills/learn-and-update.md)). Never edit rules to "fix" a memory fact — fix the code, then update memory.
