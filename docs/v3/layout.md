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

> For a deep dive into the technical implementation, see the **[Dynamic Components Architecture](./component-design/dynamic-components.md)**.

### Row-Based Layout Example (`HomePage`)

A common pattern is a row-based layout, where the page configuration is a simple array of components to be rendered vertically. This is how pages like `HomePage` or `UserProfilePage` are built.

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

### Tab-Based Layout Example (`ModelPage`)

More complex pages, like the `ModelPage` or `PrototypePage`, can use dynamic components to render different content panes within a tabbed interface.

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

The platform uses a global state management solution accessible by all components. However, a clear distinction is made between `BuiltInComponent` (part of the core platform) and `ExtensionComponent` (provided by plugins). This reflects our **[Core vs. Plugin Philosophy](./core-vs-plugin.md)**.

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                         GlobalState                      │
│                                                          │
└────────────▲─────────────▲────────────────────▲──────────┘
             │             │                    │           
             │             │                    │           
   ┌─────────▼────────┐    │          ┌─────────▼──────────┐
   │ BuildInComponent │    │          │ ExtensionComponent │
   └───────────────┬──┘    │          └────────────────────┘
                   │       │                                
                   │       │                                
                 ┌─┴───────▼──────┐                         
                 │ ChildComponent │                         
                 └────────────────┘                         
```

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
