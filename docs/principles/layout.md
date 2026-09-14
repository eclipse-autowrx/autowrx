# Frontend Layout & Component Concepts

This document visually demonstrates the core layout and component concepts of the Autowrx platform. For a higher-level overview of the entire platform architecture, please see the [**Platform Concepts**](./concept.md) document.

---

## Standard Page Layout

All pages on the platform share a consistent high-level structure, typically composed of a navigation bar, a main content area, and a footer.

```
┌────────────────────────────────┐
│             NavBar             │
└────────────────────────────────┘
┌────────────────────────────────┐
│                                │
│          Page Content          │
│                                │
└────────────────────────────────┘
┌────────────────────────────────┐
│             Footer             │
└────────────────────────────────┘      
```

The `Page Content` area is where the dynamic rendering of components takes place.

---

## Page Composition with Dynamic Components

Pages are not built with hardcoded layouts. Instead, they are composed of a series of dynamic components defined in a configuration object. This allows for incredible flexibility in layout design.

> For a deep dive into the technical implementation, see the **[Dynamic Components Architecture](../reference/component-design/dynamic-components.md)**.

### Row-Based Layout Example (`PageHome`)

A common pattern is a row-based layout, where the page configuration is a simple array of components rendered vertically. The real home page (`PageHome`) works this way: it reads the `CFG_HOME_CONTENT` site config and renders a vertical list of element components looked up from `homeComponentMap.ts`. (The component boxes below are schematic.)

```
Row 1: <BannerView />
┌──────────────────────────────────┐
│                                  │
└──────────────────────────────────┘
                                    
Row 2: <ListView />
┌──────────────────────────────────┐
│       ┌────┐ ┌────┐ ┌────┐       │
│       │    │ │    │ │    │       │
│       └────┘ └────┘ └────┘       │
└──────────────────────────────────┘
                                    
Row 3: <GridView />
┌──────────────────────────────────┐
│ ┌──────┐┌──────┐┌──────┐┌──────┐ │
│ │      ││      ││      ││      │ │
│ └──────┘└──────┘└──────┘└──────┘ │
│ ┌──────┐┌──────┐┌──────┐┌──────┐ │
│ │      ││      ││      ││      │ │
│ └──────┘└──────┘└──────┘└──────┘ │
└──────────────────────────────────┘
                                    
          ...............           
```

### Tab-Based Layout Example (`PageModelDetail`)

More complex pages, like `PageModelDetail` (wrapped in `ModelDetailLayout`) or `PagePrototypeDetail`, use a tabbed interface to render different content panes.

```
<Breadcrumb/>                           
┌───────────────────────────────────────┐
│ Home/Model/EVCar                      │
└───────────────────────────────────────┘
┌──────┐┌──────┐┌──────┐            ┌───┐
│ Tab1 ││ Tab2 ││ Tab3 │            │...│
└──────┘└──────┘└──────┘            └───┘
┌───────────────────────────────────────┐
│                                       │
│                                       │
│                                       │
│          Active Tab Component         │
│                                       │
│                                       │
│                                       │
└───────────────────────────────────────┘
```

## Custom Page
Free layout, free to design your function

## State Management: Core vs. Plugins

The platform uses a global state management solution accessible by all components. The distinction between core and plugin code is about **how a component is loaded and where it runs**, not about special base types (there are no `BuiltInComponent`/`ExtensionComponent` classes). This reflects our **[Core vs. Plugin Philosophy](./core-vs-plugin.md)**.

- **Core components** are real React components compiled into the app; they read/write shared stores (Zustand) and React Query caches directly.
- **Plugin components** are loaded dynamically from a URL by `PluginPageRender.tsx` and run in the host page. They do **not** touch host stores directly — they interact with the platform only through the optional `PluginAPI` passed as `props.api`.

```
                   GlobalState (Zustand + React Query)
                   ▲                ▲
                   │ direct         │ mediated — plugins never
                   │                │ touch stores directly
                   │                │
   ┌───────────────┴──────┐   ┌─────┴────────────────┐
   │  Core component       │   │  Plugin component     │
   │  (compiled into app)  │   │  (loaded from a URL   │
   │                       │   │   by PluginPageRender) │
   └───────────┬──────────┘   └───────────┬──────────┘
               │                            │ props.api only
               ▼                            ▼
          ChildComponent                PluginAPI
```

Core components read/write shared stores directly; plugin components interact with the platform only through the `PluginAPI` the host passes them.

## Builtin components

## Component Granularity (Atoms, Molecules, Organisms)

To ensure reusability and maintainability, we follow the principles of Atomic Design. Components are broken down into three layers of granularity.

-   **Atoms:** The smallest building blocks (buttons, inputs, labels).
-   **Molecules:** Groups of atoms forming simple components (a search form).
-   **Organisms:** Complex UI components composed of molecules and/or atoms (a site header).

**Pages should primarily be composed of Organisms** to reduce complexity and promote reuse. Directly using Atoms on a page is discouraged.

```
 Page
┌─────────────────────────────────────────────────┐
│ ┌────────┐ ┌─────────┐┌──────────┐              │
│ │HomePage│ │ModelPage││ModelsPage│              │
│ └────────┘ └─────────┘└──────────┘              │
└───────────────┬──────────────────┬─────────┬────┘
                │                  │         │     
 organisms      │                  │         │     
┌───────────────▼──────────────┐   │         │     
│ ┌─────────┐ ┌───────────┐┌─┐ │   │         │     
│ │ ApiView │ │UserProfile││ │ │   │         │     
│ └─────────┘ └───────────┘└─┘ │   │         │     
└──────────────────────────────┘   │         │     
                                   │         X  NO   
 molecules                         │         │     
┌──────────────────────────────────▼─────┐   │     
│┌────────────┐┌────────────┐┌───────┐┌─┐│   │     
││ItemGridView││ItemListView││APIList││ ││   │     
│└────────────┘└────────────┘└───────┘└─┘│   │     
└────────────────────────────────────────┘   │     
                                             │     
 atoms                                       │     
┌────────────────────────────────────────────▼────┐
│ ┌───┐┌─────────┐┌─────┐┌──────┐┌────────────┐┌─┐│
│ │Btn││TextInput││Image││Avatar││DropdownMenu││ ││
│ └───┘└─────────┘└─────┘└──────┘└────────────┘└─┘│
└─────────────────────────────────────────────────┘
```
> The **[Project Structure](./project-structure.md)** document shows where these different component types are physically located in the codebase.

---

## Styling Components

All components, regardless of their layer, must adhere to the platform's styling rules to ensure a consistent user experience. This means consuming themed variables from a global stylesheet instead of hardcoding style values.

> For a full explanation and list of available variables, see the **[Styling Architecture](./style.md)** document.
