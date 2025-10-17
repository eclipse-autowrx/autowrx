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

## 3. Asynchronous Loading for Performance

To keep the platform lean and ensure fast initial load times, components should be loaded on demand using `React.lazy()`. The registry pattern makes this easy to implement.

### Registering a Lazy-Loaded Component

Instead of registering the component directly, you register a dynamic `import()`.

```jsx
// src/components/registerComponents.js
import React from 'react';
import { ComponentRegistry } from '../lib/ComponentRegistry';

// Assume the schema is exported from the component file as well
import { schema as BannerSchema } from './Banner'; 

// Registering a lazy-loaded component
ComponentRegistry.register(
  'banner01', 
  React.lazy(() => import('./Banner')),
  BannerSchema
);

// ... register other components
```

The `renderComponentByTypeName` function shown earlier is already equipped with a `<Suspense>` boundary to handle these lazy-loaded components without any changes.

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

// Schemas are imported to be included in the registry
import { schema as BannerSchema } from './Banner'; 
import { schema as PopularPrototypeSchema } from './PopularPrototype'; 
import { schema as MyPrototypeSchema } from './MyPrototype'; 

// Registering the components used in the config
ComponentRegistry.register('banner01', React.lazy(() => import('./Banner')), BannerSchema);
ComponentRegistry.register('popular-prototype', React.lazy(() => import('./PopularPrototype')), PopularPrototypeSchema);
ComponentRegistry.register('my-prototype', React.lazy(() => import('./MyPrototype')), MyPrototypeSchema);
```

### 3. The Page & Renderer in Action

Finally, the `HomePage` component itself is quite simple. It takes the configuration object as a prop, iterates over it, and uses the global `renderComponentByTypeName` utility to do the heavy lifting.

```tsx
// src/pages/HomePage.js
import { renderComponentByTypeName } from '../lib/renderComponentByTypeName';

const HomePage = ({ config }) => {
  return (
    <main>
      {config?.rows?.map((row, index) => (
        <section key={index}>
          {renderComponentByTypeName(row.type, row.option, row.data)}
        </section>
      ))}
    </main>
  );
};

export default HomePage;
```

The renderer then finds the appropriate component in the registry, handles the lazy loading with a Suspense fallback, and renders it with the specified `option` and `data`.

---

## Benefits of this Architecture

### Lean and Extensible Core

The core application remains small. New functionality is added by creating new components, which can be loaded on demand.

### AI-Powered Layout Generation

This architecture is ideal for AI. By providing an AI with the **schemas** of all available components, it can reliably generate valid and complex JSON layouts from a simple natural language prompt. The structured schema is much more effective than just providing code examples.

### A True Plugin Ecosystem

This system is the foundation for a powerful plugin architecture. A third-party developer can create a new component, package it as an `npm` module, and provide a single initialization file that calls `ComponentRegistry.register()`. Once the user's platform installs the package and calls the registration function, the new component is immediately available for use in all layouts.


