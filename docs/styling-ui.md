# Styling & UI

## CSS Architecture

AutoWRX uses a modern CSS architecture that combines Tailwind CSS with custom components and utilities to create a consistent and maintainable design system.

## Tailwind CSS Integration

### Configuration

#### Tailwind Config (`tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
}
```

#### PostCSS Configuration (`postcss.config.js`)
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Utility-First Approach

#### Common Patterns
```typescript
// Layout utilities
const layoutClasses = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-12',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  flex: 'flex items-center justify-between',
}

// Spacing utilities
const spacingClasses = {
  padding: 'p-4 md:p-6 lg:p-8',
  margin: 'm-4 md:m-6 lg:m-8',
  gap: 'gap-4 md:gap-6 lg:gap-8',
}

// Typography utilities
const typographyClasses = {
  heading: 'text-2xl font-bold text-gray-900',
  subheading: 'text-lg font-semibold text-gray-700',
  body: 'text-base text-gray-600',
  caption: 'text-sm text-gray-500',
}
```

#### Responsive Design
```typescript
// Mobile-first responsive classes
const responsiveClasses = {
  // Small screens (sm: 640px+)
  sm: 'sm:grid-cols-2 sm:gap-4',
  
  // Medium screens (md: 768px+)
  md: 'md:grid-cols-3 md:gap-6',
  
  // Large screens (lg: 1024px+)
  lg: 'lg:grid-cols-4 lg:gap-8',
  
  // Extra large screens (xl: 1280px+)
  xl: 'xl:grid-cols-5 xl:gap-10',
}
```

## Design System

### Color Palette

#### Primary Colors
```css
/* Primary brand colors */
:root {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
}
```

#### Semantic Colors
```css
/* Success, warning, error states */
:root {
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

#### Neutral Colors
```css
/* Grayscale palette */
:root {
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
}
```

### Typography

#### Font Stack
```css
/* Font families */
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace;
  --font-serif: 'Georgia', 'Times New Roman', serif;
}
```

#### Type Scale
```css
/* Font sizes */
:root {
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */
}
```

#### Font Weights
```css
/* Font weights */
:root {
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
}
```

### Spacing System

#### Spacing Scale
```css
/* Consistent spacing values */
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### Component Variants

#### Button Variants
```typescript
// Button component variants
const buttonVariants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition-colors',
  outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors',
  ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium px-4 py-2 rounded-lg transition-colors',
  danger: 'bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors',
}

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}
```

#### Input Variants
```typescript
// Input component variants
const inputVariants = {
  default: 'border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent',
  error: 'border border-red-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent',
  success: 'border border-green-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent',
}
```

## Component Styling

### Atomic Components

#### DaButton Component
```typescript
// src/components/atoms/DaButton.tsx
interface DaButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

const DaButton: React.FC<DaButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-500',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  
  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabledClasses,
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <DaLoading size="sm" className="mr-2" />}
      {children}
    </button>
  )
}
```

#### DaInput Component
```typescript
// src/components/atoms/DaInput.tsx
interface DaInputProps {
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

const DaInput: React.FC<DaInputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
}) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const stateClasses = error
    ? 'border-red-300 focus:ring-red-500 focus:border-transparent'
    : 'border-gray-300 focus:ring-primary-500 focus:border-transparent'
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
  
  return (
    <div className="w-full">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        required={required}
        className={clsx(baseClasses, stateClasses, disabledClasses, className)}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
```

### Layout Components

#### Container Component
```typescript
// src/components/atoms/DaContainer.tsx
interface DaContainerProps {
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

const DaContainer: React.FC<DaContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = 'md',
  className = '',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  }
  
  const paddingClasses = {
    none: '',
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-8',
  }
  
  return (
    <div className={clsx('mx-auto', maxWidthClasses[maxWidth], paddingClasses[padding], className)}>
      {children}
    </div>
  )
}
```

#### Grid Component
```typescript
// src/components/atoms/DaGrid.tsx
interface DaGridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const DaGrid: React.FC<DaGridProps> = ({
  children,
  cols = 1,
  gap = 'md',
  className = '',
}) => {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  }
  
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-10',
  }
  
  return (
    <div className={clsx('grid', colsClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  )
}
```

## Responsive Design

### Breakpoint System

#### Tailwind Breakpoints
```css
/* Default Tailwind breakpoints */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

#### Responsive Utilities
```typescript
// Responsive utility classes
const responsiveUtils = {
  // Hide/show based on screen size
  hide: {
    sm: 'hidden sm:block',
    md: 'hidden md:block',
    lg: 'hidden lg:block',
  },
  
  // Text alignment
  textAlign: {
    left: 'text-left',
    center: 'text-center sm:text-left',
    right: 'text-right',
  },
  
  // Spacing
  spacing: {
    container: 'px-4 sm:px-6 lg:px-8',
    section: 'py-8 sm:py-12 lg:py-16',
  },
}
```

### Mobile-First Approach

#### Responsive Components
```typescript
// Example: Responsive card component
const DaCard: React.FC<DaCardProps> = ({ children, className = '' }) => {
  return (
    <div className={clsx(
      'bg-white rounded-lg shadow-sm border border-gray-200',
      'p-4 sm:p-6 lg:p-8', // Responsive padding
      className
    )}>
      {children}
    </div>
  )
}

// Example: Responsive navigation
const DaNavigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/models">Models</NavLink>
            <NavLink to="/prototypes">Prototypes</NavLink>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <MobileNavLink to="/">Home</MobileNavLink>
              <MobileNavLink to="/models">Models</MobileNavLink>
              <MobileNavLink to="/prototypes">Prototypes</MobileNavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
```

## Animation and Transitions

### CSS Transitions

#### Transition Utilities
```typescript
// Common transition classes
const transitionClasses = {
  // Duration
  duration: {
    fast: 'duration-150',
    normal: 'duration-300',
    slow: 'duration-500',
  },
  
  // Easing
  easing: {
    linear: 'ease-linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
  },
  
  // Properties
  properties: {
    all: 'transition-all',
    colors: 'transition-colors',
    transform: 'transition-transform',
    opacity: 'transition-opacity',
  },
}

// Usage example
const buttonClasses = clsx(
  'bg-blue-600 hover:bg-blue-700',
  transitionClasses.duration.normal,
  transitionClasses.easing.inOut,
  transitionClasses.properties.colors
)
```

#### Animation Classes
```typescript
// Animation utilities
const animationClasses = {
  // Fade animations
  fade: {
    in: 'animate-fade-in',
    out: 'animate-fade-out',
  },
  
  // Slide animations
  slide: {
    up: 'animate-slide-up',
    down: 'animate-slide-down',
    left: 'animate-slide-left',
    right: 'animate-slide-right',
  },
  
  // Scale animations
  scale: {
    in: 'animate-scale-in',
    out: 'animate-scale-out',
  },
}
```

### Custom Animations

#### Keyframe Definitions
```css
/* src/styles/animations.css */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Animation classes */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}
```

## Dark Mode Support

### Dark Mode Configuration

#### Tailwind Dark Mode
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media' for system preference
  // ... rest of config
}
```

#### Dark Mode Utilities
```typescript
// Dark mode utility classes
const darkModeClasses = {
  // Background colors
  bg: {
    primary: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    card: 'bg-white dark:bg-gray-800',
  },
  
  // Text colors
  text: {
    primary: 'text-gray-900 dark:text-white',
    secondary: 'text-gray-600 dark:text-gray-300',
    muted: 'text-gray-500 dark:text-gray-400',
  },
  
  // Border colors
  border: {
    default: 'border-gray-200 dark:border-gray-700',
    focus: 'border-primary-500 dark:border-primary-400',
  },
}
```

#### Dark Mode Hook
```typescript
// src/hooks/useDarkMode.ts
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })
  
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])
  
  const toggle = useCallback(() => {
    setIsDark(!isDark)
  }, [isDark])
  
  return { isDark, toggle }
}
```

## Accessibility

### ARIA Support

#### ARIA Utilities
```typescript
// ARIA utility classes
const ariaClasses = {
  // Screen reader only
  srOnly: 'sr-only',
  
  // Focus indicators
  focus: {
    ring: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    outline: 'focus:outline-none',
  },
  
  // Interactive elements
  interactive: {
    button: 'cursor-pointer hover:bg-gray-50 focus:bg-gray-50',
    link: 'text-primary-600 hover:text-primary-700 underline',
  },
}
```

#### Accessible Components
```typescript
// Example: Accessible button component
const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  ...props
}) => {
  return (
    <button
      {...props}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      className={clsx(
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        props.className
      )}
    >
      {children}
    </button>
  )
}
```

### Color Contrast

#### Contrast Utilities
```typescript
// High contrast color combinations
const contrastClasses = {
  // High contrast text
  text: {
    high: 'text-gray-900 dark:text-white',
    medium: 'text-gray-700 dark:text-gray-200',
    low: 'text-gray-500 dark:text-gray-400',
  },
  
  // High contrast backgrounds
  bg: {
    high: 'bg-white dark:bg-gray-900',
    medium: 'bg-gray-50 dark:bg-gray-800',
    low: 'bg-gray-100 dark:bg-gray-700',
  },
}
```

## Performance Optimization

### CSS Optimization

#### Critical CSS
```typescript
// Extract critical CSS for above-the-fold content
const criticalStyles = `
  .critical-button {
    @apply bg-primary-600 text-white px-4 py-2 rounded-lg;
  }
  
  .critical-text {
    @apply text-gray-900 text-lg font-medium;
  }
`
```

#### CSS-in-JS Optimization
```typescript
// Optimized styled components
const StyledButton = styled.button<{ variant: ButtonVariant }>`
  ${({ variant }) => {
    switch (variant) {
      case 'primary':
        return css`
          background-color: var(--color-primary-600);
          color: white;
          &:hover {
            background-color: var(--color-primary-700);
          }
        `
      case 'secondary':
        return css`
          background-color: var(--color-gray-600);
          color: white;
          &:hover {
            background-color: var(--color-gray-700);
          }
        `
      default:
        return css`
          background-color: transparent;
          color: var(--color-gray-700);
        `
    }
  }}
  
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary-500);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`
```

### Bundle Optimization

#### CSS Purge
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/index.html",
  ],
  // Purge unused styles in production
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      './src/**/*.{js,ts,jsx,tsx}',
      './public/index.html',
    ],
  },
}
```

## Best Practices

### 1. Consistency
- Use design tokens for colors, spacing, and typography
- Maintain consistent component variants
- Follow established naming conventions

### 2. Performance
- Minimize CSS bundle size
- Use CSS-in-JS sparingly
- Optimize critical rendering path

### 3. Accessibility
- Ensure sufficient color contrast
- Provide focus indicators
- Use semantic HTML elements

### 4. Maintainability
- Keep styles modular and reusable
- Document design decisions
- Use consistent file organization

### 5. Responsiveness
- Design mobile-first
- Test across different screen sizes
- Use flexible layouts 