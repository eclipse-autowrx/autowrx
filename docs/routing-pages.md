# Routing & Pages

## Routing Architecture

AutoWRX uses **React Router DOM v6** for client-side routing with a nested route structure. The routing configuration is centralized in `src/configs/routes.tsx` and follows a hierarchical pattern.

## Route Configuration

### Main Route Structure

```typescript
// src/configs/routes.tsx
const routesConfig: RouteConfig[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Nested routes here
    ]
  }
]
```

### Route Categories

#### 1. Public Routes
- **Home**: `/` - Landing page
- **About**: `/about` - About page
- **Privacy Policy**: `/privacy-policy` - Privacy policy page
- **Auth Success**: `/auth/:provider/success` - Authentication callback

#### 2. Model Management Routes
- **Model List**: `/model` - List all models
- **Model Detail**: `/model/:model_id` - Model overview
- **Vehicle API**: `/model/:model_id/api` - API management
- **API Detail**: `/model/:model_id/api/:api` - Specific API details
- **Prototype Library**: `/model/:model_id/library` - Model prototypes
- **Architecture**: `/model/:model_id/architecture` - Model architecture

#### 3. Prototype Routes
- **Prototype Detail**: `/model/:model_id/library/prototype/:prototype_id` - Prototype details
- **Prototype Tab**: `/model/:model_id/library/prototype/:prototype_id/:tab` - Prototype with specific tab

#### 4. User Management Routes
- **User Profile**: `/profile` - User profile management
- **My Assets**: `/my-assets` - User's assets
- **Manage Users**: `/manage-users` - User administration (admin only)
- **Manage Features**: `/manage-features` - Feature management (admin only)

#### 5. Inventory Routes
- **Inventory**: `/inventory` - Inventory management
- **Inventory Role**: `/inventory/role/:inventory_role` - Role-based inventory view
- **Inventory Item**: `/inventory/role/:inventory_role/item/:inventory_id` - Item details
- **Inventory Schema**: `/inventory/schema/*` - Schema management
- **Inventory Instance**: `/inventory/instance/*` - Instance management

#### 6. Feature Routes
- **GenAI Wizard**: `/genai-wizard` - AI-powered wizard
- **Reset Password**: `/reset-password` - Password reset

#### 7. Development Routes (Development Only)
- **Test Forms**: `/test-ui/forms` - Form testing
- **Test Home**: `/test-ui/home` - Home page testing
- **Test Components**: `/test-ui/components` - Component testing
- **Test Molecules**: `/test-ui/molecules` - Molecule testing
- **Test Organisms**: `/test-ui/organisms` - Organism testing
- **Test Discussions**: `/test-ui/discussion` - Discussion testing

## Page Components

### Core Pages

#### PageHome (`src/pages/PageHome.tsx`)
**Route**: `/`
**Purpose**: Landing page with dashboard overview
**Features**:
- Welcome message and quick actions
- Recent models and prototypes
- Quick access to main features
- User onboarding flow

#### PageAbout (`src/pages/PageAbout.tsx`)
**Route**: `/about`
**Purpose**: About page with project information
**Features**:
- Project description
- Technology stack
- Team information
- Links to documentation

### Model Pages

#### PageModelList (`src/pages/PageModelList.tsx`)
**Route**: `/model`
**Purpose**: Display and manage vehicle models
**Features**:
- Grid/list view of models
- Search and filtering
- Create new model
- Model categories (owned, contributed, public)

#### PageModelDetail (`src/pages/PageModelDetail.tsx`)
**Route**: `/model/:model_id`
**Purpose**: Model overview and management
**Features**:
- Model information and metadata
- Quick actions (edit, delete, share)
- Model statistics
- Related prototypes and APIs

#### PageVehicleApi (`src/pages/PageVehicleApi.tsx`)
**Route**: `/model/:model_id/api` and `/model/:model_id/api/:api`
**Purpose**: Vehicle API management and testing
**Features**:
- API list and documentation
- API testing interface
- Signal mapping
- VSS integration

#### PageModelArchitecture (`src/pages/PageModelArchitecture.tsx`)
**Route**: `/model/:model_id/architecture`
**Purpose**: Visualize model architecture
**Features**:
- Architecture diagrams
- Component relationships
- System integration points
- Export capabilities

### Prototype Pages

#### PagePrototypeLibrary (`src/pages/PagePrototypeLibrary.tsx`)
**Route**: `/model/:model_id/library`
**Purpose**: Manage model prototypes
**Features**:
- Prototype grid/list view
- Create new prototype
- Prototype categories
- Search and filtering

#### PagePrototypeDetail (`src/pages/PagePrototypeDetail.tsx`)
**Route**: `/model/:model_id/library/prototype/:prototype_id`
**Purpose**: Prototype development and execution
**Features**:
- Code editor
- Execution environment
- Real-time output
- Debugging tools

### User Management Pages

#### PageUserProfile (`src/pages/PageUserProfile.tsx`)
**Route**: `/profile`
**Purpose**: User profile management
**Features**:
- Profile information
- Account settings
- Preferences
- Security settings

#### PageManageUsers (`src/pages/PageManageUsers.tsx`)
**Route**: `/manage-users`
**Purpose**: User administration (admin only)
**Features**:
- User list and management
- Role assignment
- Permission management
- User invitations

#### PageMyAssets (`src/pages/PageMyAssets.tsx`)
**Route**: `/my-assets`
**Purpose**: User's personal assets
**Features**:
- Personal models and prototypes
- Shared assets
- Asset statistics
- Quick access

### Inventory Pages

#### PageInventory (`src/pages/PageInventory.tsx`)
**Route**: `/inventory`
**Purpose**: Inventory management system
**Features**:
- Inventory overview
- Item management
- Schema management
- Instance management

#### PageInventoryItemDetail (`src/pages/PageInventoryItemDetail.tsx`)
**Route**: `/inventory/role/:inventory_role/item/:inventory_id`
**Purpose**: Detailed inventory item view
**Features**:
- Item details
- Related items
- History and changes
- Actions and workflows

### Feature Pages

#### PageGenAIWizard (`src/pages/wizard/PageGenAIWizard.tsx`)
**Route**: `/genai-wizard`
**Purpose**: AI-powered development wizard
**Features**:
- Guided development process
- AI assistance
- Code generation
- Best practices

## Layout Components

### RootLayout (`src/layouts/RootLayout.tsx`)
**Purpose**: Main application layout
**Features**:
- Navigation header
- Sidebar navigation
- Breadcrumb navigation
- Footer
- Error boundaries

### ModelDetailLayout (`src/layouts/ModelDetailLayout.tsx`)
**Purpose**: Layout for model-specific pages
**Features**:
- Model-specific navigation
- Model context
- Related actions
- Model breadcrumbs

### ErrorFallback (`src/layouts/ErrorFallback.tsx`)
**Purpose**: Error boundary fallback
**Features**:
- Error display
- Recovery options
- Error reporting
- User guidance

## Navigation Patterns

### Breadcrumb Navigation
- Automatic breadcrumb generation
- Context-aware navigation
- Deep linking support
- Navigation history

### Sidebar Navigation
- Collapsible sidebar
- Context-sensitive menu items
- Quick actions
- User-specific shortcuts

### Tab Navigation
- Tab-based content organization
- URL-based tab state
- Tab persistence
- Dynamic tab loading

## Route Guards and Permissions

### Authentication Guards
```typescript
// Example of route protection
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}
```

### Role-Based Access
- Admin-only routes
- Model-specific permissions
- Feature flags
- Conditional rendering

## Lazy Loading

### Route-Level Lazy Loading
```typescript
const PageHome = lazy(() => retry(() => import('@/pages/PageHome')))
```

### Component-Level Lazy Loading
```typescript
const DaWidgetLibrary = lazy(() => import('@/components/molecules/widgets/DaWidgetLibrary'))
```

### Suspense Boundaries
```typescript
<SuspenseProvider>
  <PageHome />
</SuspenseProvider>
```

## URL Patterns

### RESTful URLs
- `/model/:model_id` - Resource-based URLs
- `/model/:model_id/api/:api` - Nested resources
- `/inventory/role/:role/item/:id` - Hierarchical resources

### Query Parameters
- Search: `?search=keyword`
- Filtering: `?filter=category`
- Pagination: `?page=1&limit=10`
- Sorting: `?sortBy=name&order=asc`

### Hash Routes
- Tab navigation: `#tab=overview`
- Scroll positions: `#section=api`
- State preservation: `#state=editing`

## Route Parameters

### Dynamic Parameters
```typescript
// URL: /model/123/api/vehicle-speed
const { model_id, api } = useParams()
```

### Optional Parameters
```typescript
// URL: /model/123/library/prototype/456/overview
const { tab = 'overview' } = useParams()
```

### Query Parameters
```typescript
const [searchParams] = useSearchParams()
const search = searchParams.get('search')
```

## Navigation Hooks

### useNavigate
```typescript
const navigate = useNavigate()

// Programmatic navigation
navigate('/model/123')
navigate('/model/123', { replace: true })
navigate(-1) // Go back
```

### useLocation
```typescript
const location = useLocation()

// Access current location
console.log(location.pathname)
console.log(location.search)
console.log(location.hash)
```

## Error Handling

### 404 Not Found
- Custom 404 page
- Redirect to home
- Search suggestions

### Route Errors
- Error boundaries
- Fallback components
- Error logging

### Loading States
- Loading spinners
- Skeleton screens
- Progressive loading

## Development Routes

### Test UI Routes
Development-only routes for testing components:

- `/test-ui/forms` - Form component testing
- `/test-ui/components` - Atomic component testing
- `/test-ui/molecules` - Molecule component testing
- `/test-ui/organisms` - Organism component testing

### Feature Flags
```typescript
// Conditional route rendering
{process.env.NODE_ENV === 'development' && (
  <Route path="/test-ui/*" element={<TestUIRoutes />} />
)}
``` 