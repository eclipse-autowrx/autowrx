## Breadcrumbs (components/molecules/DaBreadcrumbBar.tsx)

Purpose: display current location trail; dynamic segments resolved from stores and context.

Rendering tree

```
DaBreadcrumbBar (molecule)
  └─ DaBreadcrumb
     └─ DaBreadcrumbList
        ├─ Home
        ├─ ... generated items (with DaBreadcrumbSeparator)
        └─ Current leaf (styled)
```

Inputs and context

```
useLocation() → pathname segments
useCurrentModel() → model.id, model.name
useCurrentPrototype() → prototype.id, prototype.name
useCurrentInventoryData() → roleData, inventoryItem
useGenAIWizardStore() → wizardPrototype
```

Generation logic (simplified)

```
start: [Home]
if /model → add "Vehicle Models"
if model resolved → add model.name
if library/prototype → add "Prototype Library" → [prototype.name]
if /genai-wizard → add "Vehicle App Generator" → [wizard modelName] → [wizard name]
if /privacy-policy → add "Privacy Policy"
if /inventory → add "Inventory" plus Schema/Instance or Role/Item paths
```

Visibility

```
RootLayout decides visibility via getPathsWithoutBreadcrumb(routesConfig)
  - If current path NOT in noBreadcrumb set → breadcrumb bar is shown
```

Styling

- Tailwind classes with project tokens; white text in secondary bar.


