# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
```bash
# Install dependencies
yarn install

# Start development server (port 3000)
yarn dev

# Build for production
yarn build

# Run linting
yarn lint

# Type checking
yarn tsc

# Format code
yarn pretty

# Preview production build
yarn preview
```

### Docker Development
```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up --build

# Production preview
docker-compose -f docker-compose.preview.yml up --build
```

## Architecture Overview

This is a **React + TypeScript + Vite** application for the digital.auto Playground ecosystem, providing a dashboard interface for vehicle signal visualization and prototype execution.

### Key Technologies
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand (see `src/stores/`)
- **Styling**: Tailwind CSS + shadcn/ui components
- **API Client**: Axios with React Query
- **Authentication**: Azure MSAL for SSO
- **Real-time**: Socket.io for WebSocket connections
- **Code Editor**: Monaco Editor
- **Flow Visualization**: ReactFlow (@xyflow/react)

### Project Structure
- **src/components/** - UI components organized in atomic design:
  - `atoms/` - Basic reusable components (buttons, inputs, etc.)
  - `molecules/` - Complex components (cards, forms, etc.)
  - `organisms/` - Page sections and features
- **src/stores/** - Zustand stores for global state:
  - `authStore.ts` - Authentication state
  - `runtimeStore.ts` - Runtime execution state
  - `socketStore.ts` - WebSocket connection state
  - `modelStore.ts` - Data model management
- **src/services/** - API service layer with typed endpoints
- **src/pages/** - Page components and routing
- **src/hooks/** - Custom React hooks
- **src/lib/** - Utility functions and helpers
- **src/types/** - TypeScript type definitions

### Important Patterns
- **Path Aliasing**: `@/` maps to `./src/` directory
- **API Services**: All API calls go through service layer in `src/services/`
- **Error Handling**: Global error boundary with fallback UI
- **Toast Notifications**: Using react-toastify for user feedback
- **Component Naming**: All custom components prefixed with `Da` (e.g., DaButton, DaInput)

### Environment Configuration
Required environment variables (see `.env.example`):
- `VITE_SERVER_BASE_URL` - Backend API URL
- `VITE_SERVER_BASE_WSS_URL` - WebSocket server URL
- `VITE_REACT_SSO_CLIENT_ID` - SSO client ID (optional)
- `VITE_GITHUB_CLIENT_ID` - GitHub OAuth client ID (optional)

### Backend Integration
The app connects to a backend server (typically at port 9800) that provides:
- Vehicle signal APIs compatible with KUKSA Data Broker
- Runtime execution environments for Python/C++/Rust prototypes
- WebSocket connections for real-time data streaming
- User management and collaboration features

## Refactoring Guidelines

This project is undergoing active migration and refactoring. When working on refactoring tasks:

### SOLID Principles
Follow **SOLID principles**, with special emphasis on:

- **Single Responsibility Principle (SRP)**: Each component, function, and module should have one clear responsibility
  - Break down large components into smaller, focused ones
  - Separate business logic from presentation logic
  - Extract reusable logic into custom hooks
  - Keep service functions focused on a single API concern
  - Split complex stores into smaller, domain-specific stores

### Migration Approach
- Prioritize incremental refactoring over large rewrites
- Maintain backward compatibility during migration
- Document breaking changes and migration paths
- Test thoroughly after each refactoring step
- Keep related changes together in focused commits

### Component Standards
**IMPORTANT: When adding new UI components, ALWAYS use shadcn/ui components**
- Check https://ui.shadcn.com/docs/components first before creating custom components
- Install shadcn components using: `npx shadcn@latest add <component-name>`
- Do NOT create custom Da* components for basic UI elements (Button, Input, Label, etc.)
- Only create custom components for domain-specific, business logic components
- shadcn components are located in `src/components/atoms/` (e.g., button.tsx, input.tsx)

### Styling Guidelines

**CRITICAL: Use ONLY shadcn/ui atoms and Tailwind CSS**
- **ALWAYS** use shadcn/ui components from `src/components/atoms/` for UI elements
- **ALWAYS** use standard Tailwind CSS utility classes for styling
- **NEVER** create custom "da-" prefixed classes in index.css or any CSS file
- **NEVER** attempt to migrate or convert "da-" prefixed classes to CSS definitions

**What to do when encountering custom "da-" classes:**
1. **Replace** with standard Tailwind utilities (e.g., `border-da-gray-light` → `border-border`)
2. **Remove** if the class serves no purpose
3. **DO NOT** add CSS definitions for "da-" classes to make them work

**Examples:**
```tsx
// ❌ WRONG: Do not create CSS for custom classes
// index.css
.da-button { ... }  // Never do this

// ❌ WRONG: Do not use custom da- prefixed classes
<div className="border-da-gray-light" />

// ✅ CORRECT: Use standard Tailwind utilities
<div className="border-border" />

// ✅ CORRECT: Use shadcn/ui atoms
import { Button } from "@/components/atoms/button"
<Button variant="outline">Click me</Button>
```

**Color System:**
- `text-muted-foreground`: Default body text
- `text-primary`: Headings, table headers, emphasized text
- `text-foreground`: High emphasis (use sparingly)
- `border-border`: Standard borders
- `bg-background`: Standard background

## Ongoing Component Migration: DaInput → shadcn Input

### Current Status
**ACTIVE MIGRATION** - Replacing custom DaInput component with shadcn/ui Input component

### Migration Rules

#### 1. Class Name Replacements
Replace custom classes with Tailwind/shadcn standard classes:
- `da-txt-regular` → `text-base` or `text-sm` (context-dependent)
- `da-txt-small` → `text-sm`
- `da-txt-medium` → `text-base`
- `text-da-gray-gray` → `text-muted-foreground`
- `text-da-gray-dark` → `text-foreground`
- `text-da-gray-medium` → `text-muted-foreground`
- `text-da-gray-light` → `text-muted-foreground/70`
- `text-da-primary-500` → `text-primary`
- `border-da-primary-500` → `border-primary`
- `border-da-gray-light` → `border-input`
- `bg-da-white` → `bg-background`

#### 2. Component Migration Patterns

**Simple Input (no label, no icon):**
```tsx
// Before
<DaInput
  value={value}
  onChange={onChange}
  className="w-full"
/>

// After
import { Input } from "@/components/atoms/input"

<Input
  value={value}
  onChange={onChange}
  className="w-full"
/>
```

**Input with Label:**
```tsx
// Before
<DaInput
  label="Username"
  value={value}
  onChange={onChange}
/>

// After
import { Input } from "@/components/atoms/input"
import { Label } from "@/components/atoms/label"

<div className="flex flex-col">
  <Label className="mb-1">Username</Label>
  <Input
    value={value}
    onChange={onChange}
  />
</div>
```

**Input with Icon:**
- For icon support, wrap Input with appropriate div structure
- Use lucide-react icons instead of react-icons where possible
- Icons should be positioned absolutely or using flex layout

#### 3. Migration Process

**IMPORTANT: Manual Migration Only**
- Do NOT use automated scripts (Python, sed, etc.) for batch replacements
- Migrate files one at a time or in small focused groups
- Build and test frequently to catch errors early

**Steps for Each File:**
1. Read the file and identify all DaInput usages
2. Determine the pattern (simple, with label, with icon)
3. Replace imports and component usage
4. Replace custom class names with standard classes
5. Test the specific component/page
6. Run `yarn build` to catch type errors
7. Fix any errors before moving to next file

**Build Early, Build Often:**
- Run `yarn build` after migrating 2-3 files
- Fix compilation errors immediately
- Don't accumulate technical debt

#### 4. Files to Migrate (53 files total)
Track progress by checking off migrated files. Prioritize by:
1. Form components (most critical)
2. Page components (high visibility)
3. Organism/molecule components (moderate complexity)
4. Utility components (lower priority)