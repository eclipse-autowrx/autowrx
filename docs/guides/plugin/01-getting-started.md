# Getting Started with Plugins

This guide will help you understand the basics of the digital.auto plugin system and create your first plugin.

## What is a Plugin?

A plugin is a **standalone React component** that can be dynamically loaded into the digital.auto Playground. Plugins allow you to:

- Create custom visualizations for vehicle data
- Build specialized tools for prototype development
- Extend the platform with domain-specific functionality
- Integrate third-party libraries and services

## Prerequisites

Before creating a plugin, you should be familiar with:

- **React** (especially hooks like `useState`, `useEffect`)
- **TypeScript** (basic type annotations)
- **JavaScript bundling** (basic understanding of build tools)

## Installation

### Option 1: Use the Sample Plugin Template

The easiest way to start is by copying the sample plugin:

```bash
# Navigate to the plugins directory
cd backend/static/plugin

# Copy the sample plugin
cp -r sample-tsx my-first-plugin

# Enter your plugin directory
cd my-first-plugin

# Build the plugin
./build.sh
```

### Option 2: Create from Scratch

If you want to start from scratch:

```bash
# Create plugin directory
mkdir my-first-plugin
cd my-first-plugin

# Initialize npm
npm init -y

# Install dependencies
npm install react react-dom

# Install build tools
npm install -D vite @vitejs/plugin-react typescript
```

## Project Structure

A typical plugin has this structure:

```
my-plugin/
├── src/
│   ├── components/
│   │   └── Page.tsx          # Main plugin component
│   └── index.tsx              # Entry point
├── build.sh                   # Build script
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
└── vite.config.js             # Vite bundler config
```

## Your First Plugin

Let's create a simple "Hello World" plugin:

### 1. Create `src/components/Page.tsx`

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const React: any = (globalThis as any).React;

type PluginAPI = {
  updateModel?: (updates: any) => Promise<any>;
  updatePrototype?: (updates: any) => Promise<any>;
  // ... other API methods
};

type PageProps = {
  data?: any;
  config?: any;
  api?: PluginAPI;
};

export default function Page({ data, config, api }: PageProps) {
  const [message, setMessage] = React.useState('Hello, World!');

  return (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h1>{message}</h1>
      <p>Model ID: {data?.model?.id || 'N/A'}</p>
      <p>Prototype ID: {data?.prototype?.id || 'N/A'}</p>

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ padding: '8px', fontSize: '16px' }}
      />
    </div>
  );
}
```

### 2. Create `src/index.tsx`

```typescript
import Page from './components/Page';

// Register plugin globally
if (!(window as any).DAPlugins) {
  (window as any).DAPlugins = {};
}

(window as any).DAPlugins['page-plugin'] = {
  components: {
    Page
  }
};
```

### 3. Create `build.sh`

```bash
#!/bin/bash
set -e

echo "Installing plugin dependencies..."
yarn install --silent

EXTERNAL_PACKAGES="react,react-dom,react-dom/client,react/jsx-runtime"

echo "Built plugin to $(pwd)/index.js"
yarn vite build \
  --config vite.config.js \
  --external $EXTERNAL_PACKAGES
```

### 4. Create `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: './src/index.tsx',
      formats: ['iife'],
      name: 'DAPlugin',
      fileName: () => 'index.js'
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-dom/client': 'ReactDOMClient',
          'react/jsx-runtime': 'jsxRuntime'
        }
      }
    },
    outDir: '.',
    emptyOutDir: false,
    sourcemap: true
  }
})
```

### 5. Create `package.json`

```json
{
  "name": "my-first-plugin",
  "version": "1.0.0",
  "scripts": {
    "build": "./build.sh"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### 6. Create `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

## Building Your Plugin

Make the build script executable and run it:

```bash
chmod +x build.sh
./build.sh
```

This will generate `index.js` - your compiled plugin.

## Testing Your Plugin

### 1. Host the Plugin

You need to host your plugin file somewhere accessible via HTTP/HTTPS. Options include:

- **Local development**: Use a simple HTTP server
  ```bash
  npx serve .
  # Plugin available at http://localhost:3000/index.js
  ```

- **GitHub Pages**: Push to a repo and enable GitHub Pages
- **CDN**: Upload to a CDN like Cloudflare, Netlify, or Vercel
- **Your own server**: Host on your infrastructure

### 2. Register the Plugin in digital.auto

In the digital.auto admin interface:

1. Navigate to the plugin management page
2. Create a new plugin entry
3. Provide:
   - **Name**: "My First Plugin"
   - **Slug**: `my-first-plugin`
   - **URL**: `https://your-host.com/index.js`
4. Save the plugin

### 3. Use the Plugin

You can now use your plugin in the playground by referencing it with the slug `my-first-plugin`.

## What's Next?

Now that you have a basic plugin working:

- 📖 Learn about [Plugin Architecture](./02-architecture.md)
- 🛠️ Follow the [Creating Your First Plugin](./03-creating-plugin.md) tutorial
- 📚 Explore the [Plugin API Reference](./04-api-reference.md)
- 🚀 Check out [Advanced Topics](./05-advanced.md)

## Troubleshooting

### Plugin doesn't load

1. Check browser console for errors
2. Verify the plugin URL is accessible (try opening it directly)
3. Ensure the plugin registers on `window.DAPlugins['page-plugin']`
4. Check that React is available globally

### Build errors

1. Make sure all dependencies are installed: `yarn install`
2. Check that Node.js version is 16+
3. Verify `build.sh` has execute permissions: `chmod +x build.sh`

### Plugin loads but crashes

1. Check browser console for runtime errors
2. Verify you're using `(globalThis as any).React` instead of importing React
3. Ensure all required props are handled gracefully (use `?.` optional chaining)

## Common Pitfalls

❌ **Don't import React** - Use the global instance instead:
```typescript
// ❌ Wrong
import React from 'react'

// ✅ Correct
const React: any = (globalThis as any).React;
```

❌ **Don't assume data exists** - Always use optional chaining:
```typescript
// ❌ Wrong
const modelId = data.model.id

// ✅ Correct
const modelId = data?.model?.id
```

❌ **Don't use external packages without configuration** - They need to be bundled or externalized:
```typescript
// If using an npm package, either:
// 1. Bundle it (default)
// 2. Add to EXTERNAL_PACKAGES in build.sh (if available in host)
```

## Support

If you need help:

- Check the sample plugin: `backend/static/plugin/sample-tsx`
- Review the [API Reference](./04-api-reference.md)
- Look at type definitions: `frontend/src/types/plugin.types.ts`
