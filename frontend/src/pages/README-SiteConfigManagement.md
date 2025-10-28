# Site Config Management Page

## Overview
The `SiteConfigManagement` page is specifically designed for managing site-wide configurations. While the underlying components (`ConfigForm`, `ConfigList`, `ConfigManagementService`) are generic and support all scopes, this page focuses on site-level configuration management.

## Route Information
- **Path**: `/site-config`
- **Component**: `SiteConfigManagement`
- **Access**: Admin users only
- **Navigation**: Available in the admin menu as "Site Config"

## Features

### Site Scope Focus
- Fixed scope: `site` (cannot be changed)
- Target ID: Not applicable for site scope
- All configurations are site-wide by default

### Tab Interface
- **Public Config**: Non-secret configurations accessible to all users
- **Secrets**: Secret configurations only accessible to admins

### Configuration Management
- Create new configurations
- Edit existing configurations
- Delete configurations with confirmation
- Real-time loading and error handling

### Form Features
- Dynamic input components based on value type
- Support for all value types: string, number, boolean, object, array, date, color, image_url
- Scope and target_id selection
- Form validation and error handling

## Usage

### Accessing the Page
1. Navigate to `/site-config`
2. Must be logged in as an admin user
3. Access via the admin menu in the navigation bar

### Managing Site Configurations
1. Navigate to the page (configurations load automatically)
2. Switch between "Public Config" and "Secrets" tabs
3. Use "Create Configuration" button to add new configs
4. Click edit/delete buttons on existing configurations
5. All configurations are automatically set to site scope

## Component Dependencies
- `ConfigForm` - Generic form component
- `ConfigList` - Generic list component
- `ConfigManagementService` - Generic service layer
- `siteConfig` utilities - Enhanced utility functions

## API Endpoints Used
- `GET /v2/site-config` - Get configurations with scope filtering
- `POST /v2/site-config` - Create new configuration
- `PATCH /v2/site-config/:id` - Update configuration
- `DELETE /v2/site-config/:id` - Delete configuration
- `GET /v2/site-config/public` - Get public configurations
- `GET /v2/site-config/all` - Get all configurations (admin only)

## Configuration Types Supported
- **String**: Text values
- **Number**: Numeric values
- **Boolean**: True/false values
- **Object**: JSON objects
- **Array**: JSON arrays
- **Date**: Date/time values
- **Color**: Color picker with hex values
- **Image URL**: Image URLs with preview

## Security
- Public configurations are accessible to all users
- Secret configurations require admin authentication
- All admin operations require proper permissions
- Form validation prevents invalid data submission

## Future Enhancements
- Configuration templates
- Bulk import/export
- Configuration history
- Advanced filtering and search
- Configuration inheritance
- Audit logging
