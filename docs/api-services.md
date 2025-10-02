# API Services

## Service Architecture

AutoWRX uses a layered service architecture with centralized API management. All backend communication is handled through service modules that provide a clean abstraction over HTTP requests.

## Service Layer Structure

### Base Configuration (`src/services/base.ts`)

The foundation for all API communication:

```typescript
// Axios instances for different services
export const serverAxios = axios.create({
  baseURL: `${config.serverBaseUrl}/${config.serverVersion}`,
  withCredentials: true,
})

export const cacheAxios = axios.create({
  baseURL: config.cacheBaseUrl,
})

export const logAxios = axios.create({
  baseURL: config.logBaseUrl,
  withCredentials: true,
})
```

### Authentication Interceptor

```typescript
serverAxios.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().access?.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)
```

## Core Services

### Authentication Service (`src/services/auth.service.ts`)

**Purpose**: Handle user authentication and session management

#### Endpoints:
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Password reset request

#### Key Functions:
```typescript
export const loginService = async (credentials: LoginCredentials)
export const logoutService = async ()
export const refreshTokenService = async ()
export const forgotPasswordService = async (email: string)
```

### User Service (`src/services/user.service.ts`)

**Purpose**: User management and profile operations

#### Endpoints:
- `GET /users/self` - Get current user profile
- `GET /users/:id` - Get user by ID
- `GET /users` - List users (with pagination)
- `POST /users` - Create new user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `PATCH /users/self` - Update current user profile

#### Key Functions:
```typescript
export const getSelfService = async (): Promise<User>
export const getUsersService = async (ids: string): Promise<User[]>
export const listUsersService = async (params?: ListQueryParams): Promise<List<User>>
export const createUserService = async (data: UserCreate): Promise<User>
export const updateUserService = async (id: string, data: UserUpdate): Promise<User>
export const deleteUserService = async (id: string): Promise<void>
export const partialUpdateUserService = async (data: Partial<User>): Promise<User>
```

### Model Service (`src/services/model.service.ts`)

**Purpose**: Vehicle model management and operations

#### Endpoints:
- `GET /models` - List models (with pagination)
- `GET /models/all` - Get all models (owned, contributed, public)
- `GET /models/:id` - Get model by ID
- `POST /models` - Create new model
- `PATCH /models/:id` - Update model
- `DELETE /models/:id` - Delete model
- `GET /models/:id/apis` - Get model APIs
- `GET /models/:id/apis/:api` - Get specific API details
- `POST /models/:id/apis/replace` - Replace model APIs

#### Key Functions:
```typescript
export const listModelsLite = async (params?: Record<string, unknown>): Promise<List<ModelLite>>
export const listAllModels = async (): Promise<AllModelsResponse>
export const getModel = async (model_id: string): Promise<Model>
export const createModelService = async (model: ModelCreate): Promise<Model>
export const updateModelService = async (model_id: string, data: Partial<Model>): Promise<Model>
export const deleteModelService = async (model_id: string): Promise<void>
export const getComputedAPIs = async (model_id: string): Promise<VehicleAPI[]>
export const getApiDetailService = async (model_id: string, api_name: string): Promise<VehicleAPI>
export const replaceAPIsService = async (model_id: string, api_data_url: string): Promise<void>
```

### Prototype Service (`src/services/prototype.service.ts`)

**Purpose**: Prototype development and execution management

#### Endpoints:
- `GET /prototypes` - List prototypes (with pagination)
- `GET /prototypes/popular` - Get popular prototypes
- `GET /prototypes/recent` - Get recent prototypes
- `GET /prototypes/:id` - Get prototype by ID
- `POST /prototypes` - Create new prototype
- `POST /prototypes/bulk` - Create multiple prototypes
- `PATCH /prototypes/:id` - Update prototype
- `DELETE /prototypes/:id` - Delete prototype
- `POST /prototypes/:id/execute` - Execute prototype
- `GET /prototypes/:id/logs` - Get execution logs

#### Key Functions:
```typescript
export const listPopularPrototypes = async (): Promise<Prototype[]>
export const listRecentPrototypes = async (): Promise<Prototype[]>
export const listAllPrototypes = async (): Promise<List<Prototype>>
export const getPrototype = async (prototype_id: string): Promise<Prototype>
export const listModelPrototypes = async (model_id: string): Promise<Prototype[]>
export const createPrototypeService = async (prototype: any): Promise<Prototype>
export const createBulkPrototypesService = async (prototypes: any[]): Promise<Prototype[]>
export const updatePrototypeService = async (prototype_id: string, data: Partial<Prototype>): Promise<Prototype>
export const deletePrototypeService = async (prototype_id: string): Promise<void>
export const saveRecentPrototype = async (userId: string, referenceId: string, type: string, page: string): Promise<void>
export const countCodeExecution = async (prototypeId: string): Promise<void>
```

### API Service (`src/services/api.service.ts`)

**Purpose**: Vehicle API and VSS management

#### Endpoints:
- `GET /apis/model_id/:model_id` - Get APIs by model ID
- `GET /apis/vss` - List VSS versions
- `GET /apis/vss/:version` - Get VSS specification by version

#### Key Functions:
```typescript
export const getApiByModelIdService = async (model_id: string): Promise<CVI>
export const listVSSVersionsService = async (): Promise<VSSRelease[]>
```

## Specialized Services

### Inventory Service (`src/services/inventory.service.ts`)

**Purpose**: Inventory management system

#### Endpoints:
- `GET /inventory` - List inventory items
- `GET /inventory/:id` - Get inventory item
- `POST /inventory` - Create inventory item
- `PATCH /inventory/:id` - Update inventory item
- `DELETE /inventory/:id` - Delete inventory item
- `GET /inventory/schemas` - List schemas
- `GET /inventory/instances` - List instances

#### Key Functions:
```typescript
export const listInventoryItems = async (params?: InventoryQueryParams): Promise<List<InventoryItem>>
export const getInventoryItem = async (id: string): Promise<InventoryItem>
export const createInventoryItem = async (data: InventoryCreate): Promise<InventoryItem>
export const updateInventoryItem = async (id: string, data: InventoryUpdate): Promise<InventoryItem>
export const deleteInventoryItem = async (id: string): Promise<void>
```

### Widget Service (`src/services/widget.service.ts`)

**Purpose**: Widget management and marketplace integration

#### Endpoints:
- `GET /widgets` - List widgets
- `GET /widgets/:id` - Get widget details
- `POST /widgets` - Create widget
- `PATCH /widgets/:id` - Update widget
- `DELETE /widgets/:id` - Delete widget
- `GET /widgets/marketplace` - Get marketplace widgets

#### Key Functions:
```typescript
export const listWidgets = async (params?: WidgetQueryParams): Promise<List<Widget>>
export const getWidget = async (id: string): Promise<Widget>
export const createWidget = async (data: WidgetCreate): Promise<Widget>
export const updateWidget = async (id: string, data: WidgetUpdate): Promise<Widget>
export const deleteWidget = async (id: string): Promise<void>
export const getMarketplaceWidgets = async (): Promise<Widget[]>
```

### Permission Service (`src/services/permission.service.ts`)

**Purpose**: Role-based access control

#### Endpoints:
- `GET /permissions` - List permissions
- `GET /permissions/:id` - Get permission details
- `POST /permissions` - Create permission
- `PATCH /permissions/:id` - Update permission
- `DELETE /permissions/:id` - Delete permission

#### Key Functions:
```typescript
export const listPermissions = async (params?: PermissionQueryParams): Promise<List<Permission>>
export const getPermission = async (id: string): Promise<Permission>
export const createPermission = async (data: PermissionCreate): Promise<Permission>
export const updatePermission = async (id: string, data: PermissionUpdate): Promise<Permission>
export const deletePermission = async (id: string): Promise<void>
```

## External Service Integrations

### GitHub Service (`src/services/github.service.ts`)

**Purpose**: GitHub integration for source code management

#### Endpoints:
- `GET /github/auth` - GitHub OAuth URL
- `GET /github/user` - Get GitHub user info
- `GET /github/repos` - List user repositories
- `POST /github/webhook` - GitHub webhook handler

#### Key Functions:
```typescript
export const getGithubAuthUrl = async (): Promise<string>
export const getGithubUser = async (): Promise<GithubUser>
export const listGithubRepos = async (): Promise<GithubRepo[]>
```

### Certivity Service (`src/services/certivity.service.ts`)

**Purpose**: Integration with Certivity platform

#### Endpoints:
- `GET /certivity/projects` - List Certivity projects
- `GET /certivity/projects/:id` - Get project details
- `POST /certivity/projects` - Create project
- `PATCH /certivity/projects/:id` - Update project

#### Key Functions:
```typescript
export const listCertivityProjects = async (): Promise<CertivityProject[]>
export const getCertivityProject = async (id: string): Promise<CertivityProject>
export const createCertivityProject = async (data: CertivityProjectCreate): Promise<CertivityProject>
export const updateCertivityProject = async (id: string, data: CertivityProjectUpdate): Promise<CertivityProject>
```

### Socket.IO Service (`src/services/socketio.service.ts`)

**Purpose**: Real-time communication

#### Features:
- Real-time data updates
- Live collaboration
- Execution status updates
- Chat functionality

#### Key Functions:
```typescript
export const connectSocket = (): void
export const disconnectSocket = (): void
export const emitEvent = (event: string, data: any): void
export const onEvent = (event: string, callback: (data: any) => void): void
```

## Utility Services

### Upload Service (`src/services/upload.service.ts`)

**Purpose**: File upload management

#### Endpoints:
- `POST /upload` - Upload file
- `GET /upload/:id` - Get file info
- `DELETE /upload/:id` - Delete file

#### Key Functions:
```typescript
export const uploadFile = async (file: File, options?: UploadOptions): Promise<UploadResponse>
export const getFileInfo = async (id: string): Promise<FileInfo>
export const deleteFile = async (id: string): Promise<void>
```

### Log Service (`src/services/log.service.ts`)

**Purpose**: Application logging

#### Endpoints:
- `POST /logs` - Create log entry
- `GET /logs` - List logs (with filtering)

#### Key Functions:
```typescript
export const addLog = async (log: LogEntry): Promise<void>
export const getLogs = async (params?: LogQueryParams): Promise<List<LogEntry>>
```

### Search Service (`src/services/search.service.ts`)

**Purpose**: Global search functionality

#### Endpoints:
- `GET /search` - Global search
- `GET /search/models` - Search models
- `GET /search/prototypes` - Search prototypes
- `GET /search/users` - Search users

#### Key Functions:
```typescript
export const globalSearch = async (query: string): Promise<SearchResults>
export const searchModels = async (query: string): Promise<Model[]>
export const searchPrototypes = async (query: string): Promise<Prototype[]>
export const searchUsers = async (query: string): Promise<User[]>
```

## Data Flow Patterns

### Standard CRUD Operations

```typescript
// Create
const createItem = async (data: CreateData) => {
  const response = await serverAxios.post<Item>('/endpoint', data)
  return response.data
}

// Read
const getItem = async (id: string) => {
  const response = await serverAxios.get<Item>(`/endpoint/${id}`)
  return response.data
}

// Update
const updateItem = async (id: string, data: UpdateData) => {
  const response = await serverAxios.patch<Item>(`/endpoint/${id}`, data)
  return response.data
}

// Delete
const deleteItem = async (id: string) => {
  await serverAxios.delete(`/endpoint/${id}`)
}
```

### Pagination Pattern

```typescript
const listItems = async (params?: ListQueryParams) => {
  const response = await serverAxios.get<List<Item>>('/endpoint', {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 10,
      search: params?.search,
      sortBy: params?.sortBy,
      ...params
    }
  })
  return response.data
}
```

### Error Handling

```typescript
const apiCall = async () => {
  try {
    const response = await serverAxios.get('/endpoint')
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle specific HTTP errors
      switch (error.response?.status) {
        case 401:
          // Handle unauthorized
          break
        case 404:
          // Handle not found
          break
        case 500:
          // Handle server error
          break
      }
    }
    throw error
  }
}
```

## React Query Integration

### Custom Hooks Pattern

```typescript
// src/hooks/useListModels.ts
export const useListModels = (params?: ListQueryParams) => {
  return useQuery({
    queryKey: ['models', params],
    queryFn: () => listModelsService(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// src/hooks/useGetModel.ts
export const useGetModel = (id: string) => {
  return useQuery({
    queryKey: ['model', id],
    queryFn: () => getModelService(id),
    enabled: !!id,
  })
}
```

### Mutation Hooks

```typescript
// src/hooks/useCreateModel.ts
export const useCreateModel = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createModelService,
    onSuccess: (newModel) => {
      queryClient.invalidateQueries({ queryKey: ['models'] })
      queryClient.setQueryData(['model', newModel.id], newModel)
    },
  })
}
```

## Configuration

### Environment Variables

```bash
# Backend URLs
VITE_SERVER_BASE_URL=https://backend-core-dev.digital.auto
VITE_SERVER_BASE_WSS_URL=wss://backend-core-dev.digital.auto
VITE_SERVER_VERSION=v2

# External Services
VITE_CACHE_BASE_URL=https://cache.digitalauto.tech
VITE_KIT_SERVER_URL=https://kit.digitalauto.tech
VITE_INVENTORY_FRONTEND_URL=https://fe.inventory.digital.auto

# Authentication
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

### Service Configuration

```typescript
// src/configs/config.ts
const config = {
  serverBaseUrl: import.meta.env.VITE_SERVER_BASE_URL,
  serverVersion: import.meta.env.VITE_SERVER_VERSION,
  cacheBaseUrl: import.meta.env.VITE_CACHE_BASE_URL,
  // ... other configurations
}
```

## Best Practices

### 1. Error Handling
- Always wrap API calls in try-catch blocks
- Provide meaningful error messages
- Handle different HTTP status codes appropriately
- Log errors for debugging

### 2. Type Safety
- Define TypeScript interfaces for all API responses
- Use generic types for reusable service functions
- Validate API responses at runtime when necessary

### 3. Caching Strategy
- Use React Query for automatic caching
- Set appropriate stale times for different data types
- Invalidate cache when data changes
- Implement optimistic updates for better UX

### 4. Performance
- Implement request debouncing for search operations
- Use pagination for large datasets
- Optimize bundle size with code splitting
- Cache frequently accessed data

### 5. Security
- Always include authentication headers
- Validate input data before sending to API
- Handle sensitive data appropriately
- Use HTTPS for all API communications 