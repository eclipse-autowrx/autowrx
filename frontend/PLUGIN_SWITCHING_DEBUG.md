# Plugin Switching Debug Log

## Problem
When switching between two plugin tabs (e.g., Plugin A → Plugin B), the wrong plugin content is displayed. The old plugin's content appears instead of the new plugin.

## Expected Behavior
1. Click Plugin A tab → Plugin A loads and displays
2. Click Plugin B tab → Plugin A unmounts, Plugin B loads and displays
3. Click Plugin A tab again → Plugin B unmounts, Plugin A loads and displays

## Current Behavior
1. Click Plugin A tab → Plugin A loads and displays ✓
2. Click Plugin B tab → Plugin A content still shows (wrong!) ✗
3. F5 refresh → Plugin B now shows correctly ✓

## What We've Tried

### Attempt 1: React.lazy with polling
- Used `React.lazy` with async polling to wait for plugin registration
- **Result**: Error "Plugin not ready" when switching tabs

### Attempt 2: Direct component rendering with useMemo
- Removed `React.lazy`, used `useMemo` to get component directly
- **Result**: Still showed old plugin content

### Attempt 3: Wrapper component for unmounting
- Created `PluginWrapper` component with its own cleanup effect
- **Result**: Same issue - old plugin content persists

### Attempt 4: Complete rewrite with key-based remounting
- Added `key={pluginId}` to PluginPageRender in parent components
- Simplified to single effect with explicit loading steps
- **Result**: Still showing old plugin content when switching tabs

## Current Implementation

### File: `/frontend/src/pages/PagePrototypePlugin.tsx`
```tsx
<PluginPageRender
  key={pluginId}  // Should force remount when pluginId changes
  plugin_id={pluginId}
  data={{ model, prototype }}
/>
```

### File: `/frontend/src/components/organisms/PluginPageRender.tsx`
- State: `loading`, `error`, `PluginComponent`
- Single effect that runs on `plugin_id` change
- Cleanup function calls `window.DAPlugins[pluginName].unmount()`
- Component render wrapped with key: `key={plugin-${plugin_id}-${mountedPluginRef.current}}`

## Debug Questions

1. **Is the component actually remounting?**
   - Need to check console logs for "Component will unmount" and "Component mounted/remounted" messages
   - If these messages show the SAME plugin_id, then the key isn't working

2. **Is the effect running on plugin_id change?**
   - Check for "Starting plugin load" message with new plugin_id
   - Check for "Cleanup - unmounting" message with old plugin_id

3. **Is the old plugin being unmounted?**
   - Check for "Calling unmount for: [plugin-name]" message
   - Check if plugin's unmount function exists: `window.DAPlugins[name].unmount`

4. **Is the component state being cleared?**
   - Check if `PluginComponent` state is set to null during cleanup
   - Check if `mountedPluginRef.current` is cleared

## Next Steps

Need console logs to understand:
- Whether React is creating new component instances (key working?)
- Whether the effect is running for the new plugin
- Whether the old plugin is being unmounted
- What component is being rendered (old or new?)

## Plugin Registration Structure

Plugins should register like this:
```javascript
window.DAPlugins = window.DAPlugins || {}
window.DAPlugins['plugin-name'] = {
  components: {
    Page: MyReactComponent  // Required
  },
  unmount: (container) => {  // Optional but recommended
    // Cleanup code here
  }
}
```

## Hypothesis

The issue might be:
1. **React not respecting key**: The `key={pluginId}` might not be causing remount due to React Router behavior
2. **Component state persisting**: Some state is being cached/memoized somewhere
3. **Plugin not unmounting**: The old plugin's component is not being properly cleaned up
4. **Window global pollution**: The plugin component reference in `window.DAPlugins` might be stale

## To Investigate

Check if the parent component (PagePrototypePlugin/PageModelPlugin) is itself remounting when the route changes. The route path is the same (`/prototype/:id/plugin?plugid=X`), only the query param changes, so React Router might not remount PagePrototypePlugin.

If PagePrototypePlugin doesn't remount, then PluginPageRender won't remount either, even with the key, because the parent is reusing the same instance.

**Possible Solution**: Make PluginPageRender completely independent of the key, and ensure it properly resets ALL state when plugin_id changes internally.
