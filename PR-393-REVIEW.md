# PR #393 — Code Review

## 1. Summary

This is a grab-bag PR bundling ~7 distinct features/fixes across 25 files. Grouped by feature:

### Privacy Policy (new feature)
- New admin section to edit privacy policy as Markdown (`PrivacyPolicySection.tsx`)
- New public page at `/privacy-policy` (`PagePrivacyPolicy.tsx`)
- Shared Markdown component map (`privacyMarkdownComponents.tsx`)
- New `PRIVACY_POLICY_CONTENT` site config (backend + frontend)
- Route uncommented in `routes.tsx`

### Duplicate Name Validation
- Backend: unique name check on model create/update (`model.service.js`)
- Frontend: `isDuplicateName` + `suggestedName` logic added to `FormCreateModel.tsx`, `FormNewPrototype.tsx`, `DaPrototypeItem.tsx`, `PageModelDetail.tsx`

### Dashboard Templates & 3D Car
- New "Chart Signals Dashboard" template and rewritten "General 3D Car Dashboard" template in `dashboard_templates.ts`
- Local template application support in `DaDashboard.tsx`
- 3.6 MB `.glb` binary model file committed to repo
- `.gitignore` changes: removed `data/` exclusion and `.glb` exclusion

### VSS Data Files
- Two large (~320 KB each) single-line JSON files added to `backend/data/` (`v6.0.json`, `v6.0rc1.json`)

### UI/UX Fixes
- Breadcrumb bar: restored `useCurrentPrototype` hook, added `new-prototype` route handling
- Navigation bar: removed `ABOUT_LINK`/`ABOUT_LINK_TEXT` config
- Logo: uses site config `SITE_LOGO_WIDE` in dashboard fullscreen mode
- Chart colors hardcoded for better visibility (`PrototypeLibraryPortfolio.tsx`)
- Average score star display on prototype items
- "My Models" section restored in `PageModelList.tsx`
- Python GenAI asset type toggle (`SHOW_USER_ASSET_PYTHON_GENAI`)

### Permission Logic Changes
- `ModelDetailLayout.tsx`: `canManageModelUI` changed from `(isModelOwner || hasWritePermission)` to `(isModelOwner || hasWritePermission) && !!allowNonAdminAddonConfig`
- `PagePrototypeDetail.tsx`: `canConfigurePrototypeAddons` changed from `(isModelOwner && !!allowNonAdminAddonConfig) || hasWritePermission` to `(isModelOwner || hasWritePermission) && !!allowNonAdminAddonConfig`

### Site Config Cleanup
- Removed `ABOUT_LINK` and `ABOUT_LINK_TEXT` predefined configs
- `RUNTIME_SERVER_CONFIG` value type changes
- Added `category` field to some configs

---

## 2. Architecture / Design Issues

### PR scope is too large
This PR bundles at least 7 unrelated features. Privacy policy, duplicate name validation, dashboard templates, VSS data, permission logic changes, and UI fixes should each be separate PRs. This makes it very hard to review, bisect regressions, or revert individual features.

### 3.6 MB binary in git history (`backend/static/builtin-widgets/3d-car/models/acme_lite.glb`)
A 3.6 MB `.glb` file is committed directly to the repo. This permanently bloats the git history. Binary assets like 3D models should be stored in Git LFS, a CDN, or an artifact store — not in the repo itself.

### `.gitignore` removals are dangerous
- **Removing `data/` from `.gitignore`**: This was previously ignored, presumably for a reason. Now the two ~320 KB VSS JSON files are tracked, but this also means any other files in `data/` directories throughout the repo could accidentally be committed in the future.
- **Removing the `.glb` exclusion**: The original exclusion was specifically added to avoid binary model files. Removing it opens the door to more binary bloat.

### Duplicate name validation logic is copy-pasted 4 times
The `isDuplicateName` + `suggestedName` pattern is duplicated nearly identically in:
1. `FormCreateModel.tsx`
2. `FormNewPrototype.tsx`
3. `DaPrototypeItem.tsx`
4. `PageModelDetail.tsx`

Each has its own `getCreatedById` helper, its own `useMemo` with the same while-loop counter logic. This should be a shared hook like `useDuplicateNameCheck(existingNames, currentName)`.

---

## 3. Bug Risks

### **CRITICAL: Permission logic change in `ModelDetailLayout.tsx` (line 174) may break admin access**

**Before (main):**
```js
const canManageModelUI = isModelOwner || hasWritePermission
```
**After (PR):**
```js
const canManageModelUI = (isModelOwner || hasWritePermission) && !!allowNonAdminAddonConfig
```

The old `canConfigureModelAddons` (which checked `allowNonAdminAddonConfig`) was a *separate* variable for addon configuration. This PR merges both concepts into one. Now **even model owners and users with WRITE_MODEL permission cannot manage model UI if `ALLOW_NON_ADMIN_ADDON_CONFIG` is `false`**. This is a semantic regression — the site config name says "non-admin addon config", but it now gates all model UI management, including for the owner.

The same issue exists in `PagePrototypeDetail.tsx` (line 209), where `hasWritePermission` users were previously exempt from the `allowNonAdminAddonConfig` check but are no longer.

### **Dead code: `canConfigureModelAddons` removed but `gradientHeader` left dangling**
In `ModelDetailLayout.tsx`, `gradientHeader` is still fetched via `useSiteConfig` on the main branch (line 68), but the diff removes the line. However, the `const canConfigureModelAddons` is removed but its declaration was still there in the base — verify it's not used elsewhere in the same file.

### **Potential infinite loop in suggested name generation**
In `FormCreateModel.tsx` (and the 3 other copies), the while loop generating `suggestedName` has no upper bound:
```js
while (owned.has(candidate.toLowerCase())) {
  counter++
  candidate = `${newName.trim()}_${counter}`
}
```
If the set of existing names is somehow corrupted or the input causes an unexpected match pattern, this loops forever. Add a safety limit (e.g., `counter < 1000`).

### **Backend duplicate check is case-sensitive, frontend is case-insensitive**
`model.service.js` line 46: `Model.findOne({ created_by: userId, name: modelBody.name })` — this is an exact (case-sensitive) match in MongoDB by default.

Frontend `FormCreateModel.tsx` uses `.toLowerCase()` comparison. So:
- Frontend says "MyModel" and "mymodel" are duplicates → prevents submission
- Backend would allow both if submitted directly via API

Pick one strategy and apply consistently. The backend should use a case-insensitive regex or collation.

### **`getCreatedById` uses `any` type**
`PageModelDetail.tsx` and `FormCreateModel.tsx` both define:
```ts
const getCreatedById = (createdBy: any): string =>
  typeof createdBy === 'object' ? createdBy?.id ?? '' : createdBy ?? ''
```
The `any` type means no compile-time safety. If the shape of `created_by` changes, this silently returns `''` and duplicate detection breaks.

### **`prototype?.avg_score.toFixed(1)` can throw**
`DaPrototypeItem.tsx` line ~271: If `avg_score` is truthy but not a number (e.g., a string), `.toFixed(1)` will throw. Should guard with `typeof prototype.avg_score === 'number'`.

---

## 4. Code Quality

### Hardcoded color strings
`PrototypeLibraryPortfolio.tsx` replaces CSS variable-based colors with hardcoded hex values (`#f3f4f6`, `#d1d5db`, `#374151`). This breaks theming/dark mode support. The commit message says "for better visibility" but the proper fix is to fix the CSS variables, not bypass them.

### Commented-out code left in
`dashboard_templates.ts` line with `// url: \`http://localhost:5173\`` — development debug URL should not be committed.

### Inconsistent error message punctuation
- `DaPrototypeItem.tsx`: "A prototype with this name already exists" (no period)
- `FormCreateModel.tsx`: "A model with this name already exists, using..." (no period)
- `FormNewPrototype.tsx`: "A prototype with this name already exists" (no period)

Minor, but inconsistent with the rest of the app.

### `RUNTIME_SERVER_CONFIG` type change
The commit messages reference changing `RUNTIME_SERVER_CONFIG` from object to string, but I don't see this reflected in the diff. If this was done in an earlier commit and then reverted, the commit history is misleading.

---

## 5. Security Concerns

### Privacy policy content stored as raw Markdown — XSS via Markdown injection
`PrivacyPolicySection.tsx` stores arbitrary Markdown content in the site config and renders it with `ReactMarkdown`. While `react-markdown` does not render raw HTML by default (safe), if `rehype-raw` is ever added as a plugin, this becomes a stored XSS vector. The admin is trusted, but defense-in-depth suggests sanitizing the output or documenting this trust boundary.

### No authorization check on public privacy policy endpoint
`PagePrivacyPolicy.tsx` calls `configManagementService.getPublicConfig('PRIVACY_POLICY_CONTENT')` — verify that the backend `getPublicConfig` endpoint does not leak other config keys or allow enumeration. This is likely fine if the endpoint is already scoped, but worth verifying.

### Backend duplicate name check lacks index
`model.service.js` does `Model.findOne({ created_by: userId, name: modelBody.name })` and `Model.findOne({ created_by: model.created_by, name: updateBody.name, _id: { $ne: id } })`. Without a compound index on `(created_by, name)`, these queries will do collection scans. This is both a performance issue and a TOCTOU race condition — two concurrent requests could both pass the check and create duplicates.

---

## 6. Missing Tests / Edge Cases

- **No tests for backend duplicate name validation** — `model.service.js` changes are untested. This is server-side business logic that should have unit tests covering: exact match, case mismatch, different users with same name, concurrent creation.
- **No tests for privacy policy CRUD** — both the admin save flow and the public read flow.
- **No tests for the suggested name generation** — edge cases like names with trailing underscores, names that are just numbers, very long names.
- **No tests for permission logic changes** — the `canManageModelUI` and `canConfigurePrototypeAddons` logic changes affect authorization and should be tested.
- **Edge case: empty `modelList.results`** — `FormCreateModel.tsx` uses `modelList?.results?.some(...)` but if `results` is `undefined`, the `?? false` fallback handles it. However, the `suggestedName` memo uses `modelList?.results?.filter(...)?.map(...)` which could be `undefined` passed to `new Set()`. `new Set(undefined)` is fine in JS, but it's fragile.

---

## 7. Suggestions for Improvement

1. **Split this PR** into at least 4 separate PRs: (a) privacy policy, (b) duplicate name validation, (c) dashboard templates + 3D car, (d) UI/permission fixes. Each is independently reviewable and revertible.

2. **Use Git LFS for the `.glb` file** — or host it externally. 3.6 MB binaries don't belong in git objects.

3. **Extract a shared `useDuplicateNameSuggestion` hook** to replace the 4 copy-pasted implementations. Something like:
   ```ts
   function useDuplicateNameSuggestion(name: string, existingNames: string[]) {
     // returns { isDuplicate, suggestedName }
   }
   ```

4. **Add a compound unique index** on `(created_by, name)` in the Model schema (with a case-insensitive collation) to enforce uniqueness at the database level, not just in application code.

5. **Align case sensitivity** between frontend and backend duplicate checks. Use case-insensitive comparison in both.

6. **Revert the hardcoded colors** in `PrototypeLibraryPortfolio.tsx` and fix the underlying CSS variable issue instead.

7. **Add a safety limit** to the while-loop in suggested name generation (`counter < 1000`).

8. **Remove the commented-out localhost URL** in `dashboard_templates.ts`.

9. **Reconsider the permission logic change** in `ModelDetailLayout.tsx` — gating `canManageModelUI` on `allowNonAdminAddonConfig` when it previously wasn't is a behavioral regression that needs explicit justification.

10. **Add the `data/` directory back to `.gitignore`** if the VSS JSON files are the only exception. Use `!backend/data/*.json` to whitelist just those files while keeping the general exclusion.
