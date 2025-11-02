# Plugin Switching Implementation Summary

## What We've Accomplished

### 1. Custom Tab Management System ✅
- Created `CustomTabEditor` component for managing custom tabs with drag-and-drop, editing, and removal
- Applied to both `PagePrototypeDetail` and `ModelDetailLayout`
- Users can add, reorder, rename, and remove custom plugin tabs

### 2. Plugin Page Routes ✅
- Created `PagePrototypePlugin` for prototype-level plugins
- Created `PageModelPlugin` for model-level plugins
- Added routes in `routes.tsx`

### 3. Plugin Data Structure ✅
- Updated to pass full `model` and `prototype` objects to plugins
- Plugins now receive: `{ model: {...}, prototype: {...} }`
- Instead of just IDs: `{ model_id, prototype_id }`

### 4. Plugin Loading Infrastructure ✅
- Created `PluginPageRender` component to handle dynamic plugin loading
- Supports loading scripts from URLs
- Handles plugin registration in `window.DAPlugins`
- Proper cleanup and unmounting

### 5. Plugin Switching with Proper Remounting ✅
- Added `key={pluginId}` to force component remounting when plugin changes
- Fixed race conditions in React Strict Mode with polling approach
- Proper cleanup of old plugins before loading new ones

## Current Issue: Plugin Configuration

### Problem
When switching between `test01` and `external` plugin tabs, the same component is displayed because both plugins point to scripts that register as the same name in `window.DAPlugins`.

### From Your Logs
```
[plugin-render:test01] Plugin URL: /plugin/sample-tsx/index.js
[plugin-render:test01] Using first available plugin: sample-tsx

[plugin-render:external] Plugin URL: http://127.0.0.1:4000/index.js
[plugin-render:external] Using first available plugin: sample-tsx
```

Both plugins end up using `sample-tsx` component!

### Root Cause
Your plugin configuration in the database has:
- **test01** → URL: `/plugin/sample-tsx/index.js` ❌ (Should have its own URL)
- **external** → URL: `http://127.0.0.1:4000/index.js` ✅

### Solution
Each plugin must:
1. Have a **unique script URL**
2. Register with a **unique name** in `window.DAPlugins`

#### Example: Correct Plugin Configuration

**Plugin 1: test01**
```javascript
// File: /plugin/test01/index.js
window.DAPlugins = window.DAPlugins || {}
window.DAPlugins['test01'] = {  // ← Unique name
  components: {
    Page: Test01Component
  },
  unmount: (container) => { /* cleanup */ }
}
```

**Plugin 2: external**
```javascript
// File: http://127.0.0.1:4000/index.js
window.DAPlugins = window.DAPlugins || {}
window.DAPlugins['external'] = {  // ← Different unique name
  components: {
    Page: ExternalComponent
  },
  unmount: (container) => { /* cleanup */ }
}
```

**Database Configuration:**
- Plugin `test01` → URL: `/plugin/test01/index.js`
- Plugin `external` → URL: `http://127.0.0.1:4000/index.js`

## How the System Works Now

### Component Hierarchy
```
PagePrototypeDetail
  └─ PagePrototypePlugin (key={pluginId})  ← Forces remount on pluginId change
      └─ PluginPageRender (key={pluginId})  ← Forces remount on pluginId change
          └─ PluginComponent (from window.DAPlugins)
```

### Loading Sequence
1. User clicks plugin tab → `pluginId` query param changes
2. React sees `key={pluginId}` changed → unmounts old PagePrototypePlugin
3. Old PluginPageRender cleanup runs → calls `window.DAPlugins[oldPlugin].unmount()`
4. New PagePrototypePlugin mounts
5. New PluginPageRender mounts and loads plugin:
   - Fetches plugin metadata by slug
   - Loads script from plugin URL (or reuses if already loaded)
   - Polls `window.DAPlugins` for plugin registration
   - Finds component and renders it

### Key Features
- **Automatic script reuse**: If script is already loaded, it's reused
- **Race condition handling**: Polling waits for plugin to register even if script tag exists
- **Proper cleanup**: Old plugins are unmounted before new ones load
- **Component isolation**: Each plugin instance is isolated with unique keys

## Testing Checklist

### ✅ What Works
- [x] Adding custom tabs
- [x] Reordering custom tabs
- [x] Renaming custom tabs
- [x] Removing custom tabs
- [x] Loading plugins on first click
- [x] Reloading page (F5) shows correct plugin
- [x] Switching from plugin tab to non-plugin tab
- [x] Plugin receives full model and prototype data

### ❌ What Needs Fixing
- [ ] Switching between two different plugin tabs (same component shows)
  - **Cause**: Plugin configuration issue - both use same script/component
  - **Fix**: Update plugin database configurations to use unique URLs

## Next Steps

1. **Fix Plugin Configuration**:
   - Check your plugin database/API
   - Ensure each plugin has a unique script URL
   - Ensure each script registers with a unique name in `window.DAPlugins`

2. **Verify**:
   - Check `/api/plugins` endpoint
   - Look for the `url` field for each plugin
   - Make sure `test01` doesn't point to `/plugin/sample-tsx/index.js`

3. **Test**:
   - After fixing URLs, switch between plugin tabs
   - Check console logs show different plugin names loading
   - Verify correct component renders for each tab

## Files Modified

### Created Files
- `/frontend/src/components/organisms/CustomTabEditor.tsx`
- `/frontend/src/components/molecules/CustomModelTabs.tsx`
- `/frontend/src/components/molecules/CustomPrototypeTabs.tsx`
- `/frontend/src/components/organisms/PluginPageRender.tsx`
- `/frontend/src/pages/PagePrototypePlugin.tsx`
- `/frontend/src/pages/PageModelPlugin.tsx`

### Modified Files
- `/frontend/src/pages/PagePrototypeDetail.tsx`
  - Added `useSearchParams` to get `pluginId`
  - Added `key={pluginId}` to `PagePrototypePlugin`
  - Added custom tab management

- `/frontend/src/layouts/ModelDetailLayout.tsx`
  - Added custom tab management for model-level tabs

- `/frontend/src/configs/routes.tsx`
  - Added `/model/:id/plugin` route

### Documentation Files
- `/frontend/PLUGIN_RENDER_FIXES.md`
- `/frontend/PLUGIN_DATA_STRUCTURE_UPDATE.md`
- `/frontend/PLUGIN_SWITCHING_DEBUG.md`
- `/frontend/PLUGIN_SWITCHING_SUMMARY.md` (this file)

## Console Logs to Check

When switching from Plugin A to Plugin B, you should see:

```
[plugin-render:pluginA] Component will unmount for plugin: pluginA
[plugin-render:pluginA] Cleanup - unmounting
[plugin-render:pluginA] Calling unmount for: pluginA
[plugin-render:pluginB] Component mounted/remounted for plugin: pluginB
[plugin-render:pluginB] Starting plugin load
[plugin-render:pluginB] Plugin URL: /plugin/pluginB/index.js
[plugin-render:pluginB] Found plugin by slug: pluginB
[plugin-render:pluginB] Plugin ready to render: pluginB for requested plugin_id: pluginB
[plugin-render:pluginB] Rendering plugin: pluginB for requested: pluginB
```

If you see different plugin names for "found" vs "requested", that's the configuration issue.

## Support

If you continue to see the wrong plugin rendering:
1. Share the console logs showing what plugin was loaded vs what was requested
2. Check your plugin API response to see the URLs configured
3. Verify each plugin script registers with a unique name in `window.DAPlugins`
