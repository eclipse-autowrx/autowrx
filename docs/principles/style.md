# Styling Architecture

The Autowrx styling system is designed to be robust, consistent, and extensible, mirroring our overall core vs. plugin philosophy. It is built on top of Tailwind CSS and uses a multi-layered approach to manage styles across the platform.

## 1. Core Styles (`global.css`)

The foundation of the system is the `global.css` file. This file is controlled by platform administrators and provides the core design tokens for the entire application.

-   **Purpose:** To ensure a consistent look and feel for all core UI elements and to provide a baseline for all components, including those from plugins.
-   **Content:** Primarily consists of CSS Custom Properties (variables) for colors, fonts, spacing, etc.
-   **Extensibility:** Administrators can modify these variables through the admin panel to apply a new theme to the entire platform instantly.

#### global.css 
```css
:root {
  /* Core Colors */
  --var-color-primary: #e74266;
  --var-color-secondary: #3498db;
  --var-color-text: #333333;

  /* Base Layout */
  --var-border-radius: 0.5rem;
  --var-border-width: 2px;
}

```

### Regional background hooks

Layouts and main pages expose stable `da-*` hook classes for instance-level `global.css` overrides. Components keep their Tailwind `bg-*` defaults; hooks are selectors only.

`global.css` is loaded in `index.html` before the app bundle (which includes Tailwind utilities). When overriding Tailwind `bg-*` classes, use `!important` in instance `global.css`.

| Hook class | Component / region |
|---|---|
| `da-root-layout` | `RootLayout` outer shell |
| `da-root-layout-main` | `RootLayout` scrollable outlet |
| `da-root-layout-footer` | `RootLayout` branding footer |
| `da-primary-nav-bar` | `NavigationBar` header |
| `da-primary-nav-logo` | Logo in `NavigationBar` |
| `da-secondary-nav-bar` | `RootLayout` breadcrumb bar |
| `da-model-detail-layout` | `ModelDetailLayout` outer shell |
| `da-model-detail-tab-bar` | `ModelDetailLayout` tab strip |
| `da-model-detail-content-frame` | `ModelDetailLayout` content frame |
| `da-model-detail-content` | `ModelDetailLayout` inner panel |
| `da-page-model-list` | `PageModelList` root |
| `da-page-model-list-tab-bar` | `PageModelList` tab strip |
| `da-page-model-list-frame` | `PageModelList` outer frame |
| `da-page-model-list-content` | `PageModelList` inner card |
| `da-page-prototype-library` | `PagePrototypeLibrary` root |
| `da-page-model-detail` | `PageModelDetail` root |
| `da-page-prototype-detail` | `PagePrototypeDetail` root |
| `da-page-prototype-detail-tab-bar` | `PagePrototypeDetail` tab strip |
| `da-page-new-prototype-detail` | `PageNewPrototypeDetail` root |
| `da-page-new-prototype-detail-tab-bar` | `PageNewPrototypeDetail` tab strip |
| `da-page-vehicle-api` | `PageVehicleApi` root |
| `da-page-vehicle-api-tab-bar` | `PageVehicleApi` tab strip |
| `da-page-home` | `PageHome` root |
| `da-dashboard-fullscreen-toolbar` | Fullscreen toolbar in `DaDashboard` |
| `da-dashboard-fullscreen-logo` | Logo in fullscreen toolbar |
| `da-form-create-model-submit` | Create Model submit button |
| `da-form-create-prototype-submit` | Create Prototype submit button |

**Example instance override (gradient header):**

```css
.da-primary-nav-bar {
  background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%) !important;
  color: var(--primary-foreground);
  border: none !important;
}

.da-primary-nav-logo {
  filter: brightness(0) invert(1);
}

.da-secondary-nav-bar {
  background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%) !important;
  color: var(--primary-foreground);
}

.da-page-model-list-frame {
  background-color: #f0f4f8 !important;
}
```

#### core.css
```css
.text-primary {
  color: var(--var-color-primary);
}

.border-primary {
  border-color: var(--var-color-primary);
  border-width: var(--var-border-width);
  border-style: solid;
}

```


## 2. Plugin & Component Styles

Plugins and custom components should **not** introduce their own competing, hardcoded styles for core elements like colors or fonts. Instead, they must adhere to the following rules to ensure they integrate seamlessly into the platform's design system.

### A. Consume Core Variables

Components **must** use the CSS variables provided by `global.css` for any style that is part of the core theme. This ensures that when an administrator changes the theme, the plugin's UI updates accordingly.

**CORRECT:**
```tsx
// Consuming a core variable in a React component
<button className="text-[var(--da-color-primary)] border-[var(--var-border-width)]">
  Click Me
</button>
```
**CORRECT:**
```tsx
// Consuming a core variable in a React component
<button className="text-primary border-primary">
  Click Me
</button>
```

**INCORRECT:**
```tsx
// Hardcoding values that should come from the core theme
<button className="text-red-500 border-2">
  Click Me
</button>
```

### B. Isolate Component-Specific Styles

For styles that are unique to a component and are not part of the global theme (e.g., the specific layout of internal elements, a unique illustration, etc.), it is perfectly acceptable to use standard Tailwind classes or component-scoped CSS.

This layered approach provides the perfect balance:

-   **Platform administrators** have high-level control over the overall look and feel.
-   **Plugin developers** can build feature-rich components that seamlessly adapt to the platform's theme while still having the freedom to style their unique parts.
