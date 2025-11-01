# COVESA API Page Migration - Known Issues

## What Was Migrated

### Components (14 files)
- **Molecules (7)**: DaTreeView, DaTreeViewUSP, DaConsumedPrototypes, DaApiArchitecture, DaVehicleAPIEditor, DaApiList, DaApiHierarchicalView
- **Organisms (6)**: ViewApiCovesa, ViewApiUSP, ViewApiV2C, ApiDetail, ModelApiList, VssComparator
- **Pages (1)**: PageVehicleApi

### Supporting Files (11 files)
- **Hooks (6)**: useCurrentExtendedApi, useCurrentExtendedApiIssue, useCurrentModelApi, useGithubAuth, useSearchPrototypesBySignal, useSocketIO
- **Services (2)**: github.service, issue.service (enhanced)
- **Stores (2)**: githubAuthStore, socketStore
- **Types (1)**: issue.type

### Route Changes
- Uncommented `/model/:model_id/api` routes in `routes.tsx`
- Added lazy loading for PageVehicleApi: `const PageVehicleApi = lazy(() => retry(() => import('@/pages/PageVehicleApi')))`

## Migration Guidelines Followed
- ✅ Replaced deprecated `da-` Tailwind classes with standard Tailwind
- ✅ Used shadcn/ui components only (Button, Input, Select, Dialog, etc.)
- ✅ Applied `text-sm font-medium` as default text styling
- ✅ No MUI imports beyond shadcn
- ✅ Manual migration (no batch scripts)

## ⚠️ KNOWN ISSUE: DaTreeView Global CSS Interference

### Problem
The `DaTreeView.tsx` and `DaTreeViewUSP.tsx` components contain inline `<style>` tags that **affect global CSS** when the component loads:

```tsx
<style>
  {`
    .Node {
      stroke: #98B0B8 !important;
      stroke-width: 3px;
    }
    /* ... more .Node styles ... */
  `}
</style>
```

### Impact
- When navigating to the Vehicle API page (specifically the "Tree View" tab), these styles inject globally
- This can interfere with other components' styling across the entire application
- The issue persists even with lazy loading (occurs when you navigate TO the page)

### Why This Happens
- The `react-d3-tree` library generates SVG elements with class names like `.Node`, `.Node.selected`, etc.
- We cannot apply Tailwind classes directly because we don't control the JSX output
- The only way to style react-d3-tree nodes is through global CSS selectors

### Attempted Solutions (Failed)
1. ❌ **Moving styles to `index.css` inside `@layer base`** - Too high priority, broke other components
2. ❌ **Moving styles to `index.css` outside layers** - Still caused global interference
3. ✅ **Lazy loading PageVehicleApi** - Helps delay the issue but doesn't prevent it

### Current Workaround
- Styles are kept as **inline `<style>` tags** within the tree components
- Components are **lazy-loaded** to prevent loading at app startup
- Issue only occurs when actively using the Tree View tab
- Documented with warning comments in the code

### Future Investigation Needed
Potential solutions to explore:
1. **CSS Modules** - Scope the styles to the component
2. **Scoped style injection** - Use a library like `styled-components` or `emotion`
3. **Shadow DOM** - Isolate the tree component completely
4. **Alternative tree library** - Find a library that supports styled props
5. **CSS-in-JS with unique class prefixes** - Generate unique class names to avoid conflicts

### Files Affected
- `src/components/molecules/DaTreeView.tsx` (lines 230-257)
- `src/components/molecules/DaTreeViewUSP.tsx` (lines 230-257)

---

## Build Status
✅ Build passes (only pre-existing ConfigList.tsx errors unrelated to migration)

## Features Working
1. ✅ List View Tab - Browse signals with search and filters
2. ✅ Tree View Tab - Interactive VSS tree (with known CSS issue)
3. ✅ Version Diff Tab - Compare VSS versions
4. ✅ Download as JSON - Export vehicle API
5. ✅ Replace Vehicle API - Upload new VSS file
6. ✅ USP 2.0 Tab - Service protocols
7. ✅ V2C Tab - Vehicle-to-Cloud APIs

## Next Steps
- [ ] Investigate long-term solution for tree component CSS isolation
- [ ] Migrate PageManageUsers (if needed)
- [ ] Migrate PageManageFeatures (if needed)
- [ ] Address ConfigList.tsx button variant type errors
