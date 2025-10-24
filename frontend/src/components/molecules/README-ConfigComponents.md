# Configuration Management Components

This document describes the renamed and refactored configuration management components that support scoped configurations.

## Component Overview

### ConfigForm (`ConfigForm.tsx`)
**Purpose**: Generic form component for creating and editing configurations across all scopes
**Features**:
- Scope selection (site, user, model, prototype, api)
- Conditional target_id input for non-site scopes
- Dynamic input components based on value type
- Support for all value types: string, number, boolean, object, array, date, color, image_url
- Form validation and error handling

**Usage**:
```tsx
<ConfigForm
  config={existingConfig}
  onSave={handleSave}
  onCancel={handleCancel}
  isLoading={false}
/>
```

### ConfigList (`ConfigList.tsx`)
**Purpose**: Generic list component for displaying configurations across all scopes
**Features**:
- Displays configurations with scope and target information
- Color-coded value type indicators
- Special rendering for color and image_url values
- Edit/delete actions with confirmation
- Loading states and empty states

**Usage**:
```tsx
<ConfigList
  configs={configurations}
  onEdit={handleEdit}
  onDelete={handleDelete}
  isLoading={false}
/>
```

## Service Layer

### ConfigManagementService (`configManagement.service.ts`)
**Purpose**: Service layer for all configuration operations across all scopes
**Features**:
- Scoped configuration access (site, user, model, prototype, api)
- Public and admin endpoints
- CRUD operations for all scopes
- Bulk operations support
- TypeScript interfaces for type safety

**Key Interfaces**:
- `Config` - Main configuration interface
- `CreateConfigRequest` - For creating new configurations
- `UpdateConfigRequest` - For updating existing configurations
- `ConfigQueryParams` - For querying configurations

**Usage**:
```typescript
import { configManagementService } from '@/services/configManagement.service';

// Get user-specific config
const userTheme = await configManagementService.getSiteConfigValue('theme-color', 'user', userId);

// Get all public configs for a model
const modelConfigs = await configManagementService.getPublicSiteConfigs('model', modelId);

// Create new configuration
await configManagementService.createConfig({
  key: 'preferred-language',
  scope: 'user',
  target_id: userId,
  value: 'en',
  secret: false,
  category: 'preferences'
});
```

## Page Component

### ConfigManagement (`ConfigManagement.tsx`)
**Purpose**: Main admin page for managing configurations across all scopes
**Features**:
- Scope selection interface
- Target ID input for scoped configurations
- Tab-based interface (Public Config vs Secrets)
- Real-time configuration loading
- Modal forms for creating/editing
- Error handling and loading states

**Route**: `/config-manage`

## Utility Functions

### Enhanced siteConfig utilities (`siteConfig.ts`)
**Purpose**: Utility functions for easy configuration access across all scopes
**Features**:
- Scoped configuration access
- Caching support for different scopes
- Backward compatibility
- Error handling

**Usage**:
```typescript
import { getConfig, getConfigs, getPublicConfigs } from '@/utils/siteConfig';

// Get site-wide config
const siteLogo = await getConfig('site-logo', 'site');

// Get user-specific config
const userTheme = await getConfig('theme-color', 'user', userId);

// Get all public configs for a scope
const userConfigs = await getPublicConfigs('user', userId);
```

## Naming Convention

The components follow a generic naming convention that reflects their broader scope:

- **ConfigForm** (was SiteConfigForm) - Generic form for any scope
- **ConfigList** (was SiteConfigList) - Generic list for any scope
- **ConfigManagement** (was SiteManagement) - Generic management page
- **ConfigManagementService** (was SiteManagementService) - Generic service
- **Config** (was SiteConfig) - Generic configuration interface

## Scope Support

All components now support the following scopes:

1. **Site Scope** (`scope: 'site'`)
   - Global site-wide configurations
   - No target_id required

2. **User Scope** (`scope: 'user'`)
   - User-specific configurations
   - Requires user ID as target_id

3. **Model Scope** (`scope: 'model'`)
   - Model-specific configurations
   - Requires model ID as target_id

4. **Prototype Scope** (`scope: 'prototype'`)
   - Prototype-specific configurations
   - Requires prototype ID as target_id

5. **API Scope** (`scope: 'api'`)
   - API-specific configurations
   - Requires API ID as target_id

## Migration Notes

- All existing site configurations continue to work with `scope: 'site'`
- No data migration required
- Backward compatibility maintained
- Route changed from `/site-manage` to `/config-manage`
- Navigation updated to "Config Management"

## Future Enhancements

Potential improvements could include:
- Scope-specific validation rules
- Configuration inheritance between scopes
- Bulk operations across scopes
- Configuration templates
- Advanced filtering and search
- Configuration history and audit trails
