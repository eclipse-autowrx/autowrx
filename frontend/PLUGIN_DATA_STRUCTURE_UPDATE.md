# Plugin Data Structure Update

## Summary
Updated both `PagePrototypePlugin` and `PageModelPlugin` to pass full model and prototype objects to plugins instead of just IDs, providing plugins with complete context data.

## Changes Made

### 1. PagePrototypePlugin
**Before:**
```typescript
<PluginPageRender
  plugin_id={pluginId}
  data={{
    model_id,
    prototype_id,
  }}
/>
```

**After:**
```typescript
<PluginPageRender
  plugin_id={pluginId}
  data={{
    model: model || null,        // Full model object
    prototype: prototype || null, // Full prototype object
  }}
/>
```

**Changes:**
- Added `useCurrentModel()` hook to fetch full model data
- Added `useCurrentPrototype()` hook to fetch full prototype data
- Added loading state while fetching data
- Pass complete objects instead of IDs

### 2. PageModelPlugin
**Before:**
```typescript
<PluginPageRender
  plugin_id={pluginId}
  data={{
    model_id,
  }}
/>
```

**After:**
```typescript
<PluginPageRender
  plugin_id={pluginId}
  data={{
    model: model || null,  // Full model object
    prototype: null,       // Always null for model-level plugins
  }}
/>
```

**Changes:**
- Added `useCurrentModel()` hook to fetch full model data
- Added loading state while fetching data
- Pass complete model object and null prototype
- Consistent data structure with PagePrototypePlugin

## New Data Structure

### For Prototype-Level Plugins
```typescript
{
  model: {
    id: string
    name: string
    description: string
    created_by: User
    custom_template: {
      model_tabs: CustomTab[]
      prototype_tabs: CustomTab[]
    }
    skeleton: string
    // ... all other model fields
  } | null,
  prototype: {
    id: string
    name: string
    description: string
    model_id: string
    code: string
    language: string
    // ... all other prototype fields
  } | null
}
```

### For Model-Level Plugins
```typescript
{
  model: {
    id: string
    name: string
    description: string
    // ... all model fields
  } | null,
  prototype: null  // Always null
}
```

## Benefits

### 1. Rich Context
Plugins now have access to complete model/prototype data without making additional API calls:
```typescript
// Plugin can now access:
const { model, prototype } = props.data

// Full model info
console.log(model.name)
console.log(model.description)
console.log(model.created_by)

// Full prototype info (if available)
console.log(prototype?.name)
console.log(prototype?.code)
console.log(prototype?.language)
```

### 2. No Additional API Calls
Previously, plugins only received IDs and had to fetch full data:
```typescript
// OLD: Plugin had to do this
const model = await fetchModel(data.model_id)
const prototype = await fetchPrototype(data.prototype_id)

// NEW: Plugin receives full data immediately
const { model, prototype } = props.data
```

### 3. Consistent Structure
Both model and prototype plugins receive the same data structure:
```typescript
// Both receive this shape
interface PluginData {
  model: Model | null
  prototype: Prototype | null
}
```

### 4. Type Safety
Full objects provide better TypeScript support:
```typescript
// Plugin components get full type information
function MyPlugin({ data }: { data: { model: Model | null, prototype: Prototype | null } }) {
  // TypeScript knows all available fields
  data.model?.custom_template
  data.prototype?.language
}
```

## Loading States

Both components now show loading indicators while fetching data:

**PagePrototypePlugin:**
```typescript
if (isModelLoading || isPrototypeLoading) {
  return <LoadingSpinner message="Loading data..." />
}
```

**PageModelPlugin:**
```typescript
if (isModelLoading) {
  return <LoadingSpinner message="Loading model data..." />
}
```

## Plugin Migration Guide

If you have existing plugins that expect the old structure, update them:

**Old Plugin Code:**
```typescript
function MyPlugin({ data }) {
  const modelId = data.model_id
  const prototypeId = data.prototype_id

  // Had to fetch data
  useEffect(() => {
    fetchModel(modelId)
    fetchPrototype(prototypeId)
  }, [])
}
```

**New Plugin Code:**
```typescript
function MyPlugin({ data }) {
  const { model, prototype } = data

  // Data is already available!
  if (!model) return <div>No model</div>

  return (
    <div>
      <h1>{model.name}</h1>
      {prototype && <p>{prototype.description}</p>}
    </div>
  )
}
```

## Example Plugin Usage

```typescript
// Plugin receives full context
function AnalyticsPlugin({ data, config }) {
  const { model, prototype } = data

  return (
    <div className="p-4">
      <h2>Analytics for {model?.name}</h2>

      {prototype ? (
        <div>
          <h3>Prototype: {prototype.name}</h3>
          <p>Language: {prototype.language}</p>
          <p>Code lines: {prototype.code.split('\n').length}</p>
        </div>
      ) : (
        <div>
          <h3>Model-level analytics</h3>
          <p>Total custom tabs: {model?.custom_template?.model_tabs?.length || 0}</p>
        </div>
      )}
    </div>
  )
}
```

## Backward Compatibility

**Breaking Change:** This is a breaking change for existing plugins.

**Migration Path:**
1. Update plugins to expect `{ model, prototype }` instead of IDs
2. Remove any API calls to fetch model/prototype data
3. Use the provided objects directly

**Rollback:** If needed, you can access IDs from the objects:
```typescript
const modelId = data.model?.id
const prototypeId = data.prototype?.id
```

## Testing

To verify the changes:

1. **Test Prototype Plugin:**
   - Navigate to a prototype page
   - Click a custom prototype tab
   - Plugin should receive both model and prototype objects
   - Verify data is available immediately

2. **Test Model Plugin:**
   - Navigate to a model page
   - Click a custom model tab
   - Plugin should receive model object and null prototype
   - Verify data is available immediately

3. **Test Loading States:**
   - Slow network or large data
   - Should show loading spinner
   - Should render plugin after data loads

## Performance Considerations

**Pros:**
- ✅ Eliminates duplicate API calls from plugins
- ✅ Data is cached by React Query hooks
- ✅ Faster plugin initialization

**Cons:**
- ⚠️ Slightly larger initial payload
- ⚠️ Data loaded even if plugin doesn't need it

**Overall:** Net positive - most plugins need this data anyway, and eliminating duplicate API calls improves performance.
