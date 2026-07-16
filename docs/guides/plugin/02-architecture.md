# Plugin Architecture

This document explains how the plugin system works internally, helping you understand the mechanics behind plugin loading and execution.

## Overview

The digital.auto plugin system is a **micro-frontend architecture** that allows dynamically loading and executing React components from external sources at runtime.

```
┌─────────────────────────────────────────────────┐
│           digital.auto Host App                │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │      PluginPageRender Component           │ │
│  │                                           │ │
│  │  1. Fetches plugin metadata              │ │
│  │  2. Injects <script> tag                 │ │
│  │  3. Waits for global registration        │ │
│  │  4. Renders plugin component             │ │
│  │  5. Provides API callbacks               │ │
│  └───────────────────────────────────────────┘ │
│                      │                          │
│                      ▼                          │
│  ┌───────────────────────────────────────────┐ │
│  │         Plugin API Interface              │ │
│  │  - updateModel / updatePrototype          │ │
│  │  - getComputedAPIs / getApiDetail         │ │
│  │  - setRuntimeApiValues                    │ │
│  │  - Wishlist API CRUD                      │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                       │
                       │ HTTP Request
                       ▼
┌─────────────────────────────────────────────────┐
│         External Plugin (your-plugin.js)        │
│                                                 │
│  window.DAPlugins['page-plugin'] = {           │
│    components: {                                │
│      Page: YourReactComponent                  │
│    }                                            │
│  }                                              │
└─────────────────────────────────────────────────┘
```

## Component Hierarchy

### 1. PluginPageRender (Host)

**Location**: `frontend/src/components/organisms/PluginPageRender.tsx`

This is the main component responsible for loading and rendering plugins.

**Responsibilities**:
- Fetch plugin metadata (URL, name, etc.)
- Dynamically inject plugin script into the DOM
- Wait for plugin registration on global scope
- Create and provide Plugin API interface
- Handle loading states and errors
- Render the plugin component

**Key Code Flow**:

```typescript
const PluginPageRender: React.FC<PluginPageRenderProps> = ({ plugin_id, data }) => {
  // 1. Extract context
  const model_id = data?.model?.id
  const prototype_id = data?.prototype?.id

  // 2. Create API callbacks
  const pluginAPI: PluginAPI = {
    updateModel: model_id ? handleUpdateModel : undefined,
    updatePrototype: prototype_id ? handleUpdatePrototype : undefined,
    getComputedAPIs: model_id ? handleGetComputedAPIs : undefined,
    // ... 13 methods total
  }

  // 3. Load plugin dynamically
  useEffect(() => {
    // Fetch metadata, inject script, wait for registration
    loadPlugin()
  }, [plugin_id])

  // 4. Render plugin
  return <PluginComponent data={data} config={config} api={pluginAPI} />
}
```

### 2. Plugin Component (External)

**Your Code**: `src/components/Page.tsx`

This is the React component you write that gets loaded and executed.

**Props Received**:
```typescript
interface PageProps {
  data?: {
    model?: Model;
    prototype?: Prototype;
    // ... any other contextual data
  };
  config?: {
    plugin_id?: string;
    // ... plugin configuration
  };
  api?: PluginAPI;  // Methods to interact with host
}
```

## Plugin Loading Mechanism

### Step-by-Step Process

#### 1. Plugin Registration in Database

First, a plugin must be registered in the system with:
- **Name**: Human-readable name
- **Slug**: Unique identifier (e.g., `my-plugin`)
- **URL**: Public URL to the compiled plugin bundle

#### 2. Component Requests Plugin

When a page needs to render a plugin:

```typescript
<PluginPageRender
  plugin_id="my-plugin"
  data={{ model, prototype }}
/>
```

#### 3. Metadata Fetch

PluginPageRender fetches plugin metadata:

```typescript
const pluginMeta = await getPluginBySlug(plugin_id)
// Returns: { id, name, slug, url: "https://cdn.example.com/plugin.js" }
```

#### 4. Global Dependencies Setup

The host ensures React and ReactDOM are available globally:

```typescript
if (!(window as any).React) {
  const ReactMod = await import('react')
  (window as any).React = ReactMod.default || ReactMod
}

if (!(window as any).ReactDOM) {
  const ReactDOMClient = await import('react-dom/client')
  (window as any).ReactDOM = ReactDOMClient
}
```

#### 5. Script Injection

The plugin script is injected into the DOM:

```typescript
const script = document.createElement('script')
script.src = pluginMeta.url
script.async = true
script.crossOrigin = 'anonymous'
document.body.appendChild(script)
```

#### 6. Plugin Registration Detection

The host waits for the plugin to register itself:

```typescript
// Plugin must do this:
window.DAPlugins = window.DAPlugins || {};
window.DAPlugins['page-plugin'] = {
  components: {
    Page: MyComponent
  }
};
```

Host polls for registration:

```typescript
const maxAttempts = 50  // 5 seconds
while (attempts < maxAttempts) {
  const obj = window.DAPlugins?.['page-plugin']
  if (obj) return obj
  await sleep(100)
  attempts++
}
```

#### 7. Component Rendering

Once registered, the component is rendered:

```typescript
const PluginComponent = window.DAPlugins['page-plugin'].components.Page

return (
  <PluginComponent
    data={data}
    config={{ plugin_id }}
    api={pluginAPI}
  />
)
```

## Plugin API Architecture

### API Method Categories

The Plugin API is organized into 4 categories:

#### 1. Model & Prototype Updates (2 methods)
- `updateModel(updates)` - Update model data
- `updatePrototype(updates)` - Update prototype data

#### 2. Vehicle API Operations - Read (4 methods)
- `getComputedAPIs(model_id?)` - Get all vehicle APIs
- `getApiDetail(api_name, model_id?)` - Get specific API details
- `listVSSVersions()` - List VSS versions
- `getRuntimeApiValues()` - Get current runtime values

#### 3. Vehicle API Operations - Write (2 methods)
- `replaceAPIs(api_data_url, model_id?)` - Replace all APIs
- `setRuntimeApiValues(values)` - Set runtime values

#### 4. Wishlist API Operations (5 methods)
- `createWishlistApi(data)` - Create custom signal
- `updateWishlistApi(id, data)` - Update custom signal
- `deleteWishlistApi(id)` - Delete custom signal
- `getWishlistApi(name, model_id?)` - Get custom signal
- `listWishlistApis(model_id?)` - List custom signals

### Conditional API Availability

API methods are **conditionally available** based on context:

```typescript
const pluginAPI: PluginAPI = {
  // Only available if model_id exists in data
  updateModel: model_id ? handleUpdateModel : undefined,

  // Only available if prototype_id exists in data
  updatePrototype: prototype_id ? handleUpdatePrototype : undefined,

  // Always available
  listVSSVersions: handleListVSSVersions,
}
```

This ensures plugins can't call APIs that wouldn't work in the current context.

### Error Handling Pattern

All API methods follow this pattern:

```typescript
const handleUpdateModel = async (updates: Partial<Model>): Promise<Model> => {
  // 1. Validate context
  if (!model_id) {
    const errorMsg = 'Cannot update model: model_id not available'
    toast.error(errorMsg)
    throw new Error(errorMsg)
  }

  try {
    // 2. Call service
    const result = await updateModelService(model_id, updates)

    // 3. Show success feedback
    toast.success('Model updated successfully')

    // 4. Return result
    return result
  } catch (err: any) {
    // 5. Handle errors
    const errorMsg = err?.message || 'Failed to update model'
    toast.error(errorMsg)
    throw err
  }
}
```

This provides:
- ✅ Context validation
- ✅ Automatic toast notifications
- ✅ Error propagation to plugin
- ✅ Consistent UX

## Data Flow

### From Host to Plugin

```typescript
// Host provides data via props
<PluginComponent
  data={{
    model: { id, name, apis, ... },
    prototype: { id, name, code, ... }
  }}
  config={{ plugin_id: 'my-plugin' }}
  api={pluginAPI}
/>
```

### From Plugin to Host

```typescript
// Plugin calls API methods
await api.updatePrototype({
  name: 'New Name',
  extend: { customData: { ... } }
})

// Host receives request, validates, executes, returns result
```

### Runtime State Integration

Plugins can interact with runtime state:

```typescript
// Set runtime API values (e.g., for simulation)
api.setRuntimeApiValues({
  'Vehicle.Speed': 65.5,
  'Vehicle.CurrentLocation.Latitude': 37.7749
})

// Get current runtime values
const values = api.getRuntimeApiValues()
console.log(values['Vehicle.Speed'])  // 65.5
```

This integrates with the Zustand runtime store:

```typescript
// In PluginPageRender
const { apisValue, setActiveApis } = useRuntimeStore()

const handleSetRuntimeApiValues = (values: Record<string, any>) => {
  setActiveApis(values)  // Updates Zustand store
  toast.success('Runtime API values updated')
}
```

## Security Considerations

### Sandboxing

Currently, plugins run in the **same origin** as the host application. This means:

- ✅ Fast execution (no iframe overhead)
- ✅ Direct access to shared React instance
- ❌ No sandboxing (plugins can access window, document, etc.)

**Future consideration**: Implement iframe-based sandboxing for untrusted plugins.

### API Surface Limitation

The Plugin API is **intentionally limited** to prevent:

- ❌ Direct store access
- ❌ Route manipulation
- ❌ Arbitrary HTTP requests from host origin
- ❌ Access to authentication tokens
- ❌ File system access

Only essential operations are exposed.

### CORS & Content Security

Plugins must be hosted with proper CORS headers:

```
Access-Control-Allow-Origin: *
Content-Type: application/javascript
```

The host loads plugins with `crossOrigin="anonymous"` to prevent credential leakage.

## Plugin Lifecycle

```
┌─────────────────┐
│   Mount         │
│  - Fetch meta   │
│  - Inject script│
│  - Wait for reg │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Active        │
│  - Render       │
│  - Handle events│
│  - API calls    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Unmount       │
│  - Cleanup      │
│  - Remove refs  │
└─────────────────┘
```

### Mount Phase

1. Component mounts with `plugin_id`
2. Metadata fetched from backend
3. Script injected into DOM
4. Host waits for global registration
5. Component extracted from `window.DAPlugins['page-plugin']`
6. Component rendered with props

### Active Phase

- Plugin receives props updates (data, config, api)
- Plugin can call API methods
- Plugin manages its own internal state
- Host provides toast notifications for API operations

### Unmount Phase

1. Component unmounts
2. Cleanup function called
3. Plugin-specific cleanup (if `unmount` function provided)
4. References cleared

### Hot Reload / Plugin ID Change

When `plugin_id` changes:

```typescript
useEffect(() => {
  // Cancel in-flight requests
  cancelled = true

  // Cleanup previous plugin
  window.DAPlugins?.['page-plugin']?.unmount?.(containerRef.current)

  // Load new plugin
  loadPlugin()

  return () => {
    cancelled = true
    // Cleanup on unmount
  }
}, [plugin_id])  // Re-run when plugin_id changes
```

## Type Safety

The plugin system is fully typed:

```typescript
// Host-side types
import type { PluginAPI } from '@/types/plugin.types'
import type { Model, Prototype } from '@/types/model.type'
import type { VehicleAPI, ExtendedApi } from '@/types/api.type'

// Plugin-side types (copy or import)
type PluginAPI = {
  updateModel?: (updates: any) => Promise<any>;
  // ...
}
```

Plugins should copy the type definitions or reference the host types if using TypeScript.

## Alternative Loading Patterns

### Mount/Unmount Pattern

Instead of exporting a React component, plugins can export imperative mount/unmount functions:

```typescript
window.DAPlugins['page-plugin'] = {
  mount: (container: HTMLElement, props: PluginPageProps) => {
    // Custom rendering logic
    container.innerHTML = `<div>Hello ${props.data?.model?.name}</div>`
  },
  unmount: (container: HTMLElement | null) => {
    // Cleanup
    if (container) container.innerHTML = ''
  }
}
```

The host automatically wraps this in a React component:

```typescript
if (pluginObj?.mount) {
  const Wrapper: React.FC<any> = (props) => {
    const ref = React.useRef<HTMLDivElement | null>(null)
    React.useEffect(() => {
      if (ref.current) {
        pluginObj.mount(ref.current, props)
      }
      return () => {
        pluginObj.unmount?.(ref.current)
      }
    }, [props])
    return <div ref={ref} />
  }
  component = Wrapper
}
```

## Performance Considerations

### Caching

- Plugin scripts are cached by the browser
- Use cache-busting query params for development: `?_=${Date.now()}`
- Production builds should have stable URLs

### Bundle Size

Keep plugin bundles small:
- ✅ Externalize React, ReactDOM (provided by host)
- ✅ Tree-shake unused code
- ✅ Code-split if plugin has multiple views
- ❌ Don't bundle large libraries unnecessarily

### Loading States

The host provides loading UI while plugin loads:

```typescript
{loading && (
  <div>
    <Spinner size={32} />
    <p>Loading plugin...</p>
  </div>
)}
```

Plugins should handle their own internal loading states for async operations.

## Next Steps

- 📚 See [API Reference](./04-api-reference.md) for complete API documentation
- 🛠️ Read [Creating Your First Plugin](./03-creating-plugin.md) for a hands-on tutorial
- 🚀 Check [Advanced Topics](./05-advanced.md) for patterns and best practices
