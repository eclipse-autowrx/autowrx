# Debug Guide: Plugin Switching Shows Wrong Content

## The Problem

When switching between plugin tabs (e.g., `test01` → `external`), the UI shows the wrong plugin content even though the logs show the correct plugin was loaded.

## Root Cause Analysis

Based on the logs you provided earlier, here's what's happening:

### Evidence from Logs

```
[plugin-render:test01] Plugin URL: /plugin/sample-tsx/index.js
[plugin-render:test01] Using first available plugin: sample-tsx
[plugin-render:test01] Plugin ready to render: sample-tsx for requested plugin_id: test01

[plugin-render:external] Plugin URL: http://127.0.0.1:4000/index.js
[plugin-render:external] Using first available plugin: sample-tsx
[plugin-render:external] Plugin ready to render: sample-tsx for requested plugin_id: external
```

**The Issue**: Both plugins are using the same component (`sample-tsx`)!

## Why This Happens

There are two possible scenarios:

### Scenario 1: Wrong Plugin Configuration (Most Likely)
Your `test01` plugin is configured to load from `/plugin/sample-tsx/index.js`, which is the sample plugin's script. This means:
- `test01` loads the sample-tsx script
- `external` also ends up loading sample-tsx (probably from the same origin)
- Both render the same component

### Scenario 2: Script Overwrites Previous Registration
If both scripts register with the same key in `window.DAPlugins`, the second one overwrites the first.

## How to Debug This Issue

### Step 1: Check Plugin API Response

Run this in your browser console to see what URLs are configured:

```javascript
// Fetch all plugins
fetch('http://localhost:9800/api/v1/plugins?page=1&limit=100')
  .then(r => r.json())
  .then(data => {
    console.table(data.results.map(p => ({
      slug: p.slug,
      name: p.name,
      url: p.url
    })))
  })
```

**Expected Output**: Each plugin should have a UNIQUE URL
```
slug      | name     | url
----------|----------|----------------------------------
test01    | Test01   | /plugin/test01/index.js         ✓ Unique
external  | External | http://127.0.0.1:4000/index.js  ✓ Unique
```

**Problem Output**: Multiple plugins point to same URL
```
slug      | name     | url
----------|----------|----------------------------------
test01    | Test01   | /plugin/sample-tsx/index.js     ✗ Wrong!
external  | External | /plugin/sample-tsx/index.js     ✗ Wrong!
```

### Step 2: Check window.DAPlugins Registration

After a plugin loads, check what's registered:

```javascript
// Check what plugins are registered
console.log('Registered plugins:', Object.keys(window.DAPlugins || {}))

// Check each plugin's details
Object.entries(window.DAPlugins || {}).forEach(([name, plugin]) => {
  console.log(`Plugin "${name}":`, {
    hasPageComponent: !!plugin.components?.Page,
    hasUnmount: !!plugin.unmount
  })
})
```

**Expected Output**: Multiple unique plugin names
```
Registered plugins: ['test01', 'external']
Plugin "test01": { hasPageComponent: true, hasUnmount: true }
Plugin "external": { hasPageComponent: true, hasUnmount: true }
```

**Problem Output**: Only one plugin name
```
Registered plugins: ['sample-tsx']
Plugin "sample-tsx": { hasPageComponent: true, hasUnmount: true }
```

### Step 3: Inspect Script Tags

Check which scripts are loaded:

```javascript
// Find all plugin script tags
const scripts = Array.from(document.querySelectorAll('script[data-aw-plugin]'))
console.table(scripts.map(s => ({
  url: s.dataset.awPlugin,
  loaded: s.src
})))
```

This will show you which plugin scripts are actually in the DOM.

## Solutions

### Solution 1: Fix Plugin Configuration in Database

If your plugins are stored in a database, you need to update the `url` field for each plugin to point to a unique script.

**Example SQL (if using PostgreSQL/MySQL):**
```sql
-- Update test01 to use its own script
UPDATE plugins
SET url = '/plugin/test01/index.js'
WHERE slug = 'test01';

-- Update external to use its own script
UPDATE plugins
SET url = 'http://127.0.0.1:4000/index.js'
WHERE slug = 'external';
```

**Example using API (if you have an update endpoint):**
```javascript
// Update test01 plugin
fetch('http://localhost:9800/api/v1/plugins/test01', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: '/plugin/test01/index.js'
  })
})

// Update external plugin
fetch('http://localhost:9800/api/v1/plugins/external', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'http://127.0.0.1:4000/index.js'
  })
})
```

### Solution 2: Create Unique Plugin Scripts

Each plugin needs its own JavaScript file that registers with a unique name.

**File: `/plugin/test01/index.js`**
```javascript
// Test01 Plugin
(function() {
  console.log('[test01] Initializing plugin')

  // Your plugin component
  const Test01Page = ({ data, config }) => {
    return React.createElement('div', { className: 'p-4' },
      React.createElement('h1', null, 'Test01 Plugin'),
      React.createElement('p', null, 'This is the Test01 plugin content'),
      React.createElement('pre', null, JSON.stringify(data, null, 2))
    )
  }

  // Register plugin with UNIQUE name
  window.DAPlugins = window.DAPlugins || {}
  window.DAPlugins['test01'] = {
    components: {
      Page: Test01Page
    },
    unmount: (container) => {
      console.log('[test01] Unmounting')
      // Cleanup code here
    }
  }

  console.log('[test01] Plugin registered')
})()
```

**File: `/plugin/external/index.js`** (or `http://127.0.0.1:4000/index.js`)
```javascript
// External Plugin
(function() {
  console.log('[external] Initializing plugin')

  // Your plugin component
  const ExternalPage = ({ data, config }) => {
    return React.createElement('div', { className: 'p-4' },
      React.createElement('h1', null, 'External Plugin'),
      React.createElement('p', null, 'This is the External plugin content'),
      React.createElement('pre', null, JSON.stringify(data, null, 2))
    )
  }

  // Register plugin with UNIQUE name
  window.DAPlugins = window.DAPlugins || {}
  window.DAPlugins['external'] = {
    components: {
      Page: ExternalPage
    },
    unmount: (container) => {
      console.log('[external] Unmounting')
      // Cleanup code here
    }
  }

  console.log('[external] Plugin registered')
})()
```

### Solution 3: Temporary Workaround (Not Recommended)

If you can't fix the plugin configuration immediately, you can make the same component show different content based on the `config.plugin_id` passed to it.

**In your plugin script:**
```javascript
const UniversalPage = ({ data, config }) => {
  // Use config.plugin_id to determine what to show
  if (config.plugin_id === 'test01') {
    return <div>Test01 Content</div>
  } else if (config.plugin_id === 'external') {
    return <div>External Content</div>
  }
  return <div>Unknown Plugin: {config.plugin_id}</div>
}
```

But this is a hack - you should really have separate plugins with separate scripts.

## Verification Steps

After fixing the configuration:

1. **Clear browser cache** (or hard reload with Ctrl+Shift+R / Cmd+Shift+R)
2. **Reload the page**
3. **Click on plugin tab A** - check console logs:
   ```
   [plugin-render:test01] Plugin ready to render: test01 for requested plugin_id: test01
   [plugin-render:test01] Rendering plugin: test01 for requested: test01
   ```
4. **Click on plugin tab B** - check console logs:
   ```
   [plugin-render:test01] Component will unmount for plugin: test01
   [plugin-render:external] Component mounted/remounted for plugin: external
   [plugin-render:external] Plugin ready to render: external for requested plugin_id: external
   [plugin-render:external] Rendering plugin: external for requested: external
   ```

**Success indicators:**
- ✓ Different plugin names in logs when switching tabs
- ✓ Different content displayed for each tab
- ✓ Console shows unmount for old plugin and mount for new plugin

## Common Mistakes

1. **Forgetting to clear cache** - Old scripts may be cached
2. **Using relative URLs wrong** - `/plugin/x/index.js` vs `plugin/x/index.js`
3. **Same registration name** - Two scripts both do `window.DAPlugins['sample-tsx'] = ...`
4. **Missing script files** - URL points to non-existent file

## Need More Help?

If you've checked all of the above and it's still not working:

1. Share the output of the plugin API check (Step 1)
2. Share the output of window.DAPlugins check (Step 2)
3. Share the full console logs when switching between tabs
4. Share your plugin script files if you created custom ones
