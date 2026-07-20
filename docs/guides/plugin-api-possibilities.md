# Plugin API - Implementation & Possibilities

This document outlines the **current limited Plugin API** and future possibilities for expansion.

---

## 🎯 Current Implementation (Limited Scope)

The plugin API is intentionally **limited** to essential operations only:

### **1. Model & Prototype Updates**
- **`updateModel(updates: Partial<Model>)`** - Update the current model's data
- **`updatePrototype(updates: Partial<Prototype>)`** - Update the current prototype's data

### **2. Vehicle API Operations (Read & Write)**

#### Read Operations
- **`getComputedAPIs(model_id?: string)`** - Get all computed vehicle APIs for a model
- **`getApiDetail(api_name: string, model_id?: string)`** - Get details for a specific API (e.g., 'Vehicle.Speed')
- **`listVSSVersions()`** - List available VSS (Vehicle Signal Specification) versions
- **`getRuntimeApiValues()`** - Get current runtime API values

#### Write Operations
- **`replaceAPIs(api_data_url: string, model_id?: string)`** - Replace all vehicle APIs with new VSS specification
- **`setRuntimeApiValues(values: Record<string, any>)`** - Set runtime API values for testing/simulation

### **3. Wishlist API Operations (Custom Signals)**

#### Create & Manage Custom Signals
- **`createWishlistApi(data: ExtendedApiCreate)`** - Create a new custom vehicle signal
- **`updateWishlistApi(id: string, data: Partial<ExtendedApiCreate>)`** - Update an existing wishlist API
- **`deleteWishlistApi(id: string)`** - Delete a wishlist API
- **`getWishlistApi(name: string, model_id?: string)`** - Get a specific wishlist API by name
- **`listWishlistApis(model_id?: string)`** - List all wishlist APIs for a model

### Usage Examples

#### Model/Prototype Updates
```typescript
// Save custom data to model
await api.updateModel({
  extend: { myPluginData: { settings: {} } }
})

// Update prototype properties (e.g., change name)
await api.updatePrototype({
  name: 'New Prototype Name'
})

// Save custom data to prototype
await api.updatePrototype({
  extend: { customState: { theme: 'dark' } }
})
```

#### Read Vehicle APIs
```typescript
// Get all APIs
const apis = await api.getComputedAPIs()

// Get specific API details
const speedAPI = await api.getApiDetail('Vehicle.Speed')
console.log(speedAPI.datatype, speedAPI.description)

// List VSS versions
const vssVersions = await api.listVSSVersions()
```

#### Write Vehicle APIs
```typescript
// Replace all APIs with new VSS spec
await api.replaceAPIs('https://example.com/vss-4.0.json')

// Set runtime values for testing
api.setRuntimeApiValues({
  'Vehicle.Speed': 65.5,
  'Vehicle.CurrentLocation.Latitude': 37.7749
})

// Get current runtime values
const currentValues = api.getRuntimeApiValues()
console.log(currentValues['Vehicle.Speed'])
```

#### Wishlist API Operations
```typescript
// Create a new custom signal
const newApi = await api.createWishlistApi({
  model: model_id,
  apiName: 'Vehicle.MyCustomSignal',
  description: 'My custom vehicle signal',
  type: 'sensor',
  datatype: 'float',
  skeleton: 'Vehicle.MyCustomSignal',
  isWishlist: true,
  unit: 'km/h'
})

// List all wishlist APIs
const wishlistApis = await api.listWishlistApis()
console.log(`Found ${wishlistApis.results.length} wishlist APIs`)

// Get a specific wishlist API
const customApi = await api.getWishlistApi('Vehicle.MyCustomSignal')

// Update a wishlist API
await api.updateWishlistApi(customApi.id, {
  description: 'Updated description',
  datatype: 'double'
})

// Delete a wishlist API
await api.deleteWishlistApi(customApi.id)
```

---

## 🔒 Design Principles

1. **Minimal Surface Area** - Only essential APIs exposed
2. **Read-Heavy, Write-Light** - Vehicle APIs are read-only
3. **Safe Defaults** - All operations fail gracefully with toast notifications
4. **No Direct Store Access** - Plugins cannot access Zustand stores directly
5. **Extend Field Pattern** - Plugin data stored in `model.extend` / `prototype.extend`

---

## Possible Future Extensions

### 1. **Model Operations**

#### Read Operations
```typescript
api.getModel(model_id: string): Promise<Model>
api.listModels(filters?): Promise<Model[]>
api.getComputedAPIs(model_id: string): Promise<VehicleApi>
```

#### Write Operations
```typescript
api.createModel(model: ModelCreate): Promise<Model>
api.deleteModel(model_id: string): Promise<void>
api.replaceAPIs(model_id: string, apis: any): Promise<void>
```

#### Permission Management
```typescript
api.updateModelPermission(model_id: string, data: any): Promise<void>
api.deleteModelPermission(model_id: string, user_id: string): Promise<void>
```

---

### 2. **Prototype Operations**

#### Read Operations
```typescript
api.getPrototype(prototype_id: string): Promise<Prototype>
api.listPrototypes(model_id?: string): Promise<Prototype[]>
api.listPopularPrototypes(): Promise<Prototype[]>
api.listRecentPrototypes(): Promise<Prototype[]>
```

#### Write Operations
```typescript
api.createPrototype(prototype: any): Promise<Prototype>
api.createBulkPrototypes(prototypes: any[]): Promise<Prototype[]>
api.deletePrototype(prototype_id: string): Promise<void>
api.saveRecentPrototype(prototype_id: string): Promise<void>
api.countCodeExecution(prototype_id: string): Promise<void>
```

---

### 3. **Feedback & Discussion**

#### Feedback Operations
```typescript
api.createFeedback(data: FeedbackCreate): Promise<Feedback>
api.updateFeedback(id: string, data: any): Promise<Feedback>
api.deleteFeedback(id: string): Promise<void>
api.listPrototypeFeedback(prototype_id: string, page?: number): Promise<Feedback[]>
api.submitIssue(data: any): Promise<any>
```

#### Discussion Operations
```typescript
api.createDiscussion(data: any): Promise<Discussion>
api.updateDiscussion(id: string, data: any): Promise<Discussion>
api.deleteDiscussion(id: string): Promise<void>
```

---

### 4. **File & Asset Management**

```typescript
api.uploadFile(file: File): Promise<{ url: string }>
api.uploadAsset(asset: any): Promise<Asset>
api.deleteAsset(asset_id: string): Promise<void>
```

---

### 5. **Runtime & Execution Control**

#### Runtime State Access (via store subscription)
```typescript
api.subscribeToRuntime(callback: (state) => void): () => void
api.getApiValues(): Record<string, any>
api.setApiValue(apiPath: string, value: any): Promise<void>
api.getTraceVariables(): any[]
api.getLogs(): string[]
```

#### Execution Control
```typescript
api.executePrototype(prototype_id: string, config?: any): Promise<any>
api.stopExecution(): Promise<void>
api.clearLogs(): Promise<void>
```

---

### 6. **Vehicle API Operations**

```typescript
api.getApiDetail(model_id: string, api_name: string): Promise<VehicleApi>
api.listVSSVersions(): Promise<string[]>
api.getExtendedAPIs(model_id: string): Promise<any>
```

---

### 7. **Search & Discovery**

```typescript
api.searchPrototypes(query: string): Promise<SearchPrototype[]>
api.searchModels(query: string): Promise<Model[]>
```

---

### 8. **User & Authentication** (Security Considerations Required)

```typescript
// Read-only user info
api.getCurrentUser(): Promise<User>
api.getUserPermissions(resource_id: string): Promise<Permission[]>

// Note: Write operations should be restricted
```

---

### 9. **Configuration Management**

```typescript
api.getConfig(key: string): Promise<any>
api.setConfig(key: string, value: any): Promise<void>
api.listConfigs(): Promise<Config[]>
```

---

### 10. **Real-time Communication (WebSocket)**

```typescript
api.subscribe(channel: string, callback: (data: any) => void): () => void
api.publish(channel: string, data: any): Promise<void>
api.onRuntimeUpdate(callback: (data: any) => void): () => void
```

---

### 11. **Navigation & UI Control**

```typescript
api.navigate(path: string): void
api.showToast(message: string, type: 'success' | 'error' | 'info'): void
api.showModal(component: React.ComponentType, props?: any): Promise<any>
api.closeModal(): void
```

---

### 12. **Code Conversion & Compilation**

```typescript
api.convertCode(code: string, from: Language, to: Language): Promise<string>
api.compileRust(code: string): Promise<CompileResult>
```

---

### 13. **GitHub Integration** (if enabled)

```typescript
api.connectGithub(): Promise<void>
api.listGithubRepos(): Promise<Repository[]>
api.createGithubIssue(repo: string, data: any): Promise<Issue>
```

---

### 14. **Plugin-to-Plugin Communication**

```typescript
api.sendMessage(pluginId: string, message: any): Promise<void>
api.onMessage(callback: (message: any, from: string) => void): () => void
api.listActivePlugins(): Promise<string[]>
```

---

## Security & Permission Model

### Recommended Approach: Permission Levels

```typescript
interface PluginManifest {
  id: string
  name: string
  permissions: PluginPermission[]
}

type PluginPermission =
  | 'model:read'
  | 'model:write'
  | 'prototype:read'
  | 'prototype:write'
  | 'feedback:write'
  | 'runtime:control'
  | 'file:upload'
  | 'user:read'
  | 'navigation'
  | 'websocket'

// Only expose APIs based on granted permissions
function createPluginAPI(manifest: PluginManifest, context: PluginContext): PluginAPI {
  const api: Partial<PluginAPI> = {}

  if (manifest.permissions.includes('model:read')) {
    api.getModel = ...
    api.listModels = ...
  }

  if (manifest.permissions.includes('model:write')) {
    api.updateModel = ...
    api.createModel = ...
  }

  // ... etc

  return api as PluginAPI
}
```

---

## Implementation Priority

### Phase 1 (Current) ✅
- [x] updateModel
- [x] updatePrototype

### Phase 2 (High Priority)
- [ ] showToast (UI feedback)
- [ ] uploadFile (asset management)
- [ ] getApiValues / setApiValue (runtime control)
- [ ] subscribeToRuntime (real-time updates)

### Phase 3 (Medium Priority)
- [ ] createFeedback / listFeedback
- [ ] createDiscussion
- [ ] navigate (route control)
- [ ] searchPrototypes / searchModels

### Phase 4 (Advanced)
- [ ] executePrototype / stopExecution
- [ ] Plugin-to-plugin communication
- [ ] WebSocket pub/sub
- [ ] GitHub integration
- [ ] Permission system implementation

---

## Usage Examples

### Example 1: Custom Feedback Widget
```typescript
function FeedbackPlugin({ api }: PluginPageProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const handleSubmit = async () => {
    await api.createFeedback({
      ref: api.data.prototype.id,
      ref_type: 'prototype',
      score: { relevance: rating },
      recommendation: comment
    })
    api.showToast('Feedback submitted!', 'success')
  }

  return <FeedbackForm onSubmit={handleSubmit} />
}
```

### Example 2: Runtime Monitor & Control
```typescript
function RuntimeMonitor({ api }: PluginPageProps) {
  const [apiValues, setApiValues] = useState({})

  useEffect(() => {
    // Subscribe to runtime updates
    return api.subscribeToRuntime((state) => {
      setApiValues(state.apiValues)
    })
  }, [])

  const handleSetValue = async (path: string, value: any) => {
    await api.setApiValue(path, value)
  }

  return <Dashboard values={apiValues} onUpdate={handleSetValue} />
}
```

### Example 3: File Upload & Asset Management
```typescript
function ImageGallery({ api }: PluginPageProps) {
  const handleUpload = async (file: File) => {
    const { url } = await api.uploadFile(file)

    // Save to model's extend field
    await api.updateModel({
      extend: {
        gallery: [...(api.data.model.extend?.gallery || []), url]
      }
    })

    api.showToast('Image uploaded!', 'success')
  }

  return <DropZone onDrop={handleUpload} />
}
```

---

## Type Definitions

All plugin APIs should be fully typed. Example:

```typescript
// frontend/src/types/plugin.types.ts

export interface PluginAPI {
  // Model Operations
  updateModel?: (updates: Partial<Model>) => Promise<Model>
  getModel?: (model_id: string) => Promise<Model>

  // Prototype Operations
  updatePrototype?: (updates: Partial<Prototype>) => Promise<Prototype>
  getPrototype?: (prototype_id: string) => Promise<Prototype>

  // Feedback
  createFeedback?: (data: FeedbackCreate) => Promise<Feedback>

  // File Management
  uploadFile?: (file: File) => Promise<{ url: string }>

  // Runtime Control
  getApiValues?: () => Record<string, any>
  setApiValue?: (path: string, value: any) => Promise<void>
  subscribeToRuntime?: (callback: (state: RuntimeState) => void) => () => void

  // UI Control
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  navigate?: (path: string) => void

  // Search
  searchPrototypes?: (query: string) => Promise<SearchPrototype[]>
}
```

---

## Notes

1. **Security First**: Always validate plugin permissions before exposing APIs
2. **Type Safety**: All APIs must be fully typed for better DX
3. **Error Handling**: Host should handle errors gracefully and provide feedback
4. **Documentation**: Each API should be well-documented with examples
5. **Versioning**: Consider API versioning for backward compatibility
6. **Rate Limiting**: Implement rate limiting for write operations
7. **Audit Logging**: Log all plugin API calls for security and debugging

---

## Questions for Discussion

1. Should plugins be sandboxed (iframe) or trusted (same origin)?
2. What permission model should we use (manifest-based, runtime prompts, admin-approved)?
3. Should we support plugin-to-plugin communication?
4. Do we need a plugin marketplace/registry?
5. Should plugins be able to register custom routes/pages?
6. How do we handle plugin updates and versioning?
