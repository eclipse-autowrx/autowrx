# Development Guide

## Development Workflow

### Getting Started

#### Prerequisites
- Node.js (v18 or higher)
- Yarn package manager
- Git
- Docker & Docker Compose (for containerized development)
- VS Code (recommended) with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense

#### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd autowrx

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
yarn dev
```

### Development Environment

#### Local Development
```bash
# Start development server
yarn dev

# Access the application
# http://localhost:3000
```

#### Docker Development
```bash
# Start with Docker Compose
docker-compose -f docker-compose.dev.yml up --build

# Access the application
# http://localhost:3000
```

#### Available Scripts
```bash
# Development
yarn dev              # Start development server
yarn build            # Build for production
yarn preview          # Preview production build
yarn lint             # Run ESLint
yarn lint:fix         # Fix ESLint errors
yarn pretty           # Format code with Prettier
yarn tsc              # Type checking

# Testing
yarn test             # Run tests
yarn test:watch       # Run tests in watch mode
yarn test:coverage    # Generate coverage report

# Utilities
yarn analyze          # Analyze bundle size
yarn clean            # Clean build artifacts
```

## Code Standards

### TypeScript Guidelines

#### Type Definitions
```typescript
// ✅ Good: Explicit interface definitions
interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

// ✅ Good: Generic types for reusable components
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  onItemClick?: (item: T) => void
}

// ❌ Avoid: Any types
const handleData = (data: any) => {
  // Implementation
}
```

#### Function Signatures
```typescript
// ✅ Good: Explicit return types for complex functions
const processUserData = (user: User): ProcessedUser => {
  // Implementation
}

// ✅ Good: Async functions with proper typing
const fetchUserData = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`)
  return response.data
}

// ✅ Good: Optional parameters with defaults
const createUser = (data: UserCreate, options?: CreateOptions): Promise<User> => {
  // Implementation
}
```

### React Guidelines

#### Component Structure
```typescript
// ✅ Good: Functional components with TypeScript
interface ComponentProps {
  title: string
  onAction?: () => void
  children?: React.ReactNode
}

const Component: React.FC<ComponentProps> = ({ 
  title, 
  onAction, 
  children 
}) => {
  // Hooks at the top
  const [state, setState] = useState<string>('')
  
  // Event handlers
  const handleClick = useCallback(() => {
    onAction?.()
  }, [onAction])
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [])
  
  // Render
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}

export default Component
```

#### Hook Usage
```typescript
// ✅ Good: Custom hooks with proper typing
const useUserData = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
  })
}

// ✅ Good: Memoized values and callbacks
const Component = ({ items }: ComponentProps) => {
  const processedItems = useMemo(() => {
    return items.map(processItem)
  }, [items])
  
  const handleItemClick = useCallback((item: Item) => {
    // Handle click
  }, [])
  
  return <div>{/* JSX */}</div>
}
```

### File Organization

#### Import Order
```typescript
// 1. React and external libraries
import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal components and hooks
import { DaButton } from '@/components/atoms/DaButton'
import { useUserData } from '@/hooks/useUserData'

// 3. Types and utilities
import { User } from '@/types/user.type'
import { formatDate } from '@/lib/utils'

// 4. Styles
import './Component.css'
```

#### File Naming
```
// ✅ Good: PascalCase for components
DaButton.tsx
PageHome.tsx
FormCreateModel.tsx

// ✅ Good: camelCase for utilities and hooks
useUserData.ts
formatDate.ts
apiService.ts

// ✅ Good: kebab-case for CSS files
component-styles.css
button-variants.css
```

### Code Style

#### ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off"
  }
}
```

#### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## Testing Strategy

### Testing Pyramid

#### Unit Tests (70%)
- Individual components
- Utility functions
- Custom hooks
- Service functions

#### Integration Tests (20%)
- Component interactions
- API integration
- State management
- User workflows

#### E2E Tests (10%)
- Critical user journeys
- Cross-browser testing
- Performance testing

### Testing Tools

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
  ],
}
```

#### Testing Library Setup
```typescript
// src/setupTests.ts
import '@testing-library/jest-dom'
import { server } from './mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### Component Testing

#### Component Test Example
```typescript
// src/components/atoms/DaButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { DaButton } from './DaButton'

describe('DaButton', () => {
  it('renders with correct text', () => {
    render(<DaButton>Click me</DaButton>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<DaButton onClick={handleClick}>Click me</DaButton>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<DaButton disabled>Click me</DaButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows loading state', () => {
    render(<DaButton loading>Click me</DaButton>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })
})
```

#### Hook Testing
```typescript
// src/hooks/useUserData.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUserData } from './useUserData'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useUserData', () => {
  it('fetches user data', async () => {
    const { result } = renderHook(() => useUserData('123'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
    })
  })
})
```

### API Testing

#### Mock Service Worker
```typescript
// src/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/users/:id', (req, res, ctx) => {
    return res(
      ctx.json({
        id: req.params.id,
        name: 'John Doe',
        email: 'john@example.com',
      })
    )
  }),

  rest.post('/api/users', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 'new-id',
        ...req.body,
      })
    )
  }),
]
```

### E2E Testing

#### Playwright Setup
```typescript
// tests/e2e/user-flow.spec.ts
import { test, expect } from '@playwright/test'

test('user can create a model', async ({ page }) => {
  await page.goto('/model')
  
  await page.click('[data-testid="create-model-button"]')
  
  await page.fill('[data-testid="model-name-input"]', 'Test Model')
  await page.fill('[data-testid="model-description-input"]', 'Test Description')
  
  await page.click('[data-testid="submit-button"]')
  
  await expect(page).toHaveURL(/\/model\/[a-zA-Z0-9]+/)
  await expect(page.locator('h1')).toContainText('Test Model')
})
```

## Git Workflow

### Branch Strategy

#### Main Branches
- `main`: Production-ready code
- `develop`: Integration branch for features

#### Feature Branches
```bash
# Create feature branch
git checkout -b feature/user-authentication

# Make changes and commit
git add .
git commit -m "feat: add user authentication"

# Push to remote
git push origin feature/user-authentication

# Create pull request
# Merge to develop after review
```

#### Commit Convention
```bash
# Format: type(scope): description
feat(auth): add OAuth login with GitHub
fix(api): resolve user data fetching issue
docs(readme): update installation instructions
style(components): format button component
refactor(services): extract API client logic
test(hooks): add unit tests for useUserData
chore(deps): update dependencies
```

### Pull Request Process

#### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

## Performance Optimization

### Bundle Optimization

#### Code Splitting
```typescript
// Lazy load routes
const PageHome = lazy(() => import('@/pages/PageHome'))
const PageModelList = lazy(() => import('@/pages/PageModelList'))

// Lazy load components
const HeavyComponent = lazy(() => import('@/components/HeavyComponent'))
```

#### Tree Shaking
```typescript
// ✅ Good: Import specific functions
import { debounce } from 'lodash-es'

// ❌ Avoid: Import entire library
import _ from 'lodash'
```

### Runtime Optimization

#### Memoization
```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return heavyComputation(data)
}, [data])

// Memoize callback functions
const handleClick = useCallback((id: string) => {
  // Handle click
}, [])
```

#### Virtual Scrolling
```typescript
// For large lists
import { FixedSizeList as List } from 'react-window'

const VirtualList = ({ items }: { items: Item[] }) => {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      {items[index].name}
    </div>
  )

  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={35}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

## Debugging

### Development Tools

#### React DevTools
- Component tree inspection
- Props and state debugging
- Performance profiling

#### Redux DevTools (for Zustand)
```typescript
// Enable DevTools in development
const useStore = create<State>()(
  devtools(
    (set) => ({
      // Store implementation
    }),
    { name: 'AutoWRX Store' }
  )
)
```

#### Network Debugging
```typescript
// Log API requests in development
if (process.env.NODE_ENV === 'development') {
  serverAxios.interceptors.request.use((config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  })
}
```

### Error Handling

#### Error Boundaries
```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}
```

#### Global Error Handler
```typescript
// src/lib/errorHandler.ts
export const handleError = (error: Error, context?: string) => {
  console.error(`Error in ${context}:`, error)
  
  // Send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error, { tags: { context } })
  }
}

// Usage
window.addEventListener('error', (event) => {
  handleError(event.error, 'Global Error')
})

window.addEventListener('unhandledrejection', (event) => {
  handleError(new Error(event.reason), 'Unhandled Promise Rejection')
})
```

## Deployment

### Build Process

#### Production Build
```bash
# Build the application
yarn build

# Preview the build
yarn preview
```

#### Environment Configuration
```bash
# .env.production
VITE_SERVER_BASE_URL=https://backend-core.digital.auto
VITE_SERVER_VERSION=v2
VITE_CACHE_BASE_URL=https://cache.digitalauto.tech
```

### Docker Deployment

#### Production Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
```

### CI/CD Pipeline

#### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn test
      - run: yarn build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Deployment steps
```

## Best Practices

### Code Quality
- Write self-documenting code
- Use meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic
- Follow DRY (Don't Repeat Yourself) principle

### Performance
- Optimize bundle size
- Implement lazy loading
- Use memoization appropriately
- Monitor performance metrics
- Optimize images and assets

### Security
- Validate all inputs
- Sanitize user data
- Use HTTPS in production
- Implement proper authentication
- Keep dependencies updated

### Accessibility
- Use semantic HTML
- Provide ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Maintain color contrast ratios

### Testing
- Write tests for critical functionality
- Maintain good test coverage
- Use meaningful test descriptions
- Mock external dependencies
- Test error scenarios 