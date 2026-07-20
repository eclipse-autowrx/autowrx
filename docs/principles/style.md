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
