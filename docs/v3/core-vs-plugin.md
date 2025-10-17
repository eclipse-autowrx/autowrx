# Core vs. Plugin Philosophy

This document outlines the architectural philosophy of the Autowrx platform, defining which features are part of the core, stable product and which are considered extensible plugins.

Our goal is to maintain a **lean and stable core** that provides essential, universal functionality. Most features, especially those that are vendor-specific or cater to specialized workflows, are designed as **optional plugins**. This approach keeps the base platform lightweight and makes it highly extensible.

The technical foundation for this on the frontend is our **Dynamic Component Architecture**. Plugins can provide their own components, which are then seamlessly integrated into the application's UI based on a user's or administrator's configuration.

For a detailed explanation of how this is achieved technically, please see the [Dynamic Components Architecture](./component-design/dymanic-components.md) document.

### Plugin Integration Methods

Plugins can be integrated into the Autowrx platform in two primary ways, offering flexibility for different development and deployment scenarios:

1.  **NPM Package Installation:** This is the standard and recommended approach for production environments. A plugin is packaged as a standard npm module and installed into the core application's dependencies. This allows for robust version management and build-time optimizations.

2.  **Dynamic URL Loading:** For rapid development, testing, or scenarios where the core application cannot be rebuilt (e.g., a SaaS environment), plugins can also be loaded from a URL. The platform can be configured to fetch a JavaScript bundle from a specified URL, which would then execute and register its components with the system.
