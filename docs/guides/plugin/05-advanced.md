# Advanced Topics

Advanced patterns, best practices, and techniques for building robust plugins.

## Table of Contents

- [State Management Patterns](#state-management-patterns)
- [Performance Optimization](#performance-optimization)
- [Error Handling Strategies](#error-handling-strategies)
- [TypeScript Best Practices](#typescript-best-practices)
- [Testing Plugins](#testing-plugins)
- [Styling Approaches](#styling-approaches)
- [Using External Libraries](#using-external-libraries)
- [Real-time Data Handling](#real-time-data-handling)
- [Plugin Communication Patterns](#plugin-communication-patterns)
- [Security Considerations](#security-considerations)

---

## State Management Patterns

### Local State with useState

For simple, component-local state:

```typescript
export default function Page({ data, api }: PageProps) {
  const [value, setValue] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Use state normally
  return <input value={value} onChange={(e) => setValue(e.target.value)} />
}
```

### Persisting State to Model/Prototype

Store state in the model's `extend` field for persistence:

```typescript
const PluginWithPersistence = ({ data, api }: PageProps) => {
  // Initialize from persisted data
  const [settings, setSettings] = React.useState(
    data?.model?.extend?.myPluginSettings || { theme: 'light', showAdvanced: false }
  );

  // Save to model when settings change
  const saveSettings = async (newSettings: any) => {
    setSettings(newSettings);

    if (api?.updateModel) {
      await api.updateModel({
        extend: {
          ...data?.model?.extend,
          myPluginSettings: newSettings
        }
      });
    }
  };

  return (
    <div>
      <button onClick={() => saveSettings({ ...settings, theme: 'dark' })}>
        Dark Mode
      </button>
    </div>
  );
};
```

### Custom Hook Pattern

Extract reusable state logic into custom hooks:

```typescript
const usePersistedState = (
  key: string,
  initialValue: any,
  data: any,
  api?: PluginAPI
) => {
  const [value, setValue] = React.useState(
    data?.model?.extend?.[key] || initialValue
  );

  const persistValue = React.useCallback(async (newValue: any) => {
    setValue(newValue);

    if (api?.updateModel) {
      try {
        await api.updateModel({
          extend: {
            ...data?.model?.extend,
            [key]: newValue
          }
        });
      } catch (error) {
        console.error(`Failed to persist ${key}:`, error);
      }
    }
  }, [api, data, key]);

  return [value, persistValue] as const;
};

// Usage
const MyPlugin = ({ data, api }: PageProps) => {
  const [settings, setSettings] = usePersistedState(
    'myPluginSettings',
    { theme: 'light' },
    data,
    api
  );

  return <div>Current theme: {settings.theme}</div>;
};
```

### Syncing with Runtime Values

Automatically update when runtime API values change:

```typescript
const useRuntimeValue = (apiPath: string, api?: PluginAPI) => {
  const [value, setValue] = React.useState<any>(null);

  React.useEffect(() => {
    const updateValue = () => {
      if (api?.getRuntimeApiValues) {
        const values = api.getRuntimeApiValues();
        setValue(values[apiPath]);
      }
    };

    // Initial load
    updateValue();

    // Poll for updates
    const interval = setInterval(updateValue, 1000);

    return () => clearInterval(interval);
  }, [apiPath, api]);

  return value;
};

// Usage
const SpeedDisplay = ({ api }: { api?: PluginAPI }) => {
  const speed = useRuntimeValue('Vehicle.Speed', api);

  return <div>Speed: {speed} km/h</div>;
};
```

---

## Performance Optimization

### Memoization

Use `React.useMemo` and `React.useCallback` to prevent unnecessary re-renders:

```typescript
const ExpensiveComponent = ({ data, api }: PageProps) => {
  // Memoize expensive computations
  const processedData = React.useMemo(() => {
    return Object.entries(data?.apis || {})
      .filter(([key, value]) => value.type === 'sensor')
      .map(([key, value]) => ({ key, ...value }));
  }, [data?.apis]);

  // Memoize callbacks
  const handleUpdate = React.useCallback(async () => {
    if (api?.updateModel) {
      await api.updateModel({ /* ... */ });
    }
  }, [api]);

  return <div>{/* Use processedData and handleUpdate */}</div>;
};
```

### Virtualization for Large Lists

When displaying many items, use virtualization:

```typescript
const VirtualizedAPIList = ({ apis }: { apis: any[] }) => {
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 50 });

  const visibleApis = React.useMemo(
    () => apis.slice(visibleRange.start, visibleRange.end),
    [apis, visibleRange]
  );

  return (
    <div style={{ height: '400px', overflowY: 'scroll' }}>
      {visibleApis.map(api => (
        <div key={api.name}>{api.name}</div>
      ))}
    </div>
  );
};
```

### Debouncing API Calls

Prevent excessive API calls when user is typing:

```typescript
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Usage
const SearchPlugin = ({ api }: PageProps) => {
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 500);

  React.useEffect(() => {
    if (debouncedSearch && api?.updateModel) {
      api.updateModel({
        extend: { lastSearch: debouncedSearch }
      });
    }
  }, [debouncedSearch, api]);

  return <input value={search} onChange={(e) => setSearch(e.target.value)} />;
};
```

### Lazy Loading

Load components or data only when needed:

```typescript
const LazyComponent = React.lazy(() => {
  // Simulate dynamic import
  return Promise.resolve({
    default: () => <div>Lazy loaded!</div>
  });
});

const PluginWithLazyLoad = () => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <div>
      <button onClick={() => setShowAdvanced(true)}>
        Show Advanced
      </button>

      {showAdvanced && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </React.Suspense>
      )}
    </div>
  );
};
```

---

## Error Handling Strategies

### Error Boundaries

Catch rendering errors:

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Plugin error:', error, errorInfo);
    // You could log to an error tracking service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h2>⚠️ Something went wrong</h2>
          <details style={{ marginTop: '12px', textAlign: 'left' }}>
            <summary>Error details</summary>
            <pre style={{
              padding: '12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              overflow: 'auto'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '12px', padding: '8px 16px' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
export default function Page(props: PageProps) {
  return (
    <ErrorBoundary>
      <MyPlugin {...props} />
    </ErrorBoundary>
  );
}
```

### Try-Catch with User Feedback

```typescript
const SafeAPICall = ({ api }: { api?: PluginAPI }) => {
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleAction = async () => {
    if (!api?.updateModel) {
      setErrorMessage('API not available');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      await api.updateModel({ name: 'Updated' });
      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error?.message || 'Unknown error occurred');
    }
  };

  return (
    <div>
      <button onClick={handleAction} disabled={status === 'loading'}>
        {status === 'loading' ? 'Loading...' : 'Update'}
      </button>

      {status === 'error' && (
        <div style={{ color: 'red', marginTop: '8px' }}>
          Error: {errorMessage}
        </div>
      )}

      {status === 'success' && (
        <div style={{ color: 'green', marginTop: '8px' }}>
          Success!
        </div>
      )}
    </div>
  );
};
```

### Graceful Degradation

Handle missing APIs gracefully:

```typescript
const RobustPlugin = ({ data, api }: PageProps) => {
  const hasModel = !!data?.model?.id;
  const hasPrototype = !!data?.prototype?.id;
  const canUpdate = !!api?.updateModel;

  if (!hasModel && !hasPrototype) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>ℹ️ No model or prototype data available</p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          This plugin requires a model or prototype context to function.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Model: {data?.model?.name || 'N/A'}</h2>

      {canUpdate ? (
        <button onClick={() => api?.updateModel?.({ name: 'Updated' })}>
          Update Model
        </button>
      ) : (
        <p style={{ color: '#666', fontSize: '14px' }}>
          Update functionality not available in this context
        </p>
      )}
    </div>
  );
};
```

---

## TypeScript Best Practices

### Type-Safe Plugin Props

```typescript
// Define strict types based on your needs
interface ModelData {
  id: string;
  name: string;
  description?: string;
  apis?: Record<string, any>;
  extend?: Record<string, any>;
}

interface PrototypeData {
  id: string;
  name: string;
  code?: string;
  extend?: Record<string, any>;
}

interface StrictPageProps {
  data?: {
    model?: ModelData;
    prototype?: PrototypeData;
  };
  config?: {
    plugin_id?: string;
  };
  api?: PluginAPI;
}

export default function Page({ data, config, api }: StrictPageProps) {
  // TypeScript knows the exact shape of data
  const modelName: string | undefined = data?.model?.name;

  return <div>{modelName}</div>;
}
```

### Type Guards

```typescript
const isValidModel = (data: any): data is { model: ModelData } => {
  return data?.model?.id && typeof data.model.id === 'string';
};

const isValidPrototype = (data: any): data is { prototype: PrototypeData } => {
  return data?.prototype?.id && typeof data.prototype.id === 'string';
};

// Usage
const TypeSafePlugin = ({ data, api }: PageProps) => {
  if (!isValidModel(data)) {
    return <div>Invalid model data</div>;
  }

  // TypeScript now knows data.model exists and has correct shape
  return <div>{data.model.name}</div>;
};
```

### Generic Hooks

```typescript
function useAsyncAPI<T>(
  apiCall: () => Promise<T> | undefined
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      if (result) setData(result);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetch();
  }, []);

  return { data, loading, error, refetch: fetch };
}

// Usage with type inference
const MyPlugin = ({ api }: PageProps) => {
  const { data, loading, error } = useAsyncAPI<string[]>(
    () => api?.listVSSVersions?.()
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Versions: {data?.join(', ')}</div>;
};
```

---

## Testing Plugins

### Manual Testing Checklist

Test your plugin with:
- ✅ No data (null/undefined props)
- ✅ Missing model data
- ✅ Missing prototype data
- ✅ API methods unavailable
- ✅ Network errors
- ✅ Large datasets
- ✅ Slow API responses

### Mock API for Development

```typescript
const createMockAPI = (): PluginAPI => ({
  updateModel: async (updates) => {
    console.log('Mock updateModel:', updates);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { id: 'mock-model', ...updates };
  },

  updatePrototype: async (updates) => {
    console.log('Mock updatePrototype:', updates);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { id: 'mock-prototype', ...updates };
  },

  getRuntimeApiValues: () => ({
    'Vehicle.Speed': Math.random() * 120,
    'Vehicle.EngineRPM': Math.random() * 6000,
  }),

  setRuntimeApiValues: (values) => {
    console.log('Mock setRuntimeApiValues:', values);
  },

  // ... other methods
});

// Use in development
const Page = (props: PageProps) => {
  const isDevelopment = !props.api;
  const api = isDevelopment ? createMockAPI() : props.api;

  return <MyPlugin {...props} api={api} />;
};
```

### Test Different Contexts

```typescript
// Create test harness
const TestHarness = () => {
  const [scenario, setScenario] = React.useState<'full' | 'model-only' | 'prototype-only' | 'empty'>('full');

  const mockData = {
    full: {
      model: { id: 'model-1', name: 'Test Model' },
      prototype: { id: 'proto-1', name: 'Test Prototype' }
    },
    'model-only': {
      model: { id: 'model-1', name: 'Test Model' }
    },
    'prototype-only': {
      prototype: { id: 'proto-1', name: 'Test Prototype' }
    },
    empty: {}
  };

  return (
    <div>
      <select onChange={(e) => setScenario(e.target.value as any)}>
        <option value="full">Full Data</option>
        <option value="model-only">Model Only</option>
        <option value="prototype-only">Prototype Only</option>
        <option value="empty">Empty</option>
      </select>

      <Page data={mockData[scenario]} api={createMockAPI()} />
    </div>
  );
};
```

---

## Styling Approaches

### Inline Styles (Recommended for Simple Plugins)

```typescript
const styles = {
  container: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  card: {
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    marginBottom: '16px'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

const Page = () => (
  <div style={styles.container}>
    <div style={styles.card}>
      <button style={styles.button}>Click</button>
    </div>
  </div>
);
```

### CSS-in-JS (Emotion/Styled-Components)

If you bundle a CSS-in-JS library:

```typescript
// Install: npm install @emotion/css
import { css } from '@emotion/css';

const containerClass = css`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const Page = () => (
  <div className={containerClass}>
    Content
  </div>
);
```

### Tailwind CSS (if bundled)

```typescript
// If you include Tailwind in your build
const Page = () => (
  <div className="p-6 max-w-4xl mx-auto">
    <div className="bg-gray-100 rounded-lg p-4">
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Click
      </button>
    </div>
  </div>
);
```

---

## Using External Libraries

### Bundled Libraries

To use external libraries, install and import them:

```bash
npm install dayjs chart.js
```

```typescript
import dayjs from 'dayjs';

const Page = () => {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

  return <div>Current time: {now}</div>;
};
```

The library will be bundled into your plugin.

### Using Host Libraries (Advanced)

If the host application includes a library, you can externalize it:

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom', 'dayjs'], // Don't bundle dayjs
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          dayjs: 'dayjs' // Assume host provides it
        }
      }
    }
  }
})
```

```bash
# build.sh
EXTERNAL_PACKAGES="react,react-dom,react-dom/client,react/jsx-runtime,dayjs"
```

Then use require:

```typescript
const dayjs = require('dayjs');
```

---

## Real-time Data Handling

### Polling Pattern

```typescript
const usePolling = <T,>(
  fetchFn: () => T,
  interval: number
): T => {
  const [data, setData] = React.useState<T>(fetchFn());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setData(fetchFn());
    }, interval);

    return () => clearInterval(timer);
  }, [fetchFn, interval]);

  return data;
};

// Usage
const LiveDashboard = ({ api }: PageProps) => {
  const runtimeValues = usePolling(
    () => api?.getRuntimeApiValues?.() || {},
    1000 // Update every second
  );

  return <div>Speed: {runtimeValues['Vehicle.Speed']}</div>;
};
```

### Throttling Updates

```typescript
const useThrottle = <T,>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = React.useState(value);
  const lastRan = React.useRef(Date.now());

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => clearTimeout(handler);
  }, [value, limit]);

  return throttledValue;
};
```

---

## Plugin Communication Patterns

### Using Model Extend Field

Plugins can communicate via the model's extend field:

```typescript
// Plugin A writes
await api.updateModel({
  extend: {
    ...data?.model?.extend,
    pluginA: { message: 'Hello from A' }
  }
});

// Plugin B reads
const messageFromA = data?.model?.extend?.pluginA?.message;
```

### Custom Events (Advanced)

```typescript
// Plugin A dispatches event
window.dispatchEvent(new CustomEvent('plugin:data-updated', {
  detail: { source: 'pluginA', data: { value: 42 } }
}));

// Plugin B listens
React.useEffect(() => {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent;
    console.log('Received:', customEvent.detail);
  };

  window.addEventListener('plugin:data-updated', handler);
  return () => window.removeEventListener('plugin:data-updated', handler);
}, []);
```

---

## Security Considerations

### Input Validation

Always validate user input:

```typescript
const validateInput = (input: string): boolean => {
  // Check length
  if (input.length > 100) return false;

  // Check for malicious content
  if (/<script|javascript:/i.test(input)) return false;

  return true;
};

const handleSubmit = async (input: string) => {
  if (!validateInput(input)) {
    alert('Invalid input');
    return;
  }

  await api?.updateModel({ name: input });
};
```

### Sanitize Output

```typescript
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Usage
<div dangerouslySetInnerHTML={{ __html: escapeHtml(userInput) }} />
```

### Avoid eval()

Never use `eval()` or `Function()` constructor with user input.

---

## Next Steps

- 📚 Review [API Reference](./04-api-reference.md)
- 🚀 Learn about [Deployment](./06-deployment.md)
- 💡 Study sample plugin: `backend/static/plugin/sample-tsx`
