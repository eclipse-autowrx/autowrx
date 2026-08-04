# Styling Architecture

The Autowrx styling system is designed to be robust, consistent, and extensible, mirroring our overall core vs. plugin philosophy. It is built on top of Tailwind CSS and uses a multi-layered approach to manage styles across the platform.

## 1. Core Styles (`global.css`)

The foundation of the system is the `global.css` file. This file is controlled by platform administrators and provides the core design tokens for the entire application.

-   **Purpose:** To ensure a consistent look and feel for all core UI elements and to provide a baseline for all components, including those from plugins.
-   **Content:** Primarily consists of CSS Custom Properties (variables) for colors, fonts, spacing, etc.
-   **Extensibility:** Administrators can modify these variables through the admin panel to apply a new theme to the entire platform instantly.

#### global.css
```css
/* Served at /static/global.css (backend/static/global.css).
   Values use the OKLCH color space; admins can override them via the UI. */
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.4199 0.0374 257.28);
  --primary: oklch(0.35 0.08 230);
  --primary-foreground: oklch(0.984 0.003 247.858);
  --secondary: oklch(0.7626 0.1532 115.73);
  --secondary-foreground: oklch(0.129 0.042 264.695);
  --muted: oklch(0.968 0.007 247.896);
  --muted-foreground: oklch(0.554 0.046 257.417);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.929 0.013 255.508);
  --input: oklch(0.929 0.013 255.508);
  --ring: oklch(0.704 0.04 256.788);
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

#### Theme utilities (no separate `core.css`)

There is no hand-written `core.css` of utility classes. `text-primary`, `border-primary`, `bg-background`, etc. are **Tailwind v4 utilities generated from the `@theme inline` block** in `frontend/src/index.css`, which maps the `global.css` tokens to Tailwind's color scale, e.g. `--color-primary: var(--primary)`. So `text-primary` resolves to `color: var(--primary)` at build time — use these utilities in components instead of re-deriving them.


## 2. Plugin & Component Styles

Plugins and custom components should **not** introduce their own competing, hardcoded styles for core elements like colors or fonts. Instead, they must adhere to the following rules to ensure they integrate seamlessly into the platform's design system.

### A. Consume Core Variables

Components **must** use the CSS variables provided by `global.css` for any style that is part of the core theme. This ensures that when an administrator changes the theme, the plugin's UI updates accordingly.

**CORRECT:**
```tsx
// Consuming a digital.auto palette token directly (defined in frontend/src/index.css @theme inline)
<button className="text-[var(--color-da-primary-500)]">
  Click Me
</button>
```
**CORRECT (preferred):**
```tsx
// Using the Tailwind v4 utility generated from the @theme inline mapping (text-primary -> var(--primary))
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
