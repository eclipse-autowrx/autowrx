## PagePrototypeDetail (Tabs and Component Layering)

Purpose: view and work on a specific prototype within a model, across multiple domains (journey, flow, code, dashboard, homologation, test design, feedback, architecture).

### High-level composition

```
PagePrototypeDetail (page)
  ├─ Header Tabs (DaTabItem)
  │   Journey | Flow | SDV Code | Dashboard | Homologation | More (Architecture, Test Design, Feedback)
  ├─ Popups
  │   ├─ Staging (DaPopup → DaStaging)
  │   └─ Discussion (DaPopup → DaDiscussions)
  └─ Content area (absolute)
      ├─ [default] PrototypeOverview (mode="overview")
      ├─ [requirements] PrototypeOverview (mode="requirement")
      ├─ [architecture] PrototypeTabArchitecture
      ├─ [flow] PrototypeTabFlow
      ├─ [code] PrototypeTabCode
      ├─ [dashboard] PrototypeTabDashboard
      ├─ [homologation] PrototypeTabHomologation
      ├─ [test-design] PrototypeTabTestDesign
      └─ [feedback] PrototypeTabFeedback
      └─ [side] DaRuntimeControl (visible on code/dashboard)
```

### Inputs and activation

```
useParams(): { model_id, prototype_id, tab }
prototype: modelStore.prototype (set via ActiveObjectManagement)
useSelfProfileQuery() → user (persist recent tab)
useCurrentModel() → model context
saveRecentPrototype(user.id, prototype.id, 'prototype', tab)
```

### Tabs explained

Journey (default)

```
Path: /model/:model_id/library/prototype/:prototype_id/(view|journey)
Component: PrototypeOverview mode="overview"
Goal: high-level product view and customer journey for the prototype
Layering: organism → molecules/atoms used inside overview
```

Flow

```
Path: /flow
Component: PrototypeTabFlow
Goal: model functional or data flows; editors and nodes
Layering: organism with editors (molecules), atoms
```

SDV Code

```
Path: /code
Component: PrototypeTabCode
Goal: code workspace for the prototype; shows DaRuntimeControl side panel
Layering: organism; embeds editors (molecules) & atoms
Side panel: DaRuntimeControl visible (showRt=true)
```

Dashboard

```
Path: /dashboard
Component: PrototypeTabDashboard
Goal: runtime dashboard and widget configuration; DaRuntimeControl visible
Layering: organism; dashboard molecules; atoms
Side panel: DaRuntimeControl visible (showRt=true)
```

Homologation

```
Path: /homologation
Component: PrototypeTabHomologation
Goal: regulatory and compliance analysis per prototype
Layering: organism with homologation molecules (e.g., regulation results)
```

Architecture

```
Path: /architecture
Component: PrototypeTabArchitecture
Goal: structural decomposition, APIs, components
Layering: organism; architecture molecules/atoms
```

Test Design

```
Path: /test-design
Component: PrototypeTabTestDesign
Goal: test cases and verification planning
Layering: organism → molecules/atoms for test artifacts
```

Feedback

```
Path: /feedback
Component: PrototypeTabFeedback
Goal: collect feedback and discussion for the prototype
Layering: organism → comments/list molecules → atoms
```

Requirements (legacy/alt entry)

```
Path: /requirements (under More menu in code)
Component: PrototypeOverview mode="requirement"
Goal: requirements view shortcut
```

### Interactions and UI notes

```
- The default tab is Journey unless tab is explicitly flow/code/dashboard/homologation/test-design/feedback/architecture.
- Staging popup is available as a tab-like button in the header.
- Discussion popup opens DaDiscussions for the current prototype.
- DaRuntimeControl is rendered when tab ∈ {code, dashboard} and is positioned as a right-side panel.
```

### Styling

- Tailwind classes with project tokens; header uses border and `h-[52px]` for consistent height.


### Full component layering per tab

Journey (PrototypeOverview)

```
PrototypeOverview (organism)
  ├─ Header tabs (atoms)
  │   └─ button[data-id=prototype-overview-tab-*]
  └─ Content switch
      ├─ PrototypeTabInfo (organism)
      │   ├─ Header (DaText, DaButton, DaMenu, DaConfirmPopup)
      │   ├─ Left: DaImage + [authorized] DaImportFile + DaButton overlay
      │   ├─ Right (view): DaTableProperty (molecule)
      │   └─ Right (edit): DaInputWithLabel × N, DaSelect, DaSelectItem
      ├─ PrototypeTabJourney (organism)
      │   ├─ Header (DaText, DaButton, DaMenu, DaConfirmPopup)
      │   └─ DaCustomerJourneyTable → DaTableEditor (molecule)
      └─ PrototypeTabRequirement (organism)
          ├─ Toolbar (DaButton × N, icons)
          ├─ View toggle (Explorer/Table)
          ├─ Explorer view: ReactFlowProvider → DaRequirementExplorer (molecule)
          ├─ Table view: DaRequirementTable (molecule)
          └─ Dialogs: RequirementEvaluationDialog, RequirementCreateDialog, RequirementUpdateDialog (molecules)
```

Flow (PrototypeTabFlow)

```
PrototypeTabFlow (organism)
  ├─ Header: DaText title, DaButton[Edit/Cancel/Save], Fullscreen toggle
  ├─ Edit mode: DaFlowEditor (molecule)
  ├─ View mode:
  │   └─ <table>
  │       ├─ <thead>
  │       │   ├─ headerGroups (utils)
  │       │   └─ FLOW_CELLS titles (DaTooltip for tooltipped headers)
  │       └─ <tbody>
  │           ├─ Step rows
  │           │   └─ Section header with chevrons
  │           └─ Flow rows
  │               └─ For each FLOW_CELLS:
  │                   ├─ isSignalFlow → FlowInterface (molecule)
  │                   └─ else → FlowItem (molecule) with onEdit → FlowItemEditor (molecule)
  └─ Footer: DaCheckbox "Show ASIL/QM Levels"
```

SDV Code (PrototypeTabCode)

```
PrototypeTabCode (organism)
  ├─ Top bar (DaButton popups)
  │   ├─ DaPopup → DaGenAI_Python (molecule)
  │   ├─ DaPopup → DaVelocitasProjectCreator (molecule)
  │   └─ [optional] Deploy to EPAM (DaButton)
  ├─ Main area (split)
  │   ├─ Left (editor)
  │   │   └─ Suspense → (ProjectEditor | CodeEditor) (molecules)
  │   └─ Right panel
  │       └─ Suspense → PrototypeTabCodeApiPanel (organism-level panel)
  └─ Autosave ticker → updatePrototypeService
```

Dashboard (PrototypeTabDashboard)

```
PrototypeTabDashboard (organism)
  └─ DaDashboard (molecule)
      ├─ May include: DaDashboardGrid, DaDashboardEditor, DaDashboardWidgetEditor
      └─ Widgets compose atoms (buttons, inputs) and custom widget molecules
```

Homologation (PrototypeTabHomologation)

```
PrototypeTabHomologation (organism)
  └─ DaHomologation (molecule)
      ├─ DaHomologationUsedAPIs, DaHomologationVehicleProperties
+     ├─ DaHomologationRegulationResult[List]
      └─ Atoms within tables, badges, etc.
```

Architecture (PrototypeTabArchitecture)

```
PrototypeTabArchitecture (organism)
  └─ Architecture (organism)
      ├─ Left sidebar (toggleable)
      │   ├─ DaText title, DaButton "New Node"
      │   └─ Node list items with DaConfirmPopup, DaCopy
      ├─ Top bar (active node)
      │   ├─ Sidebar toggle (DaButton)
      │   ├─ Title (DaText | DaInput when editing)
      │   ├─ Edit/Save/Cancel (DaButton)
      │   └─ Fullscreen toggle (DaButton)
      └─ Canvas area
          ├─ Preview: ImageAreaPreview (external lib)
          └─ Edit: ImageAreaEdit (external lib) with onSave/onUpdate and handleUploadImage
```

Test Design (PrototypeTabTestDesign)

```
PrototypeTabTestDesign (organism)
  ├─ Extract signals from prototype.code (regex)
  ├─ Build payload { name, description, code, customer_journey, signals, requirements }
  └─ <iframe> to external assistant URL; postMessage payload when ready
```

Feedback (PrototypeTabFeedback)

```
PrototypeTabFeedback (organism)
  ├─ Header: DaText title, overall DaStarsRating, actions (View Portfolio, + Add Feedback)
  ├─ DaPopup → FeedbackForm (molecule)
  ├─ Body: DaLoadingWrapper → list of feedback items
  │   └─ Each item: DaText blocks, DaStarsRating × 3, [owner] DaConfirmPopup + DaButton Delete
  └─ Pagination: DaPaging → DaPagination* (atoms)
```

### Deep-dive component trees (expanded)

Journey (PrototypeOverview deep)

```
PrototypeOverview
  ├─ Header tabs (atoms)
  │   ├─ button[data-id=prototype-overview-tab-overview]
  │   ├─ button[data-id=prototype-overview-tab-customerJourney]
  │   └─ button[data-id=prototype-overview-tab-requirement]
  └─ Content
      ├─ PrototypeTabInfo
      │   ├─ Header bar
      │   │   ├─ DaText (title | "Editing Prototype")
      │   │   ├─ Actions (authorized)
      │   │   │   ├─ [optional admin] DaButton (Editor Choice) + TbStar/TbStarFilled
      │   │   │   ├─ DaButton Edit | Cancel | Save
      │   │   │   └─ DaMenu (Export Prototype, Delete Prototype) + DaConfirmPopup
      │   ├─ Main split
      │   │   ├─ Left media: DaImage + [authorized] DaImportFile → DaButton overlay
      │   │   └─ Right panel
      │   │       ├─ View mode: DaTableProperty (Problem, Says who?, Solution, Complexity, Status)
      │   │       └─ Edit mode: form
      │   │           ├─ DaInputWithLabel × N (name, problem, says_who, solution)
      │   │           ├─ DaSelect (complexity) + DaSelectItem × 5
      │   │           └─ DaSelect (state) + DaSelectItem (Developing/Released)
      │   └─ Side (commented blocks): DaCustomerJourneyTable / Requirement explorer (not rendered)
      ├─ PrototypeTabJourney
      │   ├─ Header similar to Info (title, actions, menu)
      │   └─ Body: DaCustomerJourneyTable (DaTableEditor) with defaultValue, onChange, isEditing
      └─ PrototypeTabRequirement (see Requirement deep)
```

Flow (PrototypeTabFlow deep)

```
PrototypeTabFlow
  ├─ Header
  │   ├─ DaText "End-to-End Flow: <prototype.name>"
  │   ├─ [authorized] Edit controls: DaButton Edit | Cancel | Save (with TbLoader when saving)
  │   └─ Fullscreen toggle DaButton (TbArrowsMaximize/Minimize)
  ├─ Edit mode: DaFlowEditor
  │   ├─ <table> with headerGroups + FLOW_CELLS
  │   ├─ For each step
  │   │   ├─ Step header row with chevrons
  │   │   ├─ Flow rows
  │   │   │   ├─ For each cell in FLOW_CELLS
  │   │   │   │   ├─ isSignalFlow → SignalFlowEditor
  │   │   │   │   │   ├─ FlowDirectionSelector (atoms/icons)
  │   │   │   │   │   ├─ DaTooltip (signal)
  │   │   │   │   │   └─ input[type=text] (signal)
  │   │   │   │   └─ else → FlowItemEditor (CustomDialog)
  │   │   │   │       ├─ Left column (mandatory/custom fields)
  │   │   │   │       │   ├─ DaInput (type, component)
  │   │   │   │       │   ├─ DaTextarea (description)
  │   │   │   │       │   ├─ ASILSelect (pre/post) + TbChevronRight icon
  │   │   │   │       │   ├─ Custom attributes list (DaInput + TbTrash)
  │   │   │   │       │   └─ DaButton (Add Custom Attribute)
  │   │   │   │       └─ Right column: RiskAssessmentEditor (markdown editor/view)
  │   │   │   └─ Delete flow button (TbTrash)
  │   │   └─ Add Flow row: DaButton variant=dash
  │   └─ onUpdate emits JSON string to parent
  ├─ View mode table (read-only matrix)
  │   ├─ Signal flows: FlowInterface
  │   │   ├─ DropdownMenu (trigger: DaTooltip + DirectionArrow)
  │   │   └─ DropdownMenuContent lists interfaceType + JSON fields
  │   │       └─ Links: external https:// or Vehicle.* → navigate to /model/:id/api/:path
  │   └─ Activities: FlowItem
  │       ├─ DropdownMenu (System Activity) with Edit button (authorized)
  │       ├─ ASILBadge (pre/post) shown when enabled in useSystemUI
  │       └─ RiskAssessmentMarkdown when available
  └─ Footer: DaCheckbox "Show ASIL/QM Levels"
```

SDV Code (PrototypeTabCode deep)

```
PrototypeTabCode
  ├─ Toolbar (authorized)
  │   ├─ DaPopup → DaGenAI_Python (code generation) within Suspense
  │   ├─ DaPopup → DaVelocitasProjectCreator
  │   └─ [optional] DaButton deployToEPAM
  ├─ Info strip (language)
  ├─ Main split
  │   ├─ Left editor
  │   │   ├─ Suspense → CodeEditor (Monaco) when editorType='code'
  │   │   │   └─ theme: vs-dauto/read-only, options, onBlur → saveCodeToDb
  │   │   └─ Suspense → ProjectEditor when editorType='project'
  │   │       ├─ Left panel: FileTree (create/rename/delete/upload/import zip)
  │   │       ├─ Resizable divider
  │   │       └─ Right Editor: tabs, unsaved badges, save (Cmd/Ctrl+S), saveAll
  │   └─ Right panel (activeTab=='api')
  │       └─ Suspense → PrototypeTabCodeApiPanel (API inspector for code)
  └─ Autosave ticker (interval) → updatePrototypeService(prototype.id, { code })
```

Dashboard (PrototypeTabDashboard deep)

```
PrototypeTabDashboard
  └─ DaDashboard
      ├─ Top bar (absolute)
      │   ├─ [fullscreen] brand logo (DaImage)
      │   ├─ [authorized]
      │   │   ├─ MODE_RUN → DaButton Edit
      │   │   └─ MODE_EDIT → row with
      │   │       ├─ DaButton Delete all widgets
      │   │       └─ Right: DaButton Cancel | Save
      │   └─ Fullscreen toggle DaButton
      ├─ Content (pt adjusted by fullscreen)
      │   ├─ MODE_RUN → DaDashboardGrid(widgetItems)
      │   │   ├─ Grid 5x2
      │   │   ├─ WidgetItem (per widget)
      │   │   │   ├─ boxes → row/col spans
      │   │   │   └─ iframe url with ?options=...
      │   │   │       └─ postMessage 'vss-sync' and 'app-log'
      │   │   └─ DaPopup modal (video/image/iframe HTML) triggered by widgets
      │   └─ MODE_EDIT → PrototypeTabCodeDashboardCfg (config editor)
      └─ Editors (edit mode helpers)
          ├─ DaDashboardEditor
          │   ├─ Widget grid cells (select cells, validate rectangle/overlap)
          │   ├─ Cell toolbar: Add widget (DaWidgetLibrary) | Add widget from URL | Cancel place
          │   ├─ Selected widget overlay: Delete, Open in Studio, Edit (JSON)
          │   └─ Warning banners when invalid
          └─ DaDashboardWidgetEditor (popup)
              ├─ Options (CodeEditor JSON)
              ├─ Boxes (DaInput JSON)
              ├─ URL/Icon (DaInput)
              └─ Used signals dropdown: ModelApiList + copy all/copy one
```

Homologation (PrototypeTabHomologation deep)

```
PrototypeTabHomologation
  └─ DaHomologation
      ├─ DaHomologationVehicleProperties
      ├─ DaHomologationUsedAPIs (+ Header)
      ├─ DaHomologationApiListItem
      ├─ DaHomologationRegulationResult[List]
      └─ DaHomologationPoweredBy
```

Architecture (PrototypeTabArchitecture deep)

```
PrototypeTabArchitecture
  └─ Architecture(displayMode='prototype')
      ├─ Left sidebar (toggleable)
      │   ├─ DaText title + DaButton New Node
      │   └─ Node list → item rows with DaText, IDs, DaConfirmPopup Delete, DaCopy link
      ├─ Top bar (active node)
      │   ├─ Sidebar toggle button
      │   ├─ Title (DaText) | Edit (DaInput) + Save/Cancel
      │   └─ Fullscreen toggle
      └─ Canvas area
          ├─ Preview: ImageAreaPreview(shapes, bgImage) with clickable links
          └─ Edit: ImageAreaEdit(shapes, bgImage) with onSave/onUpdate/handleUploadImage (axios upload)
```

Test Design (PrototypeTabTestDesign deep)

```
PrototypeTabTestDesign
  ├─ extractSignalsFromCode(regex on 'vehicle.' → 'Vehicle.')
  ├─ payload ← { name, description(+status), code, customer_journey, signals, requirements[] }
  └─ <iframe src=assistant> onLoad → postMessage({ type: 'prototype-information', payload })
```

Feedback (PrototypeTabFeedback deep)

```
PrototypeTabFeedback
  ├─ Header
  │   ├─ DaText title
  │   ├─ Overall: DaStarsRating readonly + average score
  │   └─ Actions: Link(View Portfolio) + DaPopup(Add Feedback) → FeedbackForm
  ├─ List (DaLoadingWrapper)
  │   └─ Item card
  │       ├─ Interviewee: DaText name/org
  │       ├─ Scores: Needs addressed | Relevance | Ease of use → DaStarsRating
  │       ├─ Question/Recommendation blocks
  │       └─ [owner] DaConfirmPopup → DaButton Delete
  └─ Pagination: DaPaging → DaPaginationContent → Previous | pages (DaPaginationLink) | Next
```

### Requirement views (Explorer/Table) internals

Explorer (DaRequirementExplorer)

```
DaRequirementExplorer
  ├─ ReactFlowProvider → ReactFlow
  │   ├─ nodeTypes: { radarBackground, requirementNode }
  │   ├─ Background grid
  │   └─ Panel(bottom-left) → Legend (local component)
  ├─ initialNodes from requirement store
  │   ├─ radar-bg (RadarBackgroundNode) with rings/spokes
  │   └─ requirementNode × N
  │       ├─ data: id, title, description, type, ratingAvg, rating{priority,relevance,impact}
  │       ├─ source type → color (internal=#005072, external=#aebd38)
  │       ├─ computed layout: radius/angle/size from ratings
  │       └─ actions: onDelete, onEdit passthrough
  └─ useRequirementStore → requirements array (Zustand)
```

Table (DaRequirementTable)

```
DaRequirementTable
  ├─ useRequirementStore().requirements
  ├─ Columns (TanStack Table)
  │   ├─ id, title, description, type
  │   ├─ source (tooltip + external link)
  │   ├─ rating (avg of priority/relevance/impact)
  │   └─ actions (DropdownMenu)
  │       ├─ Metadata (createdAt, updatedAt, creatorUserId)
  │       ├─ Rating detail (priority, relevance, impact)
  │       └─ Settings: Edit Requirement | Delete Requirement (callbacks)
  └─ Table atoms: Table, TableHeader, TableBody, TableRow, TableHead, TableCell
```

Requirement store (useRequirementStore)

```
useRequirementStore (Zustand)
  - isScanning, startScanning/stopScanning/toggleScanning
  - requirements (Requirement[])
  - setRequirements(reqs)
  - addRequirement(r)
  - removeRequirement(id)
  - updateRequirement(r)
  - applyAISuggestions()
```

### Flow editors and viewers internals

Flow editor (DaFlowEditor)

```
DaFlowEditor
  ├─ Header rows: headerGroups, FLOW_CELLS (titles with DaTooltip)
  ├─ Body per step
  │   ├─ Step header row with chevrons
  │   ├─ Flow rows per step
  │   │   ├─ Signal cells → SignalFlowEditor
  │   │   │   ├─ FlowDirectionSelector (direction icons)
  │   │   │   └─ input[type=text] signal value
  │   │   └─ Text cells → FlowItemEditor (dialog)
  │   │       ├─ Left: DaInput/DaTextarea/ASILSelect + custom attributes (DaInput + TbTrash)
  │   │       └─ Right: RiskAssessmentEditor (markdown)
  │   └─ Footer row: Add Flow (DaButton variant=dash)
  └─ onUpdate(JSON.stringify(data)) to parent
```

Flow viewer cells

```
FlowInterface (signal cell)
  ├─ DropdownMenu (trigger: DirectionArrow wrapped by DaTooltip)
  ├─ JSON signal → render key/value with link detection (https:// | Vehicle.*)
  └─ Plain text → Name + Direction label

FlowItem (text cell)
  ├─ DropdownMenu (System Activity)
  │   ├─ Edit (authorized) → invokes onEdit
  │   └─ Close
  ├─ Parsed content: description, ASILBadge (pre/post)
  └─ RiskAssessmentMarkdown when riskAssessment provided
```

### Code/Project editors internals

CodeEditor (Monaco)

```
CodeEditor
  ├─ Monaco theme: vs-dauto | read-only
  ├─ onChange setCode, onBlur triggers save
  └─ options: readOnly, minimap=false, wordWrap=on, fontSize
```

ProjectEditor (file-tree editor)

```
ProjectEditor
  ├─ Left panel (resizable, collapsible)
  │   ├─ toolbar: new file/folder, download ZIP, import ZIP, collapse all
  │   ├─ inline root create input
  │   └─ FileTree (select/delete/rename/add/upload/drag-drop)
  ├─ Right panel: Editor tabs (openFiles), content change with unsaved tracking
  ├─ Shortcuts: Cmd/Ctrl+S (save current), +Shift+S (save all)
  └─ onChange emits JSON FS structure string
```

### Dashboard widget library/config internals

DaDashboardEditor (grid config)

```
DaDashboardEditor
  ├─ Grid 5x2 of cells (select cells → validate rectangle)
  ├─ Place mode toolbar: Add widget (DaWidgetLibrary) | Add from URL | Cancel
  ├─ Widget overlay: Delete, Open in Studio, Edit JSON (DaDashboardWidgetEditor)
  ├─ Validations: contiguous cells, no overlap (utils)
  └─ Writes updated JSON to onDashboardConfigChanged
```

DaWidgetLibrary (marketplace/GenAI)

```
DaWidgetLibrary (popup)
  ├─ Tabs: Marketplace | Widget ProtoPilot (GenAI)
  ├─ Marketplace: DaWidgetList (pick activeWidget)
  ├─ GenAI: DaWidgetSetup (enter URL/options)
  ├─ Create with Studio (optional)
  └─ Add button → append { plugin, widget, options, boxes } to dashboard config
```

DaDashboardWidgetEditor (popup)

```
DaDashboardWidgetEditor
  ├─ Options (CodeEditor JSON)
  ├─ Boxes (DaInput JSON array)
  ├─ URL/Icon (DaInput)
  └─ Used signals dropdown (ModelApiList + copy helpers)
```


