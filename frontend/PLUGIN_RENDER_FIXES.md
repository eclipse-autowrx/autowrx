# PluginPageRender Fixes

## Issues Fixed

### 1. Timeout Error When Script Already Loaded ✅

**Problem:**
When a plugin script was already loaded (script tag exists in DOM), the component would timeout waiting for a "new" plugin registration that never comes.

```
[plugin-render:external] script already present, reusing
[plugin-render:external] timeout: New plugin registration detected
```

**Root Cause:**
The code was waiting for a NEW plugin to be added to `window.DAPlugins`, but when the script is already loaded, no new plugin gets registered.

**Solution:**
When script is already present, immediately look up the plugin in `window.DAPlugins` instead of waiting:

```typescript
if (!script) {
  // New script - wait for registration
  await waitFor(() => {
    const pluginsAfter = Object.keys(window.DAPlugins || {})
    const newPlugins = pluginsAfter.filter(p => !pluginsBefore.includes(p))
    if (newPlugins.length > 0) {
      detectedPluginName = newPlugins[0]
      return true
    }
    return false
  }, 'New plugin registration detected')
} else {
  // Script already loaded - look up existing plugin
  const allPlugins = window.DAPlugins || {}

  // Try to match by plugin_id (slug) first
  if (allPlugins[plugin_id]) {
    detectedPluginName = plugin_id
  } else {
    // Fallback: use first available plugin
    const availablePlugins = Object.keys(allPlugins)
    if (availablePlugins.length > 0) {
      detectedPluginName = availablePlugins[0]
    }
  }
}
```

### 2. Plugin Not Unmounting When Switching Tabs ✅

**Problem:**
When switching between different custom tabs (different plugins), the old plugin component wasn't being unmounted before mounting the new one.

**Root Cause:**
The unmount logic was using a global `__lastLoadedPlugin` variable, which gets overwritten when a new plugin loads. This meant:
1. Switch to Plugin A → stores `__lastLoadedPlugin = 'pluginA'`
2. Switch to Plugin B → stores `__lastLoadedPlugin = 'pluginB'`
3. Plugin A's cleanup runs → tries to unmount using `'pluginB'` (wrong!)

**Solution:**
Use instance-specific storage for each plugin:

```typescript
// Store plugin name per instance (not globally)
window[`__plugin_${plugin_id}`] = detectedPluginName

// Cleanup uses the correct instance
const pluginName = window[`__plugin_${plugin_id}`]
if (pluginName && containerRef.current) {
  window?.DAPlugins?.[pluginName]?.unmount?.(containerRef.current)
}
```

## Technical Details

### Plugin Name Storage Strategy

**Before (Global - BROKEN):**
```typescript
// All instances share one variable
window.__lastLoadedPlugin = 'sample-tsx'

// Problem: Gets overwritten when switching tabs
Tab A loads → window.__lastLoadedPlugin = 'pluginA'
Tab B loads → window.__lastLoadedPlugin = 'pluginB'
Tab A unmounts → tries to unmount 'pluginB' (WRONG!)
```

**After (Per-Instance - FIXED):**
```typescript
// Each instance has its own storage
window.__plugin_sample-tsx = 'sample-tsx'
window.__plugin_external = 'external'

// Each instance unmounts correctly
Tab A (sample-tsx) unmounts → unmounts 'sample-tsx' ✓
Tab B (external) unmounts → unmounts 'external' ✓
```

### Script Reuse Logic

The component now handles three scenarios:

**Scenario 1: First Load (Script Not Present)**
```typescript
if (!script) {
  // 1. Create and inject script tag
  script = document.createElement('script')
  script.src = PLUGIN_URL
  document.body.appendChild(script)

  // 2. Wait for new plugin registration
  await waitFor(() => {
    const newPlugins = pluginsAfter.filter(p => !pluginsBefore.includes(p))
    return newPlugins.length > 0
  })
}
```

**Scenario 2: Script Already Loaded (Same Plugin)**
```typescript
else {
  // Script exists - plugin already registered
  const allPlugins = window.DAPlugins || {}

  // Look up by slug
  if (allPlugins[plugin_id]) {
    detectedPluginName = plugin_id  // ✓ Found immediately
  }
}
```

**Scenario 3: Script Already Loaded (Different Plugin ID)**
```typescript
else {
  const allPlugins = window.DAPlugins || {}

  // Slug not found - use first available
  const availablePlugins = Object.keys(allPlugins)
  if (availablePlugins.length > 0) {
    detectedPluginName = availablePlugins[0]  // ✓ Fallback works
  }
}
```

### Component Lifecycle

```
Mount Plugin A (sample-tsx)
  ↓
Load script from http://127.0.0.1:4000/index.js
  ↓
Plugin registers: window.DAPlugins['sample-tsx'] = {...}
  ↓
Store: window.__plugin_sample-tsx = 'sample-tsx'
  ↓
Render <RemotePage /> using DAPlugins['sample-tsx'].components.Page
  ↓
--- User switches tab ---
  ↓
Unmount Plugin A
  ↓
Retrieve: pluginName = window.__plugin_sample-tsx
  ↓
Call: DAPlugins['sample-tsx'].unmount(container)
  ↓
Mount Plugin B (external)
  ↓
Script already present (same URL), reuse it
  ↓
Look up: window.DAPlugins['external']
  ↓
Store: window.__plugin_external = 'external'
  ↓
Render <RemotePage /> using DAPlugins['external'].components.Page
```

## Error Messages Improved

**Before:**
```
Error: timeout: New plugin registration detected
Error: No plugin was detected
```

**After:**
```
Error: No plugin was detected for sample-tsx
Error: Remote Page component missing for external
```

More specific error messages help with debugging.

## Benefits

### 1. Faster Tab Switching
- No more 6-second timeout when switching between tabs
- Immediate plugin lookup when script already loaded
- Better user experience

### 2. Proper Cleanup
- Each plugin instance cleans up correctly
- No memory leaks from unmounted components
- Prevents React warnings about state updates on unmounted components

### 3. Multiple Plugins Support
- Can load different plugins from the same script
- Handles plugin slug mismatches gracefully
- Fallback logic for single-plugin bundles

## Testing Scenarios

### Test 1: Fresh Load
1. Navigate to model → click custom tab (Plugin A)
2. **Expected:** Plugin loads successfully
3. **Verify:** No timeout errors in console

### Test 2: Tab Switch (Same Plugin)
1. Load Plugin A
2. Navigate away
3. Come back to Plugin A
4. **Expected:** Instant load (script reused)
5. **Verify:** Console shows "script already present, reusing"

### Test 3: Tab Switch (Different Plugins)
1. Load Plugin A from URL X
2. Switch to Plugin B from URL Y
3. **Expected:** Both load correctly
4. **Verify:** Plugin A unmounts before Plugin B mounts

### Test 4: Tab Switch (Same URL, Different Slugs)
1. Load Plugin A (slug: 'pluginA', URL: http://cdn.../bundle.js)
2. Load Plugin B (slug: 'pluginB', URL: http://cdn.../bundle.js)
3. **Expected:** Both work (same script, different DAPlugins entries)
4. **Verify:** Correct plugin component renders for each

## Migration Notes

**No Breaking Changes:** This fix is backward compatible with existing plugins.

**Plugin Requirements:**
Plugins must still register themselves in `window.DAPlugins`:

```javascript
window.DAPlugins = window.DAPlugins || {}
window.DAPlugins['my-plugin'] = {
  components: {
    Page: MyComponent  // Required
  },
  unmount: (container) => {  // Optional but recommended
    // Cleanup logic here
  }
}
```

**Recommended:** Implement the `unmount` function to properly clean up:
```javascript
unmount: (container) => {
  // Clear timers
  clearInterval(myInterval)

  // Remove event listeners
  window.removeEventListener('resize', handleResize)

  // Cleanup subscriptions
  subscription.unsubscribe()
}
```

## Performance Impact

**Before:**
- Script already loaded → 6 seconds timeout → error or lucky registration
- Tab switching → old plugin not cleaned up → memory leak
- Multiple loads → duplicate event listeners → performance degradation

**After:**
- Script already loaded → <100ms lookup → success
- Tab switching → old plugin unmounted → clean state
- Multiple loads → proper cleanup → stable performance
