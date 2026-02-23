# Plugin API Reference

Complete reference documentation for all Plugin API methods available to plugins.

## Table of Contents

- [API Overview](#api-overview)
- [Model & Prototype Updates](#model--prototype-updates)
- [Vehicle API Operations (Read)](#vehicle-api-operations-read)
- [Vehicle API Operations (Write)](#vehicle-api-operations-write)
- [Navigation](#navigation)
- [Wishlist API Operations](#wishlist-api-operations)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)

---

## API Overview

The Plugin API provides **13 methods** across 4 categories:

```typescript
interface PluginAPI {
  // Model & Prototype (2 methods)
  updateModel?: (updates: Partial<Model>) => Promise<Model>
  updatePrototype?: (updates: Partial<Prototype>) => Promise<Prototype>

  // Vehicle APIs - Read (4 methods)
  getComputedAPIs?: (model_id?: string) => Promise<CVI>
  getApiDetail?: (api_name: string, model_id?: string) => Promise<VehicleAPI>
  listVSSVersions?: () => Promise<string[]>
  getRuntimeApiValues?: () => Record<string, any>

  // Vehicle APIs - Write (2 methods)
  replaceAPIs?: (api_data_url: string, model_id?: string) => Promise<void>
  setRuntimeApiValues?: (values: Record<string, any>) => void

  // Navigation (1 method)
  setActiveTab?: (tab: string, pluginSlug?: string) => void

  // Wishlist APIs (5 methods)
  createWishlistApi?: (data: ExtendedApiCreate) => Promise<ExtendedApiRet>
  updateWishlistApi?: (id: string, data: Partial<ExtendedApiCreate>) => Promise<Partial<ExtendedApiCreate>>
  deleteWishlistApi?: (id: string) => Promise<void>
  getWishlistApi?: (name: string, model_id?: string) => Promise<ExtendedApi>
  listWishlistApis?: (model_id?: string) => Promise<List<ExtendedApi>>
}
```

**Note**: All methods are **optional** (marked with `?`). Check if a method exists before calling:

```typescript
if (api?.updateModel) {
  await api.updateModel({ name: 'New Name' })
}
```

---

## Model & Prototype Updates

### updateModel

Update the current model's data.

**Signature**:
```typescript
updateModel?: (updates: Partial<Model>) => Promise<Model>
```

**Parameters**:
- `updates` - Partial model object with fields to update

**Returns**: Promise resolving to the updated model object

**Throws**: Error if `model_id` is not available in context

**Example**:
```typescript
// Update model name
await api.updateModel({
  name: 'Tesla Model 3 (Updated)'
})

// Save custom data to extend field
await api.updateModel({
  extend: {
    ...data?.model?.extend,
    myPluginData: {
      lastModified: new Date().toISOString(),
      settings: {
        theme: 'dark',
        notifications: true
      }
    }
  }
})

// Update multiple fields
await api.updateModel({
  name: 'New Model Name',
  description: 'Updated description',
  extend: {
    customField: 'value'
  }
})
```

**Common Use Cases**:
- Save plugin configuration/state
- Update model metadata
- Store computed results

**Best Practices**:
- Use the `extend` field for custom data
- Preserve existing extend data with spread operator: `...data?.model?.extend`
- Handle errors gracefully

---

### updatePrototype

Update the current prototype's data.

**Signature**:
```typescript
updatePrototype?: (updates: Partial<Prototype>) => Promise<Prototype>
```

**Parameters**:
- `updates` - Partial prototype object with fields to update

**Returns**: Promise resolving to the updated prototype object

**Throws**: Error if `prototype_id` is not available in context

**Example**:
```typescript
// Update prototype name
await api.updatePrototype({
  name: 'Speed Monitor v2'
})

// Save custom data to extend field
await api.updatePrototype({
  extend: {
    ...data?.prototype?.extend,
    pluginState: {
      lastRun: new Date().toISOString(),
      executionCount: 42
    }
  }
})

// Update code and metadata
await api.updatePrototype({
  name: 'Updated Prototype',
  description: 'New description',
  extend: {
    version: '2.0.0'
  }
})
```

**Common Use Cases**:
- Update prototype name/description
- Save execution state
- Store plugin-specific metadata

**Best Practices**:
- Use the `extend` field for custom data
- Preserve existing extend data
- Update only necessary fields

---

## Vehicle API Operations (Read)

### getComputedAPIs

Get all computed vehicle APIs for a model. Returns the complete VSS API tree.

**Signature**:
```typescript
getComputedAPIs?: (model_id?: string) => Promise<CVI>
```

**Parameters**:
- `model_id` (optional) - Model ID to get APIs for. Defaults to current model.

**Returns**: Promise resolving to the computed vehicle API tree (CVI = Computed Vehicle Interface)

**Throws**: Error if no `model_id` is available

**Example**:
```typescript
// Get APIs for current model
const apis = await api.getComputedAPIs()

// Access specific API
console.log(apis['Vehicle.Speed'])
// {
//   name: 'Speed',
//   datatype: 'float',
//   type: 'sensor',
//   unit: 'km/h',
//   description: 'Vehicle speed',
//   ...
// }

// List all API paths
const apiPaths = Object.keys(apis)
console.log(`Found ${apiPaths.length} APIs`)

// Get APIs for a different model
const otherApis = await api.getComputedAPIs('other-model-id')
```

**Common Use Cases**:
- Display available vehicle signals
- Build API selector UI
- Validate API paths
- Generate documentation

**CVI Structure**:
```typescript
type CVI = {
  [apiPath: string]: VehicleAPI
}

// Example:
{
  'Vehicle.Speed': { name: 'Speed', datatype: 'float', ... },
  'Vehicle.CurrentLocation.Latitude': { ... },
  'Vehicle.CurrentLocation.Longitude': { ... },
  // ... hundreds more
}
```

---

### getApiDetail

Get detailed information for a specific vehicle API.

**Signature**:
```typescript
getApiDetail?: (api_name: string, model_id?: string) => Promise<VehicleAPI>
```

**Parameters**:
- `api_name` - Full API path (e.g., 'Vehicle.Speed')
- `model_id` (optional) - Model ID. Defaults to current model.

**Returns**: Promise resolving to the vehicle API details

**Throws**: Error if `model_id` is not available or API not found

**Example**:
```typescript
// Get speed API details
const speedAPI = await api.getApiDetail('Vehicle.Speed')
console.log(speedAPI)
// {
//   name: 'Speed',
//   datatype: 'float',
//   type: 'sensor',
//   unit: 'km/h',
//   min: 0,
//   max: 250,
//   description: 'Vehicle speed',
//   ...
// }

// Access specific fields
console.log(`Unit: ${speedAPI.unit}`)
console.log(`Type: ${speedAPI.datatype}`)
console.log(`Range: ${speedAPI.min} - ${speedAPI.max}`)

// Get API from different model
const api = await api.getApiDetail('Vehicle.Speed', 'model-123')
```

**Common Use Cases**:
- Display API metadata
- Validate data types
- Show units and ranges
- Build API documentation

**VehicleAPI Fields**:
```typescript
interface VehicleAPI {
  name: string           // Signal name
  datatype: string       // Data type (float, int, string, boolean, etc.)
  type: string          // Type (sensor, actuator, attribute)
  unit?: string         // Unit of measurement
  min?: number          // Minimum value
  max?: number          // Maximum value
  description?: string  // Description
  comment?: string      // Additional comments
  // ... other VSS fields
}
```

---

### listVSSVersions

List all available VSS (Vehicle Signal Specification) versions.

**Signature**:
```typescript
listVSSVersions?: () => Promise<string[]>
```

**Parameters**: None

**Returns**: Promise resolving to array of VSS version strings

**Example**:
```typescript
const versions = await api.listVSSVersions()
console.log(versions)
// ['4.0', '3.1.1', '3.0', '2.2', ...]

// Display in UI
versions.forEach(version => {
  console.log(`VSS ${version}`)
})

// Check if specific version available
if (versions.includes('4.0')) {
  console.log('VSS 4.0 is available')
}
```

**Common Use Cases**:
- Display available VSS versions
- Allow users to select VSS version
- Show version information

---

### getRuntimeApiValues

Get current runtime API values (values set during prototype execution or simulation).

**Signature**:
```typescript
getRuntimeApiValues?: () => Record<string, any>
```

**Parameters**: None

**Returns**: Object mapping API paths to their current runtime values

**Example**:
```typescript
const values = api.getRuntimeApiValues()
console.log(values)
// {
//   'Vehicle.Speed': 65.5,
//   'Vehicle.CurrentLocation.Latitude': 37.7749,
//   'Vehicle.CurrentLocation.Longitude': -122.4194,
//   ...
// }

// Get specific value
const speed = values['Vehicle.Speed']
console.log(`Current speed: ${speed} km/h`)

// Check if value exists
if ('Vehicle.Speed' in values) {
  console.log('Speed value is available')
}

// List all available values
Object.entries(values).forEach(([path, value]) => {
  console.log(`${path}: ${value}`)
})
```

**Common Use Cases**:
- Display current vehicle state
- Monitor runtime values
- Build dashboards
- Visualize data

**Note**: These are runtime values, not persisted values. They reset when the runtime restarts.

---

## Vehicle API Operations (Write)

### replaceAPIs

Replace all vehicle APIs for a model with a new VSS specification.

**Signature**:
```typescript
replaceAPIs?: (api_data_url: string, model_id?: string) => Promise<void>
```

**Parameters**:
- `api_data_url` - URL to the VSS specification JSON file
- `model_id` (optional) - Model ID. Defaults to current model.

**Returns**: Promise resolving when APIs are replaced

**Throws**: Error if `model_id` is not available or replacement fails

**Example**:
```typescript
// Replace with VSS 4.0
await api.replaceAPIs('https://cdn.example.com/vss-4.0.json')

// Replace for specific model
await api.replaceAPIs(
  'https://cdn.example.com/vss-4.0.json',
  'model-123'
)

// Use with user input
const handleReplaceAPIs = async () => {
  const url = prompt('Enter VSS specification URL:')
  if (!url) return

  try {
    await api.replaceAPIs(url)
    alert('APIs replaced successfully!')
  } catch (error) {
    console.error('Failed to replace APIs:', error)
  }
}
```

**Common Use Cases**:
- Update to new VSS version
- Load custom API specification
- Reset APIs to standard specification

**⚠️ Warning**: This operation replaces **ALL** APIs for the model. Use with caution.

---

### setRuntimeApiValues

Set runtime API values for testing/simulation.

**Signature**:
```typescript
setRuntimeApiValues?: (values: Record<string, any>) => void
```

**Parameters**:
- `values` - Object mapping API paths to values

**Returns**: void (synchronous operation)

**Example**:
```typescript
// Set single value
api.setRuntimeApiValues({
  'Vehicle.Speed': 65.5
})

// Set multiple values
api.setRuntimeApiValues({
  'Vehicle.Speed': 65.5,
  'Vehicle.CurrentLocation.Latitude': 37.7749,
  'Vehicle.CurrentLocation.Longitude': -122.4194,
  'Vehicle.IsBrakeEngaged': false
})

// Simulate scenario
const simulateDriving = () => {
  api.setRuntimeApiValues({
    'Vehicle.Speed': Math.random() * 120,
    'Vehicle.EngineRPM': Math.random() * 6000,
    'Vehicle.FuelLevel': 75.5
  })
}

// Update values over time
setInterval(() => {
  api.setRuntimeApiValues({
    'Vehicle.Speed': Math.random() * 100
  })
}, 1000)
```

**Common Use Cases**:
- Testing prototypes
- Simulating vehicle behavior
- Creating demo scenarios
- Setting initial values

**Note**: Values are stored in the runtime store and available to all components. They persist until the runtime is reset or page is refreshed.

---

## Navigation

### setActiveTab

Navigate to a specific prototype tab. Useful for sidebar plugins that need to switch the main content area to a different tab.

**Signature**:
```typescript
setActiveTab?: (tab: string, pluginSlug?: string) => void
```

**Parameters**:
- `tab` - The tab key to navigate to. Built-in tabs: `'view'`, `'journey'`, `'code'`, `'dashboard'`, `'staging'`. Use `'plug'` for custom plugin tabs.
- `pluginSlug` (optional) - Required when `tab` is `'plug'`. The slug of the plugin tab to activate.

**Example**:
```typescript
// Navigate to the Code tab
api.setActiveTab?.('code')

// Navigate to the Dashboard tab
api.setActiveTab?.('dashboard')

// Navigate to a custom plugin tab
api.setActiveTab?.('plug', 'my-analytics-plugin')

// Navigate to Overview
api.setActiveTab?.('view')

// Example: sidebar plugin with navigation buttons
const SidebarPlugin = ({ api }) => {
  return (
    <div>
      <h3>Quick Navigation</h3>
      <button onClick={() => api.setActiveTab?.('code')}>
        Open Code Editor
      </button>
      <button onClick={() => api.setActiveTab?.('dashboard')}>
        Open Dashboard
      </button>
      <button onClick={() => api.setActiveTab?.('plug', 'test-runner')}>
        Open Test Runner
      </button>
    </div>
  )
}
```

**Built-in Tab Keys**:
| Tab Key | Description |
|---------|-------------|
| `view` | Overview / Info tab (default) |
| `journey` | Customer Journey tab |
| `code` | SDV Code editor tab |
| `dashboard` | Dashboard tab |
| `staging` | Staging tab |
| `plug` | Custom plugin tab (requires `pluginSlug`) |

**Common Use Cases**:
- Sidebar plugins that control the main content area
- Navigation menus within plugins
- Workflow plugins that guide users through different tabs
- Plugins that need to switch context after an action

---

## Wishlist API Operations

Wishlist APIs (also called Extended APIs) are **custom vehicle signals** that extend the standard VSS specification.

### createWishlistApi

Create a new custom vehicle signal.

**Signature**:
```typescript
createWishlistApi?: (data: ExtendedApiCreate) => Promise<ExtendedApiRet>
```

**Parameters**:
- `data` - Extended API creation data

**Returns**: Promise resolving to the created API object

**Example**:
```typescript
// Create a simple sensor
const customApi = await api.createWishlistApi({
  model: data.model.id,
  apiName: 'Vehicle.MyCustomSensor',
  description: 'My custom temperature sensor',
  type: 'sensor',
  datatype: 'float',
  skeleton: 'Vehicle.MyCustomSensor',
  isWishlist: true,
  unit: '°C'
})

console.log(`Created API: ${customApi.apiName}`)
console.log(`ID: ${customApi.id}`)

// Create actuator
await api.createWishlistApi({
  model: data.model.id,
  apiName: 'Vehicle.CustomActuator',
  description: 'Custom actuator',
  type: 'actuator',
  datatype: 'boolean',
  skeleton: 'Vehicle.CustomActuator',
  isWishlist: true
})

// Create with validation
await api.createWishlistApi({
  model: data.model.id,
  apiName: 'Vehicle.CustomSpeed',
  description: 'Custom speed signal',
  type: 'sensor',
  datatype: 'float',
  skeleton: 'Vehicle.CustomSpeed',
  isWishlist: true,
  unit: 'km/h',
  min: 0,
  max: 200
})
```

**ExtendedApiCreate Fields**:
```typescript
interface ExtendedApiCreate {
  model: string           // Model ID
  apiName: string         // Full API path (e.g., 'Vehicle.MySignal')
  description: string     // Description
  type: string           // 'sensor', 'actuator', or 'attribute'
  datatype: string       // 'float', 'int', 'string', 'boolean', etc.
  skeleton: string       // API path structure
  isWishlist: boolean    // Must be true
  unit?: string          // Unit (e.g., 'km/h', '°C')
  min?: number           // Minimum value
  max?: number           // Maximum value
  // ... other VSS fields
}
```

---

### updateWishlistApi

Update an existing wishlist API.

**Signature**:
```typescript
updateWishlistApi?: (id: string, data: Partial<ExtendedApiCreate>) => Promise<Partial<ExtendedApiCreate>>
```

**Parameters**:
- `id` - Wishlist API ID
- `data` - Partial data to update

**Returns**: Promise resolving to the updated API data

**Example**:
```typescript
// Update description and datatype
await api.updateWishlistApi('api-id-123', {
  description: 'Updated description',
  datatype: 'double'
})

// Update unit and range
await api.updateWishlistApi('api-id-123', {
  unit: 'm/s',
  min: 0,
  max: 100
})

// Update multiple fields
await api.updateWishlistApi('api-id-123', {
  description: 'New description',
  type: 'actuator',
  datatype: 'boolean'
})
```

**Common Use Cases**:
- Fix API metadata
- Update descriptions
- Adjust value ranges
- Change data types

---

### deleteWishlistApi

Delete a wishlist API.

**Signature**:
```typescript
deleteWishlistApi?: (id: string) => Promise<void>
```

**Parameters**:
- `id` - Wishlist API ID

**Returns**: Promise resolving when deleted

**Example**:
```typescript
// Delete by ID
await api.deleteWishlistApi('api-id-123')

// Delete with confirmation
const handleDelete = async (apiId: string) => {
  if (confirm('Are you sure you want to delete this API?')) {
    await api.deleteWishlistApi(apiId)
    console.log('API deleted')
  }
}

// Delete all APIs from list
const deleteAll = async (apiIds: string[]) => {
  for (const id of apiIds) {
    await api.deleteWishlistApi(id)
  }
}
```

**⚠️ Warning**: Deletion is permanent and cannot be undone.

---

### getWishlistApi

Get a specific wishlist API by name.

**Signature**:
```typescript
getWishlistApi?: (name: string, model_id?: string) => Promise<ExtendedApi>
```

**Parameters**:
- `name` - API name (e.g., 'Vehicle.MyCustomSignal')
- `model_id` (optional) - Model ID. Defaults to current model.

**Returns**: Promise resolving to the wishlist API details

**Throws**: Error if `model_id` is not available or API not found

**Example**:
```typescript
// Get by name
const customApi = await api.getWishlistApi('Vehicle.MyCustomSensor')
console.log(customApi)
// {
//   id: 'api-id-123',
//   apiName: 'Vehicle.MyCustomSensor',
//   description: 'My custom sensor',
//   type: 'sensor',
//   datatype: 'float',
//   ...
// }

// Get from different model
const api = await api.getWishlistApi(
  'Vehicle.MyCustomSensor',
  'model-123'
)

// Check if exists
try {
  const api = await api.getWishlistApi('Vehicle.MySignal')
  console.log('API exists')
} catch (error) {
  console.log('API not found')
}
```

---

### listWishlistApis

List all wishlist APIs for a model.

**Signature**:
```typescript
listWishlistApis?: (model_id?: string) => Promise<List<ExtendedApi>>
```

**Parameters**:
- `model_id` (optional) - Model ID. Defaults to current model.

**Returns**: Promise resolving to paginated list of wishlist APIs

**Throws**: Error if `model_id` is not available

**Example**:
```typescript
// List all wishlist APIs
const result = await api.listWishlistApis()
console.log(`Found ${result.results.length} wishlist APIs`)
console.log(`Total: ${result.count}`)

// Iterate through results
result.results.forEach(api => {
  console.log(`${api.apiName}: ${api.description}`)
})

// Get from different model
const otherApis = await api.listWishlistApis('model-123')

// Filter by type
const sensors = result.results.filter(api => api.type === 'sensor')
console.log(`Found ${sensors.length} sensor APIs`)
```

**List Structure**:
```typescript
interface List<T> {
  count: number      // Total number of items
  next: string | null    // Next page URL (if paginated)
  previous: string | null // Previous page URL
  results: T[]      // Array of items
}
```

---

## Type Definitions

### Complete PluginAPI Interface

```typescript
import type { Model, Prototype } from './model.type'
import type { VehicleAPI, CVI, ExtendedApi, ExtendedApiCreate, ExtendedApiRet } from './api.type'
import type { List } from './common.type'

export interface PluginAPI {
  // Model & Prototype Updates
  updateModel?: (updates: Partial<Model>) => Promise<Model>
  updatePrototype?: (updates: Partial<Prototype>) => Promise<Prototype>

  // Vehicle API Operations (Read)
  getComputedAPIs?: (model_id?: string) => Promise<CVI>
  getApiDetail?: (api_name: string, model_id?: string) => Promise<VehicleAPI>
  listVSSVersions?: () => Promise<string[]>
  getRuntimeApiValues?: () => Record<string, any>

  // Vehicle API Operations (Write)
  replaceAPIs?: (api_data_url: string, model_id?: string) => Promise<void>
  setRuntimeApiValues?: (values: Record<string, any>) => void

  // Navigation
  setActiveTab?: (tab: string, pluginSlug?: string) => void

  // Wishlist API Operations
  createWishlistApi?: (data: ExtendedApiCreate) => Promise<ExtendedApiRet>
  updateWishlistApi?: (id: string, data: Partial<ExtendedApiCreate>) => Promise<Partial<ExtendedApiCreate>>
  deleteWishlistApi?: (id: string) => Promise<void>
  getWishlistApi?: (name: string, model_id?: string) => Promise<ExtendedApi>
  listWishlistApis?: (model_id?: string) => Promise<List<ExtendedApi>>
}
```

### Plugin Props

```typescript
interface PluginPageProps {
  data?: {
    model?: Model
    prototype?: Prototype
    [key: string]: any
  }
  config?: {
    plugin_id?: string
    [key: string]: any
  }
  api?: PluginAPI
}
```

---

## Error Handling

All API methods follow consistent error handling:

### Success Case

```typescript
try {
  const result = await api.updateModel({ name: 'New Name' })
  // ✅ Toast: "Model updated successfully"
  // ✅ Returns updated model object
} catch (error) {
  // Error handling
}
```

### Error Case

```typescript
try {
  await api.updateModel({ name: 'New Name' })
} catch (error) {
  // ❌ Toast: "Failed to update model" or specific error message
  // ❌ Error is thrown
  console.error(error.message)
}
```

### Checking API Availability

Always check if an API method exists before calling:

```typescript
// ✅ Correct
if (api?.updateModel) {
  await api.updateModel({ name: 'New Name' })
} else {
  console.log('updateModel not available (no model in context)')
}

// ❌ Wrong - will crash if api or updateModel is undefined
await api.updateModel({ name: 'New Name' })
```

### Handling Missing Context

Some APIs require context (model_id, prototype_id). They're undefined if context is missing:

```typescript
// updateModel is undefined if no model_id in data
if (!api?.updateModel) {
  alert('This operation requires a model')
  return
}

// updatePrototype is undefined if no prototype_id in data
if (!api?.updatePrototype) {
  alert('This operation requires a prototype')
  return
}
```

### Toast Notifications

All API operations automatically show toast notifications:

- **Success**: Green toast with success message
- **Error**: Red toast with error message

You don't need to show notifications manually - they're handled by the host.

---

## Next Steps

- 📖 See [Architecture](./02-architecture.md) to understand how it works
- 🛠️ Try [Creating Your First Plugin](./03-creating-plugin.md)
- 🚀 Explore [Advanced Topics](./05-advanced.md) for patterns and best practices
