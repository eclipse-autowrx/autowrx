# Project Structure

## Directory Organization

AutoWRX follows a well-organized directory structure that promotes maintainability and scalability. Here's a detailed breakdown of the project structure:

```
autowrx/
├── docs/                    # Documentation files
├── public/                  # Static assets
│   ├── builtin-widgets/     # Built-in widget examples
│   ├── imgs/               # Images and media files
│   ├── misc/               # Miscellaneous assets
│   └── vss/                # VSS specification files
├── src/                    # Source code
│   ├── components/         # React components (Atomic Design)
│   ├── configs/           # Configuration files
│   ├── data/              # Mock data and static data
│   ├── hooks/             # Custom React hooks
│   ├── layouts/           # Layout components
│   ├── lib/               # Utility libraries
│   ├── pages/             # Page components
│   ├── providers/         # React context providers
│   ├── services/          # API services and external integrations
│   ├── stores/            # State management (Zustand)
│   ├── styles/            # Global styles and CSS
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── docker-compose.yml     # Docker configuration
├── Dockerfile             # Production Docker setup
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
└── tailwind.config.js     # Tailwind CSS configuration
```

## Source Code Structure (`src/`)

### Components (`src/components/`)

Following the **Atomic Design** methodology:

#### Atoms (`src/components/atoms/`)
Basic building blocks that can't be broken down further:

- **UI Elements**: `DaButton.tsx`, `DaInput.tsx`, `DaSelect.tsx`
- **Display**: `DaText.tsx`, `DaImage.tsx`, `DaAvatar.tsx`
- **Navigation**: `DaBreadcrumb.tsx`, `DaMenu.tsx`
- **Feedback**: `DaLoading.tsx`, `DaSkeleton.tsx`
- **Forms**: `DaCheckbox.tsx`, `DaTextarea.tsx`, `DaFileUpload.tsx`
- **Layout**: `DaSectionTitle.tsx`, `DaTag.tsx`

#### Molecules (`src/components/molecules/`)
Simple combinations of atoms:

- **Dashboard**: `DaDashboard.tsx`, `DaDashboardEditor.tsx`
- **Forms**: `FormCreateModel.tsx`, `FormCreateDiscussion.tsx`
- **Widgets**: `DaWidgetLibrary.tsx`, `DaWidgetList.tsx`
- **Navigation**: `DaBreadcrumb.tsx`, `DaMenu.tsx`
- **Feedback**: `toaster.tsx`, `toast.tsx`
- **Specialized**: `ChatBox.tsx`, `CodeEditor.tsx`

#### Organisms (`src/components/organisms/`)
Complex UI components that combine molecules and atoms:

- **Pages**: `PageHome.tsx`, `PageModelList.tsx`
- **Features**: `ApiDetail.tsx`, `ModelDetail.tsx`
- **Management**: `UserManagement.tsx`, `PermissionManagement.tsx`
- **Dashboard**: `DashboardView.tsx`, `WidgetManager.tsx`

### Configuration (`src/configs/`)

- **`config.ts`**: Application configuration and environment variables
- **`routes.tsx`**: Route definitions and lazy loading configuration

### Data (`src/data/`)

- **Mock Data**: `users_mock.ts`, `models_mock.ts`, `discussion_mock.ts`
- **Static Data**: `builtinWidgets.ts`, `dashboard_templates.ts`
- **VSS Data**: `CVI.ts`, `CVI_v4.1.ts`
- **Permissions**: `permission.ts`

### Hooks (`src/hooks/`)

Custom React hooks for data fetching and state management:

- **Data Fetching**: `useListModels.ts`, `useGetModel.ts`
- **Authentication**: `useGithubAuth.ts`, `usePermissionHook.ts`
- **Real-time**: `useSocketIO.ts`
- **UI State**: `useResizeObserver.ts`, `useSystemUI.ts`

### Layouts (`src/layouts/`)

- **`RootLayout.tsx`**: Main application layout
- **`ModelDetailLayout.tsx`**: Layout for model-specific pages
- **`ErrorFallback.tsx`**: Error boundary component

### Libraries (`src/lib/`)

Utility functions and helpers:

- **Storage**: `storage.ts`
- **Utilities**: `utils.ts`, `isNumeric.ts`
- **External**: `deployToEpam.tsx`, `publicToGithub.tsx`
- **Compression**: `zipUtils.tsx`

### Pages (`src/pages/`)

Page components organized by feature:

- **Core Pages**: `PageHome.tsx`, `PageAbout.tsx`
- **Model Pages**: `PageModelList.tsx`, `PageModelDetail.tsx`
- **User Pages**: `PageUserProfile.tsx`, `PageLogin.tsx`
- **Feature Pages**: `PageVehicleApi.tsx`, `PagePrototypeDetail.tsx`
- **Admin Pages**: `PageManageUsers.tsx`, `PageManageFeatures.tsx`
- **Test Pages**: `test-ui/` directory for development testing

### Providers (`src/providers/`)

React context providers:

- **`QueryProvider.tsx`**: React Query provider
- **`SuspenseProvider.tsx`**: Suspense boundary provider

### Services (`src/services/`)

API services and external integrations:

- **Core Services**: `api.service.ts`, `auth.service.ts`
- **Data Services**: `model.service.ts`, `prototype.service.ts`
- **User Services**: `user.service.ts`, `permission.service.ts`
- **External Services**: `github.service.ts`, `certivity.service.ts`
- **Utility Services**: `upload.service.ts`, `log.service.ts`
- **Base Configuration**: `base.ts` (Axios configuration)

### Stores (`src/stores/`)

Zustand state management:

- **`authStore.ts`**: Authentication state
- **`globalStore.ts`**: Global application state
- **`modelStore.ts`**: Model-related state
- **`socketStore.ts`**: WebSocket connection state

### Styles (`src/styles/`)

- **`index.css`**: Global styles
- **`functional.css`**: Functional utility classes
- **`gradient-purple.css`**: Custom gradient styles

### Types (`src/types/`)

TypeScript type definitions:

- **Core Types**: `common.type.ts`, `index.d.ts`
- **Entity Types**: `user.type.ts`, `model.type.ts`, `api.type.ts`
- **Feature Types**: `widget.type.ts`, `inventory.type.ts`
- **External Types**: `github.type.ts`, `flow.type.ts`

## File Naming Conventions

### Components
- **PascalCase**: `DaButton.tsx`, `PageHome.tsx`
- **Prefixes**:
  - `Da` for design system components
  - `Page` for page components
  - `Form` for form components

### Services
- **camelCase**: `api.service.ts`, `user.service.ts`
- **Suffix**: `.service.ts` for service files

### Hooks
- **camelCase**: `useListModels.ts`, `useGetModel.ts`
- **Prefix**: `use` for custom hooks

### Types
- **camelCase**: `user.type.ts`, `model.type.ts`
- **Suffix**: `.type.ts` for type definition files

### Utilities
- **camelCase**: `utils.ts`, `storage.ts`
- **No suffix** for utility files

## Import Conventions

### Absolute Imports
The project uses absolute imports with the `@` alias pointing to `src/`:

```typescript
// ✅ Good
import { DaButton } from '@/components/atoms/DaButton'
import { useListModels } from '@/hooks/useListModels'
import { Model } from '@/types/model.type'

// ❌ Avoid
import { DaButton } from '../../../components/atoms/DaButton'
```

### Import Order
1. React and external libraries
2. Internal components and hooks
3. Types and utilities
4. Relative imports

```typescript
import React from 'react'
import { useQuery } from '@tanstack/react-query'

import { DaButton } from '@/components/atoms/DaButton'
import { useListModels } from '@/hooks/useListModels'
import { Model } from '@/types/model.type'

import './styles.css'
```

## Configuration Files

### Vite Configuration (`vite.config.ts`)
- Path aliases configuration
- Build optimization
- Development server settings

### TypeScript Configuration (`tsconfig.json`)
- Compiler options
- Path mapping
- Strict type checking

### Tailwind Configuration (`tailwind.config.js`)
- Custom theme configuration
- Plugin setup
- Content paths

### Package Configuration (`package.json`)
- Dependencies and dev dependencies
- Scripts for development, build, and testing
- Project metadata

## Environment Variables

The application uses environment variables for configuration:

```bash
# Backend URLs
VITE_SERVER_BASE_URL=https://backend-core-dev.digital.auto
VITE_SERVER_BASE_WSS_URL=wss://backend-core-dev.digital.auto
VITE_SERVER_VERSION=v2

# External Services
VITE_CACHE_BASE_URL=https://cache.digitalauto.tech
VITE_KIT_SERVER_URL=https://kit.digitalauto.tech

# Authentication
VITE_GITHUB_CLIENT_ID=your_github_client_id

# Feature Flags
VITE_INVENTORY_FRONTEND_URL=https://fe.inventory.digital.auto
```

## Build Output

The build process creates:

```
dist/
├── assets/           # Compiled JavaScript and CSS
├── index.html        # Main HTML file
└── public/           # Static assets (copied from public/)
```

## Development Workflow

1. **Component Development**: Create components in appropriate atomic design folders
2. **Type Definitions**: Define types in `src/types/`
3. **Service Integration**: Add API services in `src/services/`
4. **State Management**: Use Zustand stores for global state
5. **Routing**: Add routes in `src/configs/routes.tsx`
6. **Styling**: Use Tailwind CSS classes and custom components 