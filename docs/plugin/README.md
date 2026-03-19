# Plugin System Documentation

Welcome to the digital.auto Plugin System documentation. This guide will help you create, develop, and deploy plugins for the digital.auto Playground.

## Table of Contents

1. [Getting Started](./01-getting-started.md) - Quick introduction and setup
2. [Plugin Architecture](./02-architecture.md) - How the plugin system works
3. [Creating Your First Plugin](./03-creating-plugin.md) - Step-by-step tutorial
4. [Plugin API Reference](./04-api-reference.md) - Complete API documentation
5. [Advanced Topics](./05-advanced.md) - Advanced patterns and best practices
6. [Deployment](./06-deployment.md) - Publishing and hosting your plugin

## Quick Start

```bash
# 1. Copy the sample plugin
cp -r backend/static/plugin/sample-tsx my-plugin

# 2. Edit your plugin
cd my-plugin
# Edit src/components/Page.tsx

# 3. Build the plugin
./build.sh

# 4. Deploy
# Upload index.js to your hosting service
```

## What Can Plugins Do?

Plugins have access to a limited but powerful API that allows them to:

✅ **Update Model/Prototype Data** - Save custom data to models and prototypes

✅ **Read Vehicle APIs** - Access vehicle signal specifications (VSS)

✅ **Manage Runtime Values** - Set and get API values for testing/simulation

✅ **Create Custom Signals** - Define wishlist/extended APIs

✅ **Integrate with Host UI** - Seamlessly render within the digital.auto interface

## Examples

### Update Prototype Name
```typescript
await api.updatePrototype({
  name: 'New Prototype Name'
})
```

### Save Custom Data
```typescript
await api.updateModel({
  extend: {
    myPluginData: {
      lastModified: new Date().toISOString(),
      settings: { theme: 'dark' }
    }
  }
})
```

### Read Vehicle APIs
```typescript
const apis = await api.getComputedAPIs()
const speedAPI = await api.getApiDetail('Vehicle.Speed')
```

### Create Custom Signal
```typescript
await api.createWishlistApi({
  model: model_id,
  apiName: 'Vehicle.MyCustomSignal',
  description: 'My custom vehicle signal',
  type: 'sensor',
  datatype: 'float',
  skeleton: 'Vehicle.MyCustomSignal',
  isWishlist: true
})
```

## Support & Resources

- **Sample Plugin**: Check `backend/static/plugin/sample-tsx` for a working example
- **API Possibilities**: See `PLUGIN_API_POSSIBILITIES.md` for future features
- **Type Definitions**: Located in `frontend/src/types/plugin.types.ts`

## Next Steps

👉 Start with [Getting Started](./01-getting-started.md) to create your first plugin!
