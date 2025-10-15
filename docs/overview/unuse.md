## Unused or Low-usage Components/Libraries (static scan)

Notes

- This is a static reference/usage scan. Some items may be used dynamically or in dev-only pages.
- “Unused” means no import references found across `src/**` (or only imported but never rendered externally).

Organisms (candidates)

- components/organisms/SiteFooter.tsx
  - No imports found. Likely unused.

- components/organisms/GenAIDashboardConfigTemplates.tsx
  - No imports found. Likely unused.

- components/organisms/RuntimeAssetManager.tsx
  - Imported only by `components/molecules/dashboard/DaRuntimeControl.tsx`.
  - If DaRuntimeControl does not render this in runtime paths, consider pruning or lazy-loading.

- components/organisms/ApiDetail.tsx
  - Imported by `components/organisms/ViewApiCovesa.tsx` only.
  - If the Covesa view path is deprecated, this can be removed or inlined.

Molecules (candidates)

- components/molecules/remote-compiler/DaRemoteCompileRust.tsx
  - No imports found. Likely unused.

- components/molecules/project_editor/Introduction.tsx, Example.tsx
  - No imports found. Likely docs/demo only.

- components/molecules/genAI/*
  - DaGenAI_Widget.tsx referenced by WidgetSetup; others used by ProtoPilot/ChatBox.
  - Verify `DaGenAI_Dashboard.tsx` runtime usage; if not reachable, consider pruning.

- components/molecules/dashboard/PrototypeVarsWatch.tsx
  - Referenced by DaRuntimeControl only; ensure it is rendered; else consider removal.

Pages/test-ui and dev helpers

- src/pages/test-ui/** (components, molecules, organisms, discussions, project-editor)
  - Dev/demo only. Safe to exclude from production bundles if desired.

Other observations

- Some inventory molecules (schema/instance variants) are only used via the iframe app; if not linked from host, keep but mark as external-dependency stubs.
- Check “ViewApiV2C.tsx” and “ViewApiUSP.tsx” are both used via `PageVehicleApi.tsx`. V2C/USP appear referenced; keep.

Action suggestions

- Remove or archive: SiteFooter, GenAIDashboardConfigTemplates, DaRemoteCompileRust, project_editor/Introduction, project_editor/Example if confirmed unused.
- Add unit imports check in CI to catch regressions.
- Consider code-splitting or lazy-loading rarely visited tools.


