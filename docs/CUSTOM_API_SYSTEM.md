# Custom API System Documentation

## Overview

The Custom API System allows administrators to define their own API schemas and create instances of API sets. This system provides flexibility to define different types of API structures (Tree, List, or Graph) and customize how they are displayed and managed.

## Architecture

The system consists of two main components:

1. **CustomApiSchema**: Defines the schema/template for API items
2. **CustomApiSet**: Stores actual data instances of API sets

### CustomApiSchema

A `CustomApiSchema` defines:
- The structure of API items (using JSON Schema)
- How items are displayed in lists (`display_mapping`)
- How item IDs are generated (`id_format`)
- Type color configurations (`typeMetadata`)
- API type (Tree, List, or Graph)

### CustomApiSet

A `CustomApiSet` contains:
- Reference to a `CustomApiSchema`
- Actual API items (stored in `data.items`)
- Metadata (name, description, avatar, provider URL)
- Scope (system or user)

## Schema Structure

### Basic Schema Format

The `schema` field in `CustomApiSchema` is a JSON Schema string that defines the structure of API items. It follows the JSON Schema Draft 7 specification.

#### Example: Basic REST API Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://example.com/sample-apis.schema.json",
  "title": "Sample APIs Schema",
  "description": "Schema for validating API endpoint definitions",
  "type": "array",
  "items": {
    "type": "object",
    "id_format": "{method}:{path}",
    "display_mapping": {
      "title": "path",
      "description": "summary",
      "type": "method",
      "style": "compact",
      "image": null
    },
    "properties": {
      "path": {
        "type": "string",
        "description": "API endpoint path (e.g., /api/v1/users)",
        "required": true
      },
      "method": {
        "type": "string",
        "enum": ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
        "description": "HTTP method",
        "required": true
      },
      "summary": {
        "type": "string",
        "description": "Brief summary of the API endpoint"
      },
      "description": {
        "type": "string",
        "description": "Detailed description of the API endpoint"
      },
      "parameters": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "type": { "type": "string" },
            "required": { "type": "boolean" },
            "description": { "type": "string" }
          }
        }
      }
    },
    "required": ["path", "method"]
  },
  "typeMetadata": [
    {
      "type": "GET",
      "color": "#10b981",
      "sampleCode": "fetch('/api/users')"
    },
    {
      "type": "POST",
      "color": "#3b82f6",
      "sampleCode": "fetch('/api/users', { method: 'POST', body: JSON.stringify(data) })"
    }
  ]
}
```

### Schema Fields

#### Root Level Fields

- **`$schema`**: JSON Schema version (typically `"http://json-schema.org/draft-07/schema#"`)
- **`$id`**: Unique identifier for the schema
- **`title`**: Human-readable title
- **`description`**: Description of the schema
- **`type`**: Must be `"array"` for API item schemas
- **`items`**: Schema definition for individual API items
- **`typeMetadata`**: Array of type color configurations (see Type Metadata section)

#### Items Schema Fields

- **`type`**: Must be `"object"` for API items
- **`id_format`**: Template string for generating item IDs (e.g., `"{method}:{path}"`)
- **`display_mapping`**: Configuration for how items are displayed (see Display Mapping section)
- **`properties`**: Object defining the fields/properties of each API item
- **`required`**: Array of required field names

## ID Format Template

The `id_format` field allows flexible ID generation using template strings.

### Template Syntax

Use curly braces `{}` to reference field names:
- `{method}` - References the `method` field
- `{path}` - References the `path` field
- `{method}:{path}` - Combines method and path with a colon separator

### Examples

```json
{
  "id_format": "{method}:{path}"
}
```

This generates IDs like: `GET:/api/v1/users`, `POST:/api/v1/users`

```json
{
  "id_format": "{name}_{version}"
}
```

This generates IDs like: `user_service_v1`, `auth_service_v2`

### ID Generation Rules

1. If `id_format` is provided, IDs are generated from the template
2. If template fields are missing, empty strings are used
3. Multiple separators (e.g., `::`) are collapsed to single separator
4. Leading/trailing separators are removed
5. If `id_format` is not provided, the system falls back to:
   - Common identifier fields (`name`, `path`, `endpoint`, `node_id`, `key`, `code`, `label`, `title`)
   - Combination of `path` and `method` (if both exist)
   - Index-based IDs (`item_1`, `item_2`, etc.)

## Display Mapping

The `display_mapping` configuration defines how API items are displayed in lists and detail views.

### Structure

```json
{
  "display_mapping": {
    "title": "path",
    "description": "summary",
    "type": "method",
    "style": "compact",
    "image": "Image"
  }
}
```

### Fields

- **`title`**: Field name to use as the item title in lists
- **`description`**: Field name to use as the item description/subtitle
- **`type`**: Field name to use as the item type/badge
- **`style`**: Display style for list items (see Display Styles)
- **`image`**: Field name that contains the image URL for the item

### Display Styles

#### `compact` (Default)

Standard list view with title, description, and type badge on separate lines.

```
┌─────────────────────────────────┐
│ Title                           │
│ Description text                │
│ [Type Badge]                    │
└─────────────────────────────────┘
```

#### `badge`

Card-style layout with title and type on the same line, description below.

```
┌─────────────────────────────────┐
│ Title              [Type Badge] │
│ Description text                │
└─────────────────────────────────┘
```

#### `badge-image`

Card-style layout with image thumbnail, title, description, and type badge.

```
┌─────────────────────────────────┐
│ [Image]  Title    [Type Badge]  │
│          Description            │
└─────────────────────────────────┘
```

### Field Mapping Examples

#### Using Template Strings

You can use template strings in field mappings:

```json
{
  "display_mapping": {
    "title": "{method}:{path}",
    "description": "summary",
    "type": "method"
  }
}
```

#### Using Direct Field Names

```json
{
  "display_mapping": {
    "title": "Name",
    "description": "ServiceDescription",
    "type": "Type"
  }
}
```

## Type Metadata and Color Configuration

The `typeMetadata` array defines color schemes and metadata for different API types.

### Structure

```json
{
  "typeMetadata": [
    {
      "type": "GET",
      "color": "#10b981",
      "sampleCode": "fetch('/api/users')"
    },
    {
      "type": "POST",
      "color": "#3b82f6",
      "sampleCode": "fetch('/api/users', { method: 'POST', body: JSON.stringify(data) })"
    },
    {
      "type": "Atomic Service",
      "color": "#8b5cf6"
    }
  ]
}
```

### Fields

- **`type`**: The type name (case-sensitive, must match the value in the type field)
- **`color`**: Hex color code for the type badge (e.g., `"#10b981"`)
- **`sampleCode`**: Optional sample code snippet for the type
- Additional custom fields are allowed

### Color Assignment Priority

The system assigns colors to types in the following priority order:

1. **Type Metadata**: Colors defined in `typeMetadata` array (highest priority)
2. **Well-Known Types**: Predefined colors for common types (HTTP methods, COVESA types, etc.)
3. **Auto-Assignment**: Automatic assignment from default color palette (10 colors)

### Default Color Palette

When types don't have explicit colors, the system uses this palette:

```javascript
[
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#eab308', // yellow-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
]
```

### Well-Known Type Colors

These types automatically get these colors (unless overridden in `typeMetadata`):

**HTTP Methods:**
- `GET`: `#10b981` (emerald)
- `POST`: `#3b82f6` (blue)
- `PUT`: `#f59e0b` (amber)
- `PATCH`: `#8b5cf6` (violet)
- `DELETE`: `#ef4444` (red)
- `HEAD`: `#06b6d4` (cyan)
- `OPTIONS`: `#6366f1` (indigo)

**COVESA Types:**
- `BRANCH`: `#a855f7` (purple)
- `SENSOR`: `#10b981` (emerald)
- `ACTUATOR`: `#eab308` (yellow)
- `ATTRIBUTE`: `#0ea5e9` (sky)

**Service Types:**
- `ATOMIC SERVICE`: `#8b5cf6` (violet)
- `BASIC SERVICE`: `#3b82f6` (blue)
- `ATOMIC`: `#8b5cf6` (violet)
- `BASIC`: `#3b82f6` (blue)

## Complete Example: Vehicle Service API Schema

This example shows a complete schema for vehicle service APIs:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://example.com/vehicle-services.schema.json",
  "title": "Vehicle Services Schema",
  "description": "Schema for vehicle service API definitions",
  "type": "array",
  "items": {
    "type": "object",
    "id_format": "{ServiceName}",
    "display_mapping": {
      "title": "Name",
      "description": "ServiceDescription",
      "type": "Type",
      "style": "badge",
      "image": null
    },
    "properties": {
      "Name": {
        "type": "string",
        "description": "Service name (e.g., Vehicle.Body.Lights.TurnLight)"
      },
      "ServiceName": {
        "type": "string",
        "description": "Service identifier (e.g., BO_Atm_FobKey)"
      },
      "Type": {
        "type": "string",
        "enum": ["Atomic Service", "Basic Service"],
        "description": "Service type"
      },
      "ServiceDescription": {
        "type": "string",
        "description": "Service description"
      },
      "ServiceID": {
        "type": "string",
        "format": "uuid",
        "description": "Unique service identifier"
      },
      "Fields": {
        "type": "object",
        "description": "Service fields/notifications",
        "additionalProperties": {
          "type": "object",
          "properties": {
            "RPCType": { "type": "string" },
            "name": { "type": "string" },
            "method_id": { "type": "string" },
            "desc": { "type": "string" },
            "field_type": { "type": "string" },
            "ref_data_type": { "type": "string" }
          }
        }
      },
      "Methods": {
        "type": "object",
        "description": "Service methods",
        "additionalProperties": {
          "type": "object",
          "properties": {
            "RPCType": { "type": "string" },
            "name": { "type": "string" },
            "method_id": { "type": "string" },
            "desc": { "type": "string" },
            "inputs": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": { "type": "string" },
                  "description": { "type": "string" }
                }
              }
            },
            "outputs": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": { "type": "string" },
                  "description": { "type": "string" }
                }
              }
            }
          }
        }
      },
      "DataTypes": {
        "type": "object",
        "description": "Data type definitions",
        "additionalProperties": {
          "type": "object",
          "properties": {
            "version": { "type": "string" },
            "description": { "type": "string" },
            "category": { "type": "string" },
            "baseDatatype": { "type": "string" },
            "resolution": { "type": "number" },
            "offset": { "type": "number" },
            "physicalMin": { "type": "number" },
            "physicalMax": { "type": "number" },
            "initialValue": { "type": "number" },
            "invalidValue": { "type": "number" },
            "unit": { "type": "string" },
            "values": { "type": "object" },
            "members": { "type": "object" }
          }
        }
      }
    },
    "required": ["Name", "ServiceName", "Type"]
  },
  "typeMetadata": [
    {
      "type": "Atomic Service",
      "color": "#8b5cf6"
    },
    {
      "type": "Basic Service",
      "color": "#3b82f6"
    }
  ]
}
```

## CustomApiSet Data Structure

A `CustomApiSet` stores actual API items in the `data.items` array:

```json
{
  "id": "custom-api-set-id",
  "custom_api_schema": "schema-object-id",
  "custom_api_schema_code": "vehicle-services",
  "scope": "system",
  "name": "Vehicle Services v1",
  "description": "Vehicle service APIs",
  "avatar": "https://example.com/logo.svg",
  "provider_url": "https://example.com/docs",
  "data": {
    "items": [
      {
        "id": "BO_Atm_FobKey",
        "Name": "Vehicle.Body.Lights.TurnLight",
        "ServiceName": "BO_Atm_FobKey",
        "Type": "Atomic Service",
        "ServiceDescription": "Radio frequency key",
        "ServiceID": "7e8f9b2a-c531-4d06-9e84-75c13f62d0a8",
        "Fields": {
          "ntfKeyRemCmd": {
            "RPCType": "Field",
            "name": "ntfKeyRemCmd",
            "method_id": "0x8001",
            "desc": "Notification key remote control command",
            "field_type": "Notification Event",
            "ref_data_type": "KeyRemCmdInfo_stru"
          }
        },
        "DataTypes": {
          "RollgCtr_u8": {
            "version": "1.0.0",
            "description": "Rolling count",
            "category": "Integer",
            "baseDatatype": "uint8",
            "resolution": 1,
            "offset": 0,
            "physicalMin": 0,
            "physicalMax": 255,
            "initialValue": 0,
            "invalidValue": 255,
            "unit": "-"
          }
        }
      }
    ],
    "metadata": {}
  }
}
```

## API Types

### Tree Type

For hierarchical API structures with parent-child relationships.

**Features:**
- Items can have `parent_id` field
- Supports nested navigation
- Tree visualization

**Example:**
```json
{
  "type": "tree",
  "tree_config": {
    "root_field": "parent_id",
    "root_value": null
  }
}
```

### List Type

For flat lists of APIs (similar to REST API documentation).

**Features:**
- Simple array of items
- No hierarchical structure
- Best for REST APIs, OpenAPI specs

**Example:**
```json
{
  "type": "list"
}
```

### Graph Type

For APIs with complex relationships between items.

**Features:**
- Items can have `relationships` array
- Supports one-to-one, one-to-many, many-to-many relationships
- Graph visualization

**Example:**
```json
{
  "type": "graph",
  "relationships": [
    {
      "name": "depends_on",
      "type": "one-to-many",
      "target_api": "service_api",
      "description": "Service dependencies"
    }
  ]
}
```

## Scope and Access Control

### System Scope

- Created and managed by administrators
- Visible to all users
- Used for shared API definitions

### User Scope

- Created by individual users
- Private to the creator
- Used for personal API collections

## Best Practices

1. **Schema Design**
   - Use descriptive field names
   - Include `description` for all fields
   - Mark required fields explicitly
   - Use enums for constrained values

2. **ID Format**
   - Use unique, stable identifiers
   - Include enough information to identify the item
   - Avoid special characters that might cause issues

3. **Display Mapping**
   - Choose fields that provide clear context
   - Use `style: "badge-image"` when images enhance understanding
   - Keep title fields concise

4. **Type Metadata**
   - Define colors for all common types
   - Use consistent color schemes across related schemas
   - Include sample code when helpful

5. **Data Organization**
   - Keep items in a single `CustomApiSet` document (up to 16MB MongoDB limit)
   - Use metadata field for additional information
   - Structure nested objects logically

## Import/Export

### CustomApiSchema Export

Exports as JSON file containing:
- Schema definition
- Display mapping
- Type metadata
- All configuration

### CustomApiSet Export

Exports as ZIP file containing:
- `schema.json`: The associated `CustomApiSchema`
- `data.json`: The API set data (`data.items`)
- `avatar.{ext}`: The avatar image (preserves original format: SVG, PNG, JPG, WebP, GIF)

### Import Process

1. For schemas: Import JSON file, create new schema if code doesn't exist
2. For sets: Extract ZIP, check if schema exists (by code), create schema if needed, then import data

## Integration with Models

Models can reference `CustomApiSet` instances via the `custom_api_sets` field:

```json
{
  "model": {
    "id": "model-id",
    "name": "My Model",
    "custom_api_sets": [
      "custom-api-set-id-1",
      "custom-api-set-id-2"
    ]
  }
}
```

When viewing a model's API page:
- COVESA API tab shows standard COVESA APIs
- Each `CustomApiSet` gets its own tab
- Tabs show the count of items in each set

## Troubleshooting

### ID Generation Issues

**Problem**: IDs are not being generated automatically.

**Solution**: 
- Ensure `id_format` is defined in the schema
- Check that required fields (referenced in template) are filled
- Verify field names match exactly (case-sensitive)

### Display Mapping Not Working

**Problem**: List items don't show expected fields.

**Solution**:
- Verify `display_mapping` is in the schema JSON (not just top-level)
- Check field names match exactly (case-sensitive)
- Ensure `style` is one of: `compact`, `badge`, `badge-image`

### Type Colors Not Showing

**Problem**: Types don't have colors or show default colors.

**Solution**:
- Add `typeMetadata` array to schema
- Ensure `type` values match exactly (case-sensitive)
- Use hex color codes (e.g., `"#10b981"`)

### Path Field Not Showing

**Problem**: Required `path` field doesn't appear in form.

**Solution**:
- Ensure `path` is not in `excludeFields`
- Check that `path` is defined in schema `properties`
- Verify `path` is in `required` array if it should be required

## Related Documentation

- [Model Plugin Page](./MODEL_PLUGIN_PAGE.md)
- [Plugin Architecture](./plugin/02-architecture.md)
- [API Reference](./plugin/04-api-reference.md)

