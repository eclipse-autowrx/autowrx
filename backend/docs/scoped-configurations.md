# Scoped Configuration System

A flexible configuration management system that supports multiple scopes (site, user, model, prototype, api) with targeted configurations.

## Overview

The configuration system has been enhanced to support scoped configurations, allowing different configuration values for different contexts:

- **Site Scope**: Global site-wide configurations
- **User Scope**: User-specific configurations
- **Model Scope**: Model-specific configurations  
- **Prototype Scope**: Prototype-specific configurations
- **API Scope**: API-specific configurations

## Database Schema

### SiteConfig Model

```javascript
{
  key: String,           // Configuration key (unique within scope+target)
  scope: String,         // 'site', 'user', 'model', 'prototype', 'api'
  target_id: ObjectId,   // Required for non-site scopes
  value: Mixed,          // Configuration value (any type)
  valueType: String,     // 'string', 'number', 'boolean', 'object', 'array', 'date', 'color', 'image_url'
  secret: Boolean,       // Whether config is secret (admin only)
  description: String,   // Human-readable description
  category: String,      // Configuration category
  created_by: ObjectId,  // User who created the config
  updated_by: ObjectId,  // User who last updated the config
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

- `{ key: 1, scope: 1, target_id: 1 }` - Unique constraint
- `{ scope: 1, target_id: 1, secret: 1 }` - Query optimization
- `{ category: 1, scope: 1, secret: 1 }` - Category filtering

## API Endpoints

### Public Endpoints (No Authentication)

#### Get Public Configs by Scope
```http
GET /v2/site-config/public?scope=site
GET /v2/site-config/public?scope=user&target_id=USER_ID
GET /v2/site-config/public?scope=model&target_id=MODEL_ID
```

#### Get Single Public Config
```http
GET /v2/site-config/public/KEY?scope=site
GET /v2/site-config/public/KEY?scope=user&target_id=USER_ID
```

#### Scoped Public Routes
```http
GET /v2/site-config/public/site
GET /v2/site-config/public/user/USER_ID
GET /v2/site-config/public/model/MODEL_ID
GET /v2/site-config/public/user/USER_ID/KEY
```

### Admin Endpoints (Authentication Required)

#### Get All Configs by Scope
```http
GET /v2/site-config/all?scope=site
GET /v2/site-config/all?scope=user&target_id=USER_ID
```

#### Scoped Admin Routes
```http
GET /v2/site-config/site
GET /v2/site-config/user/USER_ID
GET /v2/site-config/model/MODEL_ID
GET /v2/site-config/user/USER_ID/all
```

#### Create Configuration
```http
POST /v2/site-config
{
  "key": "theme-color",
  "scope": "user",
  "target_id": "USER_ID",
  "value": "#FF0000",
  "valueType": "color",
  "secret": false,
  "description": "User's preferred theme color",
  "category": "ui"
}
```

## Usage Examples

### Backend Usage

```javascript
const { siteConfigService } = require('../services');

// Get site-wide config
const siteLogo = await siteConfigService.getSiteConfigValue('site-logo', 'site');

// Get user-specific config
const userTheme = await siteConfigService.getSiteConfigValue('theme-color', 'user', userId);

// Get model-specific config
const modelSettings = await siteConfigService.getSiteConfigValue('settings', 'model', modelId);

// Get all public configs for a user
const userConfigs = await siteConfigService.getPublicSiteConfigs('user', userId);

// Create user-specific config
await siteConfigService.createSiteConfig({
  key: 'preferred-language',
  scope: 'user',
  target_id: userId,
  value: 'en',
  secret: false,
  category: 'preferences'
});
```

### Frontend Usage

```typescript
import { getConfig, getConfigs, getPublicConfigs } from '@/utils/siteConfig';

// Get site-wide config
const siteLogo = await getConfig('site-logo', 'site');

// Get user-specific config
const userTheme = await getConfig('theme-color', 'user', userId);

// Get model-specific config
const modelSettings = await getConfig('settings', 'model', modelId);

// Get all public configs for a user
const userConfigs = await getPublicConfigs('user', userId);

// React hook usage
const { configs, loading, error } = useSiteConfigs(['theme-color', 'language'], 'user', userId);
```

## Configuration Hierarchy

The system supports a hierarchical approach where configurations can be inherited:

1. **Site Level**: Global defaults for all users
2. **User Level**: User-specific overrides
3. **Model Level**: Model-specific configurations
4. **Prototype Level**: Prototype-specific configurations
5. **API Level**: API-specific configurations

## Security Model

- **Public Configs** (`secret: false`): Accessible to all users, even without authentication
- **Secret Configs** (`secret: true`): Only accessible by admin users and internal backend

## Frontend Interface

### Scope Selection
The admin interface includes:
- Scope dropdown (site, user, model, prototype, api)
- Target ID input (for non-site scopes)
- Load button to fetch configurations for selected scope

### Form Enhancements
- Scope selection in create/edit forms
- Target ID field (conditional on scope selection)
- Validation for required target_id when scope is not 'site'

## Migration from Site-Only Configs

Existing site configurations will automatically have:
- `scope: 'site'`
- `target_id: undefined`

No data migration is required as the system is backward compatible.

## Best Practices

1. **Use appropriate scopes**: Don't use user scope for site-wide settings
2. **Consistent naming**: Use consistent key naming across scopes
3. **Documentation**: Always provide descriptions for configurations
4. **Categorization**: Use categories to group related configurations
5. **Security**: Mark sensitive data as secret
6. **Validation**: Validate target_id exists for the specified scope

## Common Use Cases

### User Preferences
```javascript
// User's theme preference
{
  key: 'theme-color',
  scope: 'user',
  target_id: 'USER_ID',
  value: '#007bff',
  valueType: 'color',
  secret: false,
  category: 'ui'
}
```

### Model-Specific Settings
```javascript
// Model-specific API settings
{
  key: 'api-endpoint',
  scope: 'model',
  target_id: 'MODEL_ID',
  value: 'https://api.example.com/v2',
  valueType: 'string',
  secret: true,
  category: 'api'
}
```

### Site-Wide Branding
```javascript
// Global site logo
{
  key: 'site-logo',
  scope: 'site',
  value: 'https://example.com/logo.png',
  valueType: 'image_url',
  secret: false,
  category: 'branding'
}
```

This scoped configuration system provides the flexibility to manage configurations at different levels while maintaining security and ease of use.
