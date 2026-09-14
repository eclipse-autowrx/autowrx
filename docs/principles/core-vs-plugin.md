# Core vs. Plugin Philosophy

This document outlines the architectural philosophy of the Autowrx platform, defining which features are part of the core, stable product and which are considered extensible plugins.

Our goal is to maintain a **lean and stable core** that provides essential, universal functionality. Most features, especially those that are vendor-specific or cater to specialized workflows, are designed as **optional plugins**. This approach keeps the base platform lightweight and makes it highly extensible.

The technical foundation for this on the frontend is our **Dynamic Component Architecture**. Plugins can provide their own components, which are then seamlessly integrated into the application's UI based on a user's or administrator's configuration.

For a detailed explanation of how this is achieved technically, please see the [Dynamic Components Architecture](../reference/component-design/dynamic-components.md) document.

### Plugin Integration Methods

Plugins integrate into the platform through **Dynamic URL Loading**: the host fetches a JavaScript bundle from a URL (an external CDN or an internal zip served by the backend) and executes it, and the bundle registers its component on `window.DAPlugins['page-plugin']`. This is the only integration path implemented today and works without rebuilding the core application (suitable for production as well as development). See the [Plugin Development guide](../guides/plugin/README.md) and [Plugin System architecture](../architecture/plugin-system.md).

> **Roadmap, not implemented:** installing plugins as npm packages (build-time bundling into the core) is a documented aspiration, not a supported integration path. Treat any reference to an npm-install method as future work.
