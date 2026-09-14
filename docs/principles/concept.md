# Autowrx Platform Concepts

This document provides a high-level overview of the Autowrx platform architecture. Its primary goal is to explain how our key architectural pillars work together to create a lean, performant, and highly extensible ecosystem.

---

## 1. The Core vs. Plugin Philosophy

The foundational principle of our platform is the separation between a stable, lightweight **core** and extensible **plugins**.

-   **The Core:** The core application provides only essential, universal functionality (e.g., user authentication, basic page rendering). Its primary job is to be a stable foundation for plugins to build upon.
-   **Plugins:** Most features, especially those that are vendor-specific or cater to specialized workflows, are designed as optional plugins. This keeps the base platform lean and allows for immense flexibility and customization.

Plugins integrate through **Dynamic URL Loading**: the host fetches the plugin's JavaScript bundle from a URL (an external CDN or an internal zip served by the backend), executes it, and the bundle registers its component on `window.DAPlugins['page-plugin']`. This is the only integration path implemented today. (Installing plugins as npm packages at build time is a documented aspiration, not a supported path.)

---

## 2. Dynamic Component Architecture

The technical implementation of our plugin philosophy on the frontend is the **plugin loader**. There is **no central component registry**: the core application composes real React components directly, and the only truly dynamic path is the plugin loader, `organisms/PluginPageRender.tsx`, which injects a plugin's bundle as a `<script>` tag and polls for its registration on `window.DAPlugins['page-plugin']`. (Some config-driven pages, like the home page, map a site-config element `type` to a real component via a `switch` — this is a fixed mapping in code, not a runtime registry.) See [dynamic-components.md](../reference/component-design/dynamic-components.md) for details.

A plugin component follows a simple contract instead of a schema-based registry:
-   It is rendered by the host with props `{ data, editable, config, api }`.
-   It interacts with the platform exclusively through the optional `PluginAPI` methods on `props.api` — a deliberately narrow surface with no direct access to stores, routing, auth tokens, or the filesystem.

Loading is asynchronous: a plugin's bundle is only fetched and executed when a tab referencing the plugin is opened, and registrations are cached per plugin slug so re-opening a tab doesn't re-inject the script.

---

## 3. Styling Architecture

To ensure a consistent look and feel across the core platform and all installed plugins, we use a multi-layered styling architecture built on Tailwind CSS.

1.  **Core Styles (`global.css`):** A central, admin-controllable CSS file provides the foundational design tokens (as CSS Custom Properties) for theme elements like colors, fonts, and borders.
2.  **Component Styles:** All components, especially those from plugins, **must** consume these core variables for any thematic styling. This ensures their UI automatically adapts to the current theme. For styles that are unique to the component and not part of the global theme, they are free to use standard Tailwind classes or scoped CSS.

This creates a seamless user experience while still allowing components the freedom to define their own unique look.

---

## 4. Project Structure

The physical layout of the codebase reflects this separation of concerns. The project is organized into distinct `backend` and `frontend` applications, with a clear structure that supports the core vs. plugin model. Key directories in the backend, for instance, are dedicated to serving static plugin assets and managing plugin-related APIs. This organization is essential for navigating the codebase and understanding where to add or modify functionality.
