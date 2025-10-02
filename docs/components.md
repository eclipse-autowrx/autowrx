# Components

## Component Architecture

AutoWRX follows the **Atomic Design** methodology, organizing components into a hierarchical structure that promotes reusability and maintainability.

## Atomic Design Structure

### Atoms (`src/components/atoms/`)

Basic building blocks that can't be broken down further. These are the smallest functional units.

#### UI Elements

##### DaButton (`src/components/atoms/DaButton.tsx`)
**Purpose**: Primary button component with multiple variants
**Props**:
```typescript
interface DaButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
}
```

**Usage**:
```typescript
<DaButton variant="primary" size="md" onClick={handleClick}>
  Click Me
</DaButton>
```

##### DaInput (`src/components/atoms/DaInput.tsx`)
**Purpose**: Text input component with validation
**Props**:
```typescript
interface DaInputProps {
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  disabled?: boolean
  required?: boolean
}
```

##### DaSelect (`src/components/atoms/DaSelect.tsx`)
**Purpose**: Dropdown select component
**Props**:
```typescript
interface DaSelectProps {
  options: { value: string; label: string }[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}
```

#### Display Components

##### DaText (`src/components/atoms/DaText.tsx`)
**Purpose**: Typography component with consistent styling
**Props**:
```typescript
interface DaTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption'
  color?: 'primary' | 'secondary' | 'muted' | 'error'
  children: React.ReactNode
}
```

##### DaImage (`src/components/atoms/DaImage.tsx`)
**Purpose**: Image component with lazy loading
**Props**:
```typescript
interface DaImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
}
```

##### DaAvatar (`src/components/atoms/DaAvatar.tsx`)
**Purpose**: User avatar component
**Props**:
```typescript
interface DaAvatarProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  fallback?: string
}
```

#### Navigation Components

##### DaBreadcrumb (`src/components/atoms/DaBreadcrumb.tsx`)
**Purpose**: Breadcrumb navigation component
**Props**:
```typescript
interface DaBreadcrumbProps {
  items: { label: string; href?: string }[]
  separator?: string
}
```

##### DaMenu (`src/components/atoms/DaMenu.tsx`)
**Purpose**: Menu component with dropdown functionality
**Props**:
```typescript
interface DaMenuProps {
  items: MenuItem[]
  trigger: React.ReactNode
  align?: 'start' | 'center' | 'end'
}
```

#### Feedback Components

##### DaLoading (`src/components/atoms/DaLoading.tsx`)
**Purpose**: Loading spinner component
**Props**:
```typescript
interface DaLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary'
  text?: string
}
```

##### DaSkeleton (`src/components/atoms/DaSkeleton.tsx`)
**Purpose**: Skeleton loading component
**Props**:
```typescript
interface DaSkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
}
```

#### Form Components

##### DaCheckbox (`src/components/atoms/DaCheckbox.tsx`)
**Purpose**: Checkbox input component
**Props**:
```typescript
interface DaCheckboxProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: string
  disabled?: boolean
}
```

##### DaTextarea (`src/components/atoms/DaTextarea.tsx`)
**Purpose**: Multi-line text input
**Props**:
```typescript
interface DaTextareaProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
}
```

##### DaFileUpload (`src/components/atoms/DaFileUpload.tsx`)
**Purpose**: File upload component
**Props**:
```typescript
interface DaFileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  multiple?: boolean
  maxSize?: number
}
```

### Molecules (`src/components/molecules/`)

Simple combinations of atoms that work together as a unit.

#### Dashboard Components

##### DaDashboard (`src/components/molecules/dashboard/DaDashboard.tsx`)
**Purpose**: Main dashboard container
**Features**:
- Widget grid layout
- Drag and drop functionality
- Responsive design
- Widget management

##### DaDashboardEditor (`src/components/molecules/dashboard/DaDashboardEditor.tsx`)
**Purpose**: Dashboard editing interface
**Features**:
- Widget configuration
- Layout customization
- Real-time preview
- Save/load functionality

#### Form Components

##### FormCreateModel (`src/components/molecules/forms/FormCreateModel.tsx`)
**Purpose**: Model creation form
**Features**:
- Multi-step form
- Validation
- File upload
- Preview generation

##### FormCreateDiscussion (`src/components/molecules/forms/FormCreateDiscussion.tsx`)
**Purpose**: Discussion creation form
**Features**:
- Rich text editor
- Tag selection
- Category assignment
- Preview mode

#### Widget Components

##### DaWidgetLibrary (`src/components/molecules/widgets/DaWidgetLibrary.tsx`)
**Purpose**: Widget library browser
**Features**:
- Widget categories
- Search and filtering
- Preview functionality
- Installation process

##### DaWidgetList (`src/components/molecules/widgets/DaWidgetList.tsx`)
**Purpose**: Widget list display
**Features**:
- Grid/list view
- Sorting options
- Bulk actions
- Status indicators

#### Specialized Components

##### ChatBox (`src/components/molecules/ChatBox.tsx`)
**Purpose**: Real-time chat interface
**Features**:
- Message history
- Real-time updates
- File sharing
- User presence

##### CodeEditor (`src/components/molecules/CodeEditor.tsx`)
**Purpose**: Code editing interface
**Features**:
- Syntax highlighting
- Auto-completion
- Error detection
- Multiple language support

### Organisms (`src/components/organisms/`)

Complex UI components that combine molecules and atoms to form complete sections.

#### Page Components

##### PageHome (`src/components/organisms/PageHome.tsx`)
**Purpose**: Home page organism
**Features**:
- Welcome section
- Quick actions
- Recent items
- Statistics overview

##### PageModelList (`src/components/organisms/PageModelList.tsx`)
**Purpose**: Model list page
**Features**:
- Search and filtering
- Grid/list view
- Bulk operations
- Category navigation

#### Feature Components

##### ApiDetail (`src/components/organisms/ApiDetail.tsx`)
**Purpose**: API detail view
**Features**:
- API documentation
- Testing interface
- Signal mapping
- Version history

##### ModelDetail (`src/components/organisms/ModelDetail.tsx`)
**Purpose**: Model detail view
**Features**:
- Model information
- Related items
- Action buttons
- Statistics

#### Management Components

##### UserManagement (`src/components/organisms/UserManagement.tsx`)
**Purpose**: User administration interface
**Features**:
- User list
- Role management
- Permission assignment
- Bulk operations

##### PermissionManagement (`src/components/organisms/PermissionManagement.tsx`)
**Purpose**: Permission management interface
**Features**:
- Permission matrix
- Role assignment
- Access control
- Audit trail

## Custom Hooks

### Data Fetching Hooks

#### useListModels (`src/hooks/useListModels.ts`)
**Purpose**: Fetch and manage model list data
```typescript
export const useListModels = (params?: ListQueryParams) => {
  return useQuery({
    queryKey: ['models', params],
    queryFn: () => listModelsService(params),
    staleTime: 5 * 60 * 1000,
  })
}
```

#### useGetModel (`src/hooks/useGetModel.ts`)
**Purpose**: Fetch single model data
```typescript
export const useGetModel = (id: string) => {
  return useQuery({
    queryKey: ['model', id],
    queryFn: () => getModelService(id),
    enabled: !!id,
  })
}
```

### Authentication Hooks

#### useGithubAuth (`src/hooks/useGithubAuth.ts`)
**Purpose**: GitHub authentication management
```typescript
export const useGithubAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  const login = useCallback(async () => {
    // GitHub OAuth flow
  }, [])
  
  const logout = useCallback(async () => {
    // Logout logic
  }, [])
  
  return { isAuthenticated, login, logout }
}
```

#### usePermissionHook (`src/hooks/usePermissionHook.ts`)
**Purpose**: Permission checking
```typescript
export const usePermissionHook = (permission: string) => {
  const { user } = useAuthStore()
  
  return useMemo(() => {
    return user?.permissions?.includes(permission) || false
  }, [user, permission])
}
```

### UI State Hooks

#### useResizeObserver (`src/hooks/useResizeObserver.ts`)
**Purpose**: Element resize detection
```typescript
export const useResizeObserver = (ref: RefObject<HTMLElement>) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  useEffect(() => {
    if (!ref.current) return
    
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
    })
    
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
  
  return dimensions
}
```

#### useSystemUI (`src/hooks/useSystemUI.ts`)
**Purpose**: System UI state management
```typescript
export const useSystemUI = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
  return {
    sidebarOpen,
    setSidebarOpen,
    theme,
    setTheme,
  }
}
```

## State Management

### Zustand Stores

#### Auth Store (`src/stores/authStore.ts`)
**Purpose**: Authentication state management
```typescript
interface AuthState {
  user: User | null
  access: Token | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  access: null,
  isAuthenticated: false,
  login: async (credentials) => {
    // Login logic
  },
  logout: () => {
    // Logout logic
  },
  refreshToken: async () => {
    // Token refresh logic
  },
}))
```

#### Global Store (`src/stores/globalStore.ts`)
**Purpose**: Global application state
```typescript
interface GlobalState {
  loading: boolean
  error: string | null
  notifications: Notification[]
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
}
```

#### Model Store (`src/stores/modelStore.ts`)
**Purpose**: Model-related state
```typescript
interface ModelState {
  currentModel: Model | null
  models: Model[]
  setCurrentModel: (model: Model | null) => void
  setModels: (models: Model[]) => void
  addModel: (model: Model) => void
  updateModel: (id: string, updates: Partial<Model>) => void
  removeModel: (id: string) => void
}
```

### React Query Integration

#### Query Client Configuration
```typescript
// src/providers/QueryProvider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})
```

#### Custom Query Hooks
```typescript
// src/hooks/useCurrentModel.ts
export const useCurrentModel = () => {
  const { currentModelId } = useModelStore()
  
  return useQuery({
    queryKey: ['model', currentModelId],
    queryFn: () => getModelService(currentModelId!),
    enabled: !!currentModelId,
  })
}
```

## Component Patterns

### Compound Components
```typescript
// Example: DaForm compound component
const DaForm = ({ children, onSubmit }: DaFormProps) => {
  return <form onSubmit={onSubmit}>{children}</form>
}

DaForm.Field = DaFormField
DaForm.Submit = DaFormSubmit
DaForm.Error = DaFormError

// Usage
<DaForm onSubmit={handleSubmit}>
  <DaForm.Field label="Name" name="name" />
  <DaForm.Error name="name" />
  <DaForm.Submit>Submit</DaForm.Submit>
</DaForm>
```

### Render Props Pattern
```typescript
// Example: DataProvider component
interface DataProviderProps<T> {
  queryKey: string[]
  queryFn: () => Promise<T>
  children: (data: T, loading: boolean, error: Error | null) => React.ReactNode
}

const DataProvider = <T,>({ queryKey, queryFn, children }: DataProviderProps<T>) => {
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn,
  })
  
  return <>{children(data, isLoading, error)}</>
}
```

### Higher-Order Components
```typescript
// Example: withPermission HOC
const withPermission = (permission: string) => {
  return <P extends object>(Component: React.ComponentType<P>) => {
    return (props: P) => {
      const hasPermission = usePermissionHook(permission)
      
      if (!hasPermission) {
        return <div>Access denied</div>
      }
      
      return <Component {...props} />
    }
  }
}

// Usage
const ProtectedComponent = withPermission('admin')(MyComponent)
```

## Styling Patterns

### Tailwind CSS Classes
```typescript
// Consistent styling with Tailwind
const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  outline: 'border border-gray-300 hover:bg-gray-50',
}

const sizeVariants = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}
```

### CSS Modules (when needed)
```typescript
// For complex styling that can't be achieved with Tailwind
import styles from './Component.module.css'

const Component = () => {
  return <div className={styles.container}>Content</div>
}
```

### Styled Components (for dynamic styling)
```typescript
// For components that need dynamic styling
const StyledButton = styled.button<{ variant: 'primary' | 'secondary' }>`
  background-color: ${props => props.variant === 'primary' ? '#3b82f6' : '#6b7280'};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  
  &:hover {
    background-color: ${props => props.variant === 'primary' ? '#2563eb' : '#4b5563'};
  }
`
```

## Performance Optimization

### React.memo
```typescript
// Memoize components that receive stable props
const ExpensiveComponent = React.memo(({ data }: ExpensiveComponentProps) => {
  return <div>{/* Expensive rendering logic */}</div>
})
```

### useMemo and useCallback
```typescript
const Component = ({ items }: ComponentProps) => {
  // Memoize expensive calculations
  const processedItems = useMemo(() => {
    return items.map(item => expensiveProcessing(item))
  }, [items])
  
  // Memoize callback functions
  const handleClick = useCallback((id: string) => {
    // Handle click logic
  }, [])
  
  return <div>{/* Component JSX */}</div>
}
```

### Lazy Loading
```typescript
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'))

const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

## Testing Patterns

### Component Testing
```typescript
// Example: Testing a button component
import { render, screen, fireEvent } from '@testing-library/react'
import { DaButton } from './DaButton'

describe('DaButton', () => {
  it('renders with correct text', () => {
    render(<DaButton>Click me</DaButton>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<DaButton onClick={handleClick}>Click me</DaButton>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Hook Testing
```typescript
// Example: Testing a custom hook
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter())
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.count).toBe(1)
  })
})
```

## Best Practices

### 1. Component Design
- Keep components small and focused
- Use TypeScript for type safety
- Follow the single responsibility principle
- Make components reusable and composable

### 2. State Management
- Use local state for component-specific data
- Use Zustand for global state
- Use React Query for server state
- Avoid prop drilling

### 3. Performance
- Memoize expensive calculations
- Use React.memo for pure components
- Implement lazy loading for heavy components
- Optimize re-renders

### 4. Accessibility
- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure keyboard navigation
- Test with screen readers

### 5. Error Handling
- Use error boundaries for component errors
- Provide fallback UI for failed states
- Handle loading states gracefully
- Log errors for debugging 