# Skill: license-check
> Verify licensing on a change: source files carry the repo's Eclipse/MIT header, no incompatible third-party code is introduced, and no existing headers are stripped.

## When to use
- Before commit on any change that **adds or modifies** `.js`, `.ts`, `.tsx` source files, or touches `package.json` / dependencies.
- When vendoring or copy-pasting code from elsewhere (Stack Overflow, another repo, an AI-generated snippet that includes a license notice).
- When you suspect a dependency's license may be incompatible.

## Repo license
This repo is **MIT** (Copyright Eclipse Foundation). Source files start with:

```
// Copyright (c) <YEAR> Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT
```

`.sh`, `.yml`, and `.md` files do **not** carry this header (repo convention) — only `.js`/`.ts`/`.tsx` source.

**`<YEAR>` on a brand-new file must be the current year, not a copy-pasted example year.** Get it from the environment (e.g. the session's "today's date" context, or `date +%Y`) — never hardcode a year from memory or from an older file/example, since that silently drifts stale. This file previously showed a literal `2025` here as the example and that value got copy-pasted verbatim into new files after the year had rolled over; the placeholder above is intentionally non-literal so there's nothing to blindly copy.

## Steps
1. **New/changed source headers.** For every `.js`/`.ts`/`.tsx` file in the diff, confirm the first ~10 lines contain `SPDX-License-Identifier: MIT`. Run `scripts/check-license-headers.sh` (checks changed files against `origin/main`) and fix any it reports. For files you're creating new, confirm the `Copyright (c) <YEAR>` line uses the actual current year, not whatever year appears in this doc's example or in a nearby existing file — `scripts/check-license-headers.sh` does not validate the year, so this is not auto-caught.
2. **No header stripping.** Diff must not remove or alter an existing `Copyright`/`SPDX-License-Identifier` block unless replacing the whole file with a properly re-licensed version.
3. **No vendored incompatible code.** Any third-party code pasted in must be MIT-compatible (MIT, BSD-2/3, Apache-2.0, ISC) and keep its original copyright/SPDX notice. GPL/AGPL/CDDL/proprietary snippets are **blocking** — Eclipse/MIT cannot combine with copyleft.
4. **Dependencies.** If `package.json` changed, sanity-check the new dep's license is MIT-compatible (most npm packages are MIT/ISC/Apache-2.0/BSD). Flag anything copyleft/proprietary.
5. **AI-generated code.** Generated snippets are fine (no third-party copyright), but still need the repo header on a new source file.

## Guardrails
- Don't bulk-add headers to pre-existing files outside your change's scope (that's separate debt cleanup — its own PR).
- Don't change the license itself (MIT) or the copyright holder (Eclipse Foundation) without explicit maintainer sign-off.
- A copyleft/proprietary license finding is **blocking** — do not commit; surface it.

## Exit criteria
- `scripts/check-license-headers.sh` passes for the changed files.
- No existing header stripped/altered.
- Any vendored code carries a compatible license + its notice.
- A short statement: "license-clean" or a list of findings with severity.