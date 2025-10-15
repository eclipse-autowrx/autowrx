## PageModelDetail (Component Layering and Flow)

Purpose: display a vehicle model's overview with editable fields, actions (export, download, delete), and related properties/contributors.

### Component composition (layered)

```
PageModelDetail (page)
  ├─ Guard: if no model → DaLoading
  └─ Content (flex, bg-white, p-4)
     ├─ Header row
     │  ├─ Title
     │  │   ├─ [view] DaText
     │  │   └─ [edit] DaInput
     │  └─ Actions (authorized only)
     │      ├─ DaButton: Edit | Cancel | Save
     │      └─ DaMenu (More)
     │          ├─ Export Model (downloadModelZip)
     │          ├─ Download Vehicle API JSON (getComputedAPIs)
     │          └─ Delete Model → DaConfirmPopup
     │
     ├─ Grid (12 cols)
     │  ├─ Left (col-span-6)
     │  │   └─ DaImage (model_home_image_file)
     │  │       └─ [authorized] DaImportFile → DaButton overlay (Update Image)
     │  └─ Right (col-span-6)
     │      ├─ [authorized] DaVehicleProperties (molecule)
     │      ├─ [authorized] DaVisibilityControl (local subcomponent)
     │      │    └─ DaText + DaButton (atoms)
     │      ├─ [authorized] DaStateControl (local subcomponent)
     │      │    └─ DaMenu + DaButton (atoms)
     │      └─ [authorized] DaContributorList (molecule)
     │
     └─ Detail image (optional)
         └─ <img src={model.detail_image_file} />
```

Layering

```
Page (route-level): PageModelDetail
  ↳ Molecules: DaVehicleProperties, DaContributorList, DaConfirmPopup
    ↳ Atoms: DaText, DaInput, DaButton, DaMenu, DaImage, DaImportFile, DaLoading
  ↳ Local subcomponents (page-scoped): DaVisibilityControl, DaStateControl
```

### Local subcomponents

DaVisibilityControl

```
Inputs: initialVisibility, onVisibilityChange
UI: DaText (label/value) + DaButton (toggle public/private)
Action: on click → onVisibilityChange(newVisibility)
```

DaStateControl

```
Inputs: initialState, onStateChange
UI: DaMenu (trigger: DaButton) → Draft | Released | Blocked
Action: on select → onStateChange(state)
```

### Data and state flow

Sources

```
modelStore.model (Zustand) ← set elsewhere via ActiveObjectManagement
useCurrentModel() → refetch (after mutations)
usePermissionHook([PERMISSIONS.WRITE_MODEL, model?.id]) → isAuthorized
```

Mutations

```
Update image
  DaImportFile → uploadFileService(file) → updateModelService(model.id,{ model_home_image_file }) → refetch()

Rename model
  [edit] DaInput → Save → updateModelService(model.id,{ name }) → refetch()

Change visibility
  DaVisibilityControl → updateModelService(model.id,{ visibility })

Change state
  DaStateControl → updateModelService(model.id,{ state }) → refetch()

Export model
  downloadModelZip(model)

Download VSS JSON
  getComputedAPIs(model.id) → create data: URL → a[download]

Delete model
  DaConfirmPopup.onConfirm → deleteModelService(model.id) → addLog(...) → redirect('/model')
```

### Permissions and guards

```
isAuthorized gates all editing UI (inputs, menus, imports, controls)
If no model → DaLoading with timeout hint
```

### Styling

- Tailwind utility classes (e.g., `flex`, `grid`, `col-span-6`, project tokens `text-da-*`, `bg-da-*`).


