# Site Management Page

A comprehensive admin interface for managing site configurations with key-value pairs.

## Features

### Two-Tab Interface
- **Public Config**: Non-secret configurations visible to all users
- **Secrets**: Admin-only configurations for sensitive data

### Configuration Management
- Create, read, update, and delete configurations
- Support for multiple data types:
  - String
  - Number
  - Boolean
  - Object (JSON)
  - Array (JSON)
  - Date

### Security Model
- **Public configs** (`secret: false`): Accessible to all users
- **Secret configs** (`secret: true`): Admin-only access

### User Interface
- Clean, modern design with Tailwind CSS
- Responsive layout
- Modal forms for creating/editing
- Confirmation dialogs for deletions
- Loading states and error handling
- Value type indicators with color coding

## Components

### SiteManagement.tsx
Main page component with tab navigation and state management.

### SiteConfigForm.tsx
Form component for creating and editing configurations with:
- Dynamic input types based on value type
- JSON validation for object/array types
- Form validation and error handling

### SiteConfigList.tsx
List component displaying configurations with:
- Value formatting based on type
- Color-coded type indicators
- Edit/delete actions
- Confirmation for deletions

### siteManagement.service.ts
Service layer for API communication with:
- TypeScript interfaces
- Error handling
- Promise-based API calls

## Usage

1. Navigate to `/site-manage` (admin access required)
2. Switch between "Public Config" and "Secrets" tabs
3. Click "Add Configuration" to create new configs
4. Click "Edit" on existing configs to modify them
5. Click "Delete" to remove configurations (with confirmation)

## API Integration

The page integrates with the backend site management API:
- `GET /v2/site-config/public` - Get public configs
- `GET /v2/site-config/all` - Get all configs (admin)
- `POST /v2/site-config` - Create config (admin)
- `PATCH /v2/site-config/key/:key` - Update config (admin)
- `DELETE /v2/site-config/key/:key` - Delete config (admin)

## Common Configuration Examples

### Branding
```json
{
  "key": "site-logo",
  "value": "https://example.com/logo.png",
  "secret": false,
  "category": "branding",
  "description": "Main site logo URL"
}
```

### API Keys (Secret)
```json
{
  "key": "llm-api-key",
  "value": "sk-1234567890abcdef",
  "secret": true,
  "category": "api",
  "description": "OpenAI API key"
}
```

### Feature Flags
```json
{
  "key": "enable-registration",
  "value": true,
  "secret": false,
  "category": "features",
  "description": "Allow user registration"
}
```
