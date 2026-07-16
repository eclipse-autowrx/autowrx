# Dynamic Components Architecture

In Autowrx, the UI is not hardcoded but is instead dynamically rendered based on configuration objects. This powerful approach, which we refer to as "Dynamic Components," allows for creating flexible and easily customizable layouts without needing to change the underlying application code.

This architecture is built on three core principles:

1.  **A Central Component Registry:** A single source of truth for all available components, preventing monolithic rendering logic.
2.  **A Standardized Component API & Schema:** A clear contract that all dynamic components must follow, ensuring consistency and enabling validation.
3.  **Asynchronous (Lazy) Loading:** A performance-first approach where component code is only loaded when needed.

---

## 1. The Component Registry

To avoid a monolithic `switch` statement for rendering, we use a **Registry Pattern**. This is a central object that holds a reference to every dynamic component available in the application.

### Example Registry

```javascript
// src/lib/ComponentRegistry.js

export const ComponentRegistry = {
  components: new Map(),

  register(typeName, component, schema) {
    if (this.components.has(typeName)) {
      console.warn(`Component type "${typeName}" is already registered. Overwriting.`);
    }
    this.components.set(typeName, { component, schema });
  },

  get(typeName) {
    return this.components.get(typeName);
  }
};
```

### The Dynamic Renderer

The central rendering function, `renderComponentByTypeName`, now becomes very simple. It just looks up the component in the registry and renders it.

```jsx
// src/lib/renderComponentByTypeName.js
import { ComponentRegistry } from './ComponentRegistry';
import React, { Suspense } from 'react';

function renderComponentByTypeName(type, option, data) {
  const registration = ComponentRegistry.get(type);

  if (!registration) {
    // Return a placeholder or null for unknown component types
    return `Component of type "${type}" not found.`;
  }

  const Component = registration.component;
  
  // The Suspense wrapper is for async components, explained later
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component option={option} data={data} />
    </Suspense>
  );
}
```

---

## 2. Dynamic Component API & Schema

For a component to be compatible with the dynamic system, it must adhere to a strict contract.

### The Component API (`option` & `data`)

Every dynamic component must be designed to accept two properties:

-   **`option`**: An object containing configuration and styling parameters that control the component's appearance and behavior (e.g., background color, size, layout direction).
-   **`data`**: An object containing the actual content to be displayed (e.g., text, images, or a list of items).

### The Component Schema

To ensure configurations are valid and to enable better tooling, each component must also define a **schema** for its `option` and `data` props. This schema can be used for validation, auto-generating forms, or providing context to an AI.

### Example of a Complete Dynamic Component

Here is a template showing a component, its schema, and its registration.

```jsx
// src/components/MyDynamicComponent.js
import React from 'react';
import { ComponentRegistry } from '../lib/ComponentRegistry';

// The schema defines the expected shape of props
const schema = {
  option: {
    backgroundColor: { type: 'string', required: false },
    size: { type: 'enum', values: ['small', 'large'], required: true }
  },
  data: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: false }
  }
};

// The component itself, adhering to the API
const MyDynamicComponent = ({ option, data }) => {
  const style = {
    backgroundColor: option?.backgroundColor || 'transparent',
    fontSize: option?.size === 'large' ? '24px' : '16px',
  };

  return (
    <div style={style}>
      <h1>{data?.title}</h1>
      <p>{data?.description}</p>
    </div>
  );
};

// Register the component with the central registry
ComponentRegistry.register('my-dynamic-component', MyDynamicComponent, schema);

export default MyDynamicComponent;
```

---

## 3. Component Loading Strategies: Eager vs. Lazy

To balance performance with user experience, our architecture supports two component loading strategies: eager loading for core components and lazy loading for plugins or less frequently used components.

### Eager Loading (for Core Feature Components)

For essential components that appear "above the fold" or are critical to the initial user experience on many pages (e.g., a page `Banner` or `UserProfileHeader`), it's best to load them eagerly. This means their code is included in the main application bundle. While this slightly increases the initial bundle size, it ensures these critical components render instantly without any loading delay.

This strategy should be reserved for components that are truly part of the core experience. Small, reusable components like `Button` or `Card` are typically not managed by this dynamic system; they are imported and used directly in code. The dynamic component architecture is best suited for larger, feature-level blocks.

**Registering an Eager-Loaded Component:**

You simply import the component and register it directly.

```jsx
// src/components/registerCoreComponents.js
import { ComponentRegistry } from '../lib/ComponentRegistry';

import { MainBanner, schema as MainBannerSchema } from './MainBanner';
import { UserProfileHeader, schema as UserProfileHeaderSchema } from './UserProfileHeader';

// Registering core components directly
ComponentRegistry.register('core-main-banner', MainBanner, MainBannerSchema);
ComponentRegistry.register('core-user-profile-header', UserProfileHeader, UserProfileHeaderSchema);
```

### Lazy Loading (for External/Plugin Components)

To keep the core platform lean and support a plugin ecosystem, external or non-essential components should be loaded on demand using `React.lazy()`. Their code is split into a separate chunk and is only downloaded by the browser when the component is first needed.

This is the ideal approach for:
- Components from third-party plugins.
- Heavy components that are not used on every page (e.g., a complex chart or map).
- A large number of components where loading them all upfront would be slow.

**Registering a Lazy-Loaded Component:**

Instead of registering the component directly, you register a dynamic `import()`.

```jsx
// src/plugins/MyChartPlugin/register.js
import React from 'react';
import { ComponentRegistry } from '../../lib/ComponentRegistry';

// The schema is imported statically for immediate availability
import { schema as MyChartSchema } from './MyChart'; 

// Registering a lazy-loaded plugin component
ComponentRegistry.register(
  'my-chart', 
  React.lazy(() => import('./MyChart')),
  MyChartSchema
);
```

The `renderComponentByTypeName` function is already equipped with a `<Suspense>` boundary, so it handles both eager and lazy components seamlessly.

---

## Putting It All Together: The `HomePage` Example

Let's see how these principles apply to a real-world case like the `HomePage`.

### 1. The Page Configuration

First, an administrator or an AI defines the layout of the page using a simple JSON object. This object refers to components by their registered `type` name.

```js
// The config for a specific HomePage instance
const homePageConfig = {
  rows: [
    {
      type: 'banner01',
      option: {
        bg_image: 'url',
        title: 'Welcome to Autowrx',
        detail: 'Your platform for innovation.',
      },
    },
    {
      type: 'popular-prototype',
      option: { size: 'large' }
    },
    {
      type: 'my-prototype',
    },
  ],
};
```

### 2. Component Registration

Elsewhere, in the application's setup code, the components referenced in the config (`banner01`, `popular-prototype`, etc.) have been registered. They are registered as lazy-loaded modules to keep the initial page load fast.

```jsx
// src/components/registerComponents.js
import React from 'react';
import { ComponentRegistry } from '../lib/ComponentRegistry';

// Schemas are imported for all components
import Banner, { schema as BannerSchema } from './Banner'; // Direct import for eager loading
import { schema as PopularPrototypeSchema } from './PopularPrototype'; 
import { schema as MyPrototypeSchema } from './MyPrototype'; 

// == Register Core/Above-the-Fold Components (Eager) ==
// The main banner is critical for the homepage, so we load it eagerly for instant rendering.
ComponentRegistry.register('banner01', Banner, BannerSchema);

// == Register Other Page Components (Lazy) ==
// These components are further down the page, so we can lazy-load them for better performance.
ComponentRegistry.register('popular-prototype', React.lazy(() => import('./PopularPrototype')), PopularPrototypeSchema);
ComponentRegistry.register('my-prototype', React.lazy(() => import('./MyPrototype')), MyPrototypeSchema);
```