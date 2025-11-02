# Model Plugin Page Implementation

## Overview
Created the model-level plugin rendering page to match the prototype-level plugin functionality, allowing custom model tabs to display plugin content.

## Files Created/Modified

### 1. New Page Component
**`src/pages/PageModelPlugin.tsx`**
- Renders plugin content at the model level
- Extracts `plugid` from URL query parameters
- Passes `model_id` to PluginPageRender
- Shows error message if no plugin ID specified

### 2. Route Configuration
**`src/configs/routes.tsx`**
- Added import for `PageModelPlugin`
- Added route: `/model/:model_id/plugin`
- Route is a child of `ModelDetailLayout` (appears within model tabs)

## Architecture Comparison

### Prototype Plugin Page
```
Route: /model/:model_id/library/prototype/:prototype_id/plug?plugid=xxx
Component: PagePrototypePlugin
Data passed to PluginPageRender:
  - model_id
  - prototype_id
  - plugin_id (from query param)
```

### Model Plugin Page (NEW)
```
Route: /model/:model_id/plugin?plugid=xxx
Component: PageModelPlugin
Data passed to PluginPageRender:
  - model_id
  - plugin_id (from query param)
```

## Component Code

```tsx
// PageModelPlugin.tsx
const PageModelPlugin: FC<PageModelPluginProps> = () => {
  const { model_id } = useParams()
  const [searchParams] = useSearchParams()
  const pluginId = searchParams.get('plugid')

  if (!pluginId) {
    return <div>No plugin ID specified</div>
  }

  return (
    <PluginPageRender
      plugin_id={pluginId}
      data={{ model_id }}
    />
  )
}
```

## User Flow

1. User is viewing a model (e.g., `/model/123/overview`)
2. Model owner adds custom tabs via CustomTabEditor
3. Custom model tabs appear in the tab bar (via CustomModelTabs)
4. User clicks a custom tab
5. Navigates to `/model/123/plugin?plugid=plugin-slug`
6. PageModelPlugin renders
7. PluginPageRender displays the plugin content

## Integration Points

### CustomModelTabs Component
Generates navigation links for custom tabs:
```tsx
<DaTabItem
  to={`/model/${model_id}/plugin?plugid=${customTab.plugin}`}
  active={location.pathname.includes('/plugin') &&
          location.search.includes(`plugid=${customTab.plugin}`)}
>
  {customTab.label}
</DaTabItem>
```

### ModelDetailLayout
- Shows CustomModelTabs in tab bar
- Outlet renders PageModelPlugin when route matches
- Layout provides consistent header/navigation

### Route Structure
```
/model/:model_id (ModelDetailLayout)
  ├── index (PageModelDetail)
  ├── api (PageVehicleApi)
  ├── api/:api (PageVehicleApi)
  ├── plugin (PageModelPlugin) ← NEW
  └── library/... (PagePrototypeLibrary, etc.)
```

## Key Differences from Prototype Plugin

| Aspect | Prototype Plugin | Model Plugin |
|--------|------------------|--------------|
| **Level** | Prototype-specific | Model-wide |
| **URL Pattern** | `.../prototype/:id/plug?plugid=` | `.../plugin?plugid=` |
| **Context Data** | model_id + prototype_id | model_id only |
| **Tab Component** | CustomPrototypeTabs | CustomModelTabs |
| **Use Case** | Plugin for specific prototype | Plugin for entire model |

## Data Flow

```
Custom Tab Click
    ↓
Navigate to /model/:id/plugin?plugid=xxx
    ↓
ModelDetailLayout (maintains layout)
    ↓
PageModelPlugin (extracts params)
    ↓
PluginPageRender (renders plugin UI)
    ↓
Plugin receives: { model_id, plugin_id }
```

## Testing

To verify the implementation:

1. **Add a custom model tab:**
   - Go to any model page
   - Click the + button in tab bar
   - Select a plugin and provide a label
   - Click "Add"

2. **View the custom tab:**
   - Custom tab appears in tab bar
   - Click the custom tab
   - URL changes to `/model/:id/plugin?plugid=xxx`
   - Plugin content renders in main area

3. **Edit custom tabs:**
   - Click ⋮ menu → "Manage Addons"
   - Edit label, reorder, or remove tabs
   - Save changes
   - Tabs update correctly

## Error Handling

**No Plugin ID:**
```tsx
if (!pluginId) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <p className="text-base text-muted-foreground">
        No plugin ID specified
      </p>
    </div>
  )
}
```

**Invalid Model ID:**
- Handled by ModelDetailLayout (shows loading/error state)
- PageModelPlugin receives `undefined` model_id
- PluginPageRender handles gracefully

## Future Enhancements

Potential improvements:
- Add breadcrumb navigation for plugin pages
- Plugin-level error boundaries
- Loading states for plugin content
- Plugin metadata display in header
- Plugin-specific toolbar actions
- Deep linking to plugin sub-routes
