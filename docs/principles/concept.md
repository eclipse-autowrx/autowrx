# Autowrx Platform Concepts

This document provides a high-level overview of the Autowrx platform architecture. Its primary goal is to explain how our key architectural pillars work together to create a lean, performant, and highly extensible ecosystem.

---

## 1. The Core vs. Plugin Philosophy

The foundational principle of our platform is the separation between a stable, lightweight **core** and extensible **plugins**.

-   **The Core:** The core application provides only essential, universal functionality (e.g., user authentication, basic page rendering). Its primary job is to be a stable foundation for plugins to build upon.
-   **Plugins:** Most features, especially those that are vendor-specific or cater to specialized workflows, are designed as optional plugins. This keeps the base platform lean and allows for immense flexibility and customization.

Plugins can be integrated in two ways:
1.  **NPM Package Installation:** The standard method for production, allowing for version management and build-time optimization.
2.  **Dynamic URL Loading:** A flexible method for development and testing, where a plugin can be loaded on-the-fly from a remote JavaScript file.

---

## 2. Dynamic Component Architecture

The technical implementation of our plugin philosophy on the frontend is the **Dynamic Component Architecture**. This system is what allows plugin-provided UI components to be seamlessly and dynamically rendered within the core application, making the entire UI configuration-driven.

It is built on three key ideas:

### A. The Component Registry
Instead of a monolithic function that knows about all possible components, we use a **Registry Pattern**. This is a central `ComponentRegistry` object where each plugin can register its own components using a unique `type` name. The core application's renderer simply asks the registry for the component associated with a given type. This keeps the core decoupled and extensible.

### B. Standardized Component API & Schema
For a component to be compatible with the system, it must follow a strict contract:
-   It must accept two props: `option` (for styling/configuration) and `data` (for content).
-   It must provide a **schema** that defines the expected shape of its `option` and `data` props. This schema is crucial for validation, auto-generating admin forms, and enabling reliable AI-powered layout generation.

### C. Asynchronous (Lazy) Loading
To ensure the platform remains performant, components are not loaded until they are actually needed. By using `React.lazy()`, the code for a plugin's components is only fetched from the server when a page configuration calls for it to be rendered.

---

## 3. Styling Architecture

To ensure a consistent look and feel across the core platform and all installed plugins, we use a multi-layered styling architecture built on Tailwind CSS.

1.  **Core Styles (`global.css`):** A central, admin-controllable CSS file provides the foundational design tokens (as CSS Custom Properties) for theme elements like colors, fonts, and borders.
2.  **Component Styles:** All components, especially those from plugins, **must** consume these core variables for any thematic styling. This ensures their UI automatically adapts to the current theme. For styles that are unique to the component and not part of the global theme, they are free to use standard Tailwind classes or scoped CSS.

This creates a seamless user experience while still allowing components the freedom to define their own unique look.

---

## 4. Project Structure

The physical layout of the codebase reflects this separation of concerns. The project is organized into distinct `backend` and `frontend` applications, with a clear structure that supports the core vs. plugin model. Key directories in the backend, for instance, are dedicated to serving static plugin assets and managing plugin-related APIs. This organization is essential for navigating the codebase and understanding where to add or modify functionality.
