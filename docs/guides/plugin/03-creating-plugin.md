# Creating Your First Plugin

This hands-on tutorial will guide you through creating a complete plugin from scratch. We'll build a **Vehicle Dashboard** plugin that displays vehicle data and allows editing prototype names.

## What We'll Build

A plugin that:
- ✅ Displays current prototype information
- ✅ Shows vehicle API runtime values
- ✅ Allows editing the prototype name
- ✅ Visualizes vehicle speed
- ✅ Demonstrates all core API patterns

## Prerequisites

- Node.js 16+ installed
- Basic React knowledge
- Text editor (VS Code recommended)
- Terminal/command line access

## Step 1: Project Setup

### Create Plugin Directory

```bash
# Navigate to plugins directory
cd backend/static/plugin

# Create your plugin directory
mkdir vehicle-dashboard
cd vehicle-dashboard

# Initialize npm project
npm init -y
```

### Install Dependencies

```bash
# Install React
npm install react react-dom

# Install development dependencies
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
```

### Create Directory Structure

```bash
mkdir -p src/components
touch src/index.tsx
touch src/components/Page.tsx
touch vite.config.js
touch tsconfig.json
touch build.sh
```

Your structure should look like:
```
vehicle-dashboard/
├── src/
│   ├── components/
│   │   └── Page.tsx
│   └── index.tsx
├── build.sh
├── package.json
├── tsconfig.json
└── vite.config.js
```

## Step 2: Configuration Files

### `tsconfig.json`

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

### `vite.config.js`

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

### `build.sh`

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

Make it executable:
```bash
chmod +x build.sh
```

### Update `package.json`

Add scripts:
```json
{
  "name": "vehicle-dashboard",
  "version": "1.0.0",
  "scripts": {
    "build": "./build.sh",
    "dev": "vite build --watch"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

## Step 3: Create the Plugin Component

### `src/components/Page.tsx`

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const React: any = (globalThis as any).React;

/**
 * Plugin API provided by the host application
 */
type PluginAPI = {
  // Model & Prototype Updates
  updateModel?: (updates: any) => Promise<any>;
  updatePrototype?: (updates: any) => Promise<any>;

  // Vehicle API Operations (Read)
  getComputedAPIs?: (model_id?: string) => Promise<any>;
  getApiDetail?: (api_name: string, model_id?: string) => Promise<any>;
  listVSSVersions?: () => Promise<string[]>;

  // Vehicle API Operations (Write)
  replaceAPIs?: (api_data_url: string, model_id?: string) => Promise<void>;
  setRuntimeApiValues?: (values: Record<string, any>) => void;
  getRuntimeApiValues?: () => Record<string, any>;

  // Wishlist API Operations
  createWishlistApi?: (data: any) => Promise<any>;
  updateWishlistApi?: (id: string, data: any) => Promise<any>;
  deleteWishlistApi?: (id: string) => Promise<void>;
  getWishlistApi?: (name: string, model_id?: string) => Promise<any>;
  listWishlistApis?: (model_id?: string) => Promise<any>;
};

type PageProps = {
  data?: any;
  config?: any;
  api?: PluginAPI;
};

export default function Page({ data, config, api }: PageProps) {
  // State management
  const [prototypeName, setPrototypeName] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [runtimeValues, setRuntimeValues] = React.useState<Record<string, any>>({});

  // Initialize prototype name from data
  React.useEffect(() => {
    if (data?.prototype?.name) {
      setPrototypeName(data.prototype.name);
    }
  }, [data?.prototype?.name]);

  // Update runtime values periodically
  React.useEffect(() => {
    const updateRuntimeValues = () => {
      if (api?.getRuntimeApiValues) {
        const values = api.getRuntimeApiValues();
        setRuntimeValues(values);
      }
    };

    // Initial load
    updateRuntimeValues();

    // Update every second
    const interval = setInterval(updateRuntimeValues, 1000);

    return () => clearInterval(interval);
  }, [api]);

  // Handle prototype name update
  const handleUpdateName = async () => {
    if (!api?.updatePrototype) {
      alert('updatePrototype API not available');
      return;
    }

    if (!prototypeName.trim()) {
      alert('Please enter a valid name');
      return;
    }

    setIsSaving(true);
    try {
      await api.updatePrototype({ name: prototypeName });
      alert('Prototype name updated successfully!');
    } catch (error: any) {
      console.error('Failed to update name:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get speed value
  const speed = runtimeValues['Vehicle.Speed'] || 0;

  return (
    <div style={{
      minHeight: '100vh',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#333'
        }}>
          Vehicle Dashboard
        </h1>
        <p style={{
          margin: '0 0 24px 0',
          color: '#666',
          fontSize: '14px'
        }}>
          Monitor and manage your vehicle prototype
        </p>

        {/* Prototype Info Section */}
        <div style={{
          padding: '16px',
          backgroundColor: '#f9f9f9',
          borderRadius: '6px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: '0 0 12px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#333'
          }}>
            Prototype Information
          </h2>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              <strong>ID:</strong> {data?.prototype?.id || 'N/A'}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              <strong>Current Name:</strong> {data?.prototype?.name || 'N/A'}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <strong>Model:</strong> {data?.model?.name || 'N/A'}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#333'
            }}>
              Update Prototype Name:
            </label>
            <input
              type="text"
              value={prototypeName}
              onChange={(e) => setPrototypeName(e.target.value)}
              placeholder="Enter new name..."
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '8px',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={handleUpdateName}
              disabled={isSaving || !api?.updatePrototype || !prototypeName.trim()}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                backgroundColor: isSaving ? '#ccc' : '#0066cc',
                border: 'none',
                borderRadius: '4px',
                cursor: isSaving ? 'not-allowed' : 'pointer'
              }}
            >
              {isSaving ? 'Updating...' : 'Update Name'}
            </button>
          </div>
        </div>

        {/* Speed Display */}
        <div style={{
          padding: '24px',
          backgroundColor: '#0066cc',
          borderRadius: '6px',
          marginBottom: '24px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>
            Current Speed
          </div>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
            {typeof speed === 'number' ? speed.toFixed(1) : speed}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            km/h
          </div>
        </div>

        {/* Runtime Values */}
        <div style={{
          padding: '16px',
          backgroundColor: '#f9f9f9',
          borderRadius: '6px'
        }}>
          <h2 style={{
            margin: '0 0 12px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#333'
          }}>
            Runtime API Values
          </h2>

          {Object.keys(runtimeValues).length === 0 ? (
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              No runtime values available
            </p>
          ) : (
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {Object.entries(runtimeValues).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid #e5e5e5',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ fontWeight: '500', color: '#333', marginBottom: '2px' }}>
                    {key}
                  </div>
                  <div style={{ color: '#666', fontFamily: 'monospace' }}>
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          backgroundColor: '#f9f9f9',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center'
        }}>
          📊 Vehicle Dashboard Plugin • Built with digital.auto Plugin API
        </div>
      </div>
    </div>
  );
}
```

### `src/index.tsx`

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

console.log('Vehicle Dashboard plugin registered');
```

## Step 4: Build the Plugin

```bash
# Install dependencies
yarn install

# Build the plugin
./build.sh
```

You should see:
```
Installing plugin dependencies...
Built plugin to /path/to/vehicle-dashboard/index.js

  index.js      X.Xkb
  index.js.map  X.Xkb

⚡ Done in Xms
```

## Step 5: Test Locally

### Option 1: Use a Local Server

```bash
# In your plugin directory
npx serve .

# Plugin available at:
# http://localhost:3000/index.js
```

### Option 2: Use Python's HTTP Server

```bash
# Python 3
python3 -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000

# Plugin available at:
# http://localhost:3000/index.js
```

## Step 6: Register Plugin in digital.auto

1. **Access Admin Panel**
   - Navigate to the plugin management page
   - (URL depends on your deployment)

2. **Create Plugin Entry**
   - Click "Add Plugin" or similar
   - Fill in details:
     - **Name**: Vehicle Dashboard
     - **Slug**: `vehicle-dashboard`
     - **URL**: `http://localhost:3000/index.js`
   - Save

3. **Test the Plugin**
   - Navigate to a prototype page
   - Load your plugin
   - You should see the Vehicle Dashboard

## Step 7: Enhancements

Now that you have a working plugin, let's add more features:

### Add Custom Styling with Tailwind-like Utilities

```typescript
// Add to your component
const styles = {
  button: {
    primary: {
      padding: '8px 16px',
      backgroundColor: '#0066cc',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    },
    secondary: {
      padding: '8px 16px',
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    }
  },
  card: {
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    marginBottom: '16px'
  }
};

// Use in component
<button style={styles.button.primary}>
  Click Me
</button>
```

### Add API Value Controls

```typescript
const SimulationControls = ({ api }: { api?: PluginAPI }) => {
  const [speed, setSpeed] = React.useState(0);

  const handleSetSpeed = () => {
    if (api?.setRuntimeApiValues) {
      api.setRuntimeApiValues({
        'Vehicle.Speed': speed
      });
    }
  };

  return (
    <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
      <h3>Simulation Controls</h3>
      <input
        type="number"
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
        placeholder="Speed (km/h)"
        style={{ padding: '8px', marginRight: '8px' }}
      />
      <button onClick={handleSetSpeed} style={{ padding: '8px 16px' }}>
        Set Speed
      </button>
    </div>
  );
};

// Add to main component
<SimulationControls api={api} />
```

### Add Error Boundaries

```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap your component
export default function Page(props: PageProps) {
  return (
    <ErrorBoundary>
      <VehicleDashboard {...props} />
    </ErrorBoundary>
  );
}
```

## Step 8: Deploy to Production

### Option 1: GitHub Pages

1. Create a GitHub repository
2. Push your plugin code
3. Enable GitHub Pages in repository settings
4. Your plugin will be at: `https://username.github.io/repo-name/index.js`

### Option 2: Netlify/Vercel

1. Create account on Netlify or Vercel
2. Connect your GitHub repo
3. Deploy
4. Your plugin will be at: `https://your-app.netlify.app/index.js`

### Option 3: CDN

1. Upload `index.js` to a CDN (Cloudflare, AWS S3, etc.)
2. Get the public URL
3. Use that URL in plugin registration

### Update Plugin URL

Once deployed, update the plugin URL in the admin panel to the production URL.

## Troubleshooting

### Plugin doesn't load
- ✅ Check browser console for errors
- ✅ Verify URL is accessible (open in browser)
- ✅ Ensure CORS headers are correct
- ✅ Check that plugin registers on `window.DAPlugins['page-plugin']`

### Build fails
- ✅ Run `yarn install` to ensure dependencies are installed
- ✅ Check Node.js version (16+)
- ✅ Verify `build.sh` has execute permissions
- ✅ Review build errors in console

### Runtime errors
- ✅ Check browser console for errors
- ✅ Ensure you're using `(globalThis as any).React`
- ✅ Use optional chaining for data access: `data?.model?.id`
- ✅ Check API method availability before calling

## Next Steps

🎉 Congratulations! You've built your first plugin!

Now you can:
- 📚 Explore the [API Reference](./04-api-reference.md) for all available methods
- 🏗️ Learn about [Plugin Architecture](./02-architecture.md)
- 🚀 Check out [Advanced Topics](./05-advanced.md) for best practices
- 💡 Study the sample plugin in `backend/static/plugin/sample-tsx`

## Additional Resources

- **Sample Plugin**: `backend/static/plugin/sample-tsx`
- **Type Definitions**: `frontend/src/types/plugin.types.ts`
- **API Possibilities**: `PLUGIN_API_POSSIBILITIES.md`
- **VSS Specification**: https://covesa.github.io/vehicle_signal_specification/
