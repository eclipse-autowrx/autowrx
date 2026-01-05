# API Plugin System Architecture Guide

## Overview

The API Plugin System allows administrators to define custom API set schemas and enables users to create instances of these API sets. The system supports three types of API structures: Tree (hierarchical), List (flat), and Graph (with relationships).

### Purpose

- Enable admins to define reusable API set schemas
- Allow users to create and manage API set instances
- Support multiple API structure types (Tree, List, Graph)
- Provide scope-based access control (system vs user)
- Integrate API sets with vehicle models

### Use Cases

1. **COVESA API**: Tree-structured vehicle signal specification
2. **REST API**: Flat list of REST endpoints
3. **USP API**: Graph-structured API with dependencies

## Architecture

### System Components

```
┌─────────────┐
│  PluginAPI  │  ← Schema definitions (admin-created)
└──────┬──────┘
       │ defines structure
       ↓
┌──────────────────┐
│PluginApiInstance │  ← Data instances (user/admin-created)
└──────┬───────────┘
       │ referenced by
       ↓
┌──────────┐
│  Model   │  ← Vehicle models link to instances
└──────────┘
```

### Data Flow

1. Admin creates PluginAPI schema defining structure
2. User/Admin creates PluginApiInstance following schema
3. Model references PluginApiInstance via `plugin_api_instances` field

## Data Models

### PluginAPI Schema

Defines the template/structure for API sets:

```javascript
{
  code: 'rest_api',              // Unique identifier
  name: 'REST API',               // Display name
  type: 'list',                   // 'tree' | 'list' | 'graph'
  attributes: [                   // Required fields for each item
    { name: 'name', data_type: 'string', required: true },
    { name: 'path', data_type: 'string', required: true }
  ],
  relationships: [],               // For graph type
  tree_config: {},                // For tree type
  is_active: true
}
```

### PluginApiInstance Schema

Stores actual API data:

```javascript
{
  plugin_api: ObjectId,            // Reference to PluginAPI
  plugin_api_code: 'rest_api',     // Denormalized for queries
  scope: 'system',                 // 'system' | 'user'
  owner: ObjectId,                 // Creator/owner
  data: {
    items: [                       // Array of API items
      {
        id: 'api1',
        path: '/api/users',
        name: 'Get Users',
        // ... other attributes
      }
    ],
    metadata: {}
  }
}
```

### Model Integration

Models reference PluginApiInstances:

```javascript
{
  plugin_api_instances: [ObjectId, ...]    // Instance references
}
```

## API Types

### Tree API

Hierarchical structure with parent-child relationships.

**Structure:**
- Items have `path` (e.g., "ABC.X1.X2")
- Items have `parent_id` referencing parent path
- Supports nested hierarchies

**Example:**
```json
{
  "items": [
    { "id": "ABC", "path": "ABC", "name": "ABC" },
    { "id": "ABC.X1", "path": "ABC.X1", "parent_id": "ABC", "name": "X1" },
    { "id": "ABC.X1.X2", "path": "ABC.X1.X2", "parent_id": "ABC.X1", "name": "X2" }
  ]
}
```

**Use Case:** COVESA VSS structure

### List API

Flat array of API endpoints.

**Structure:**
- Items are independent
- No parent-child relationships
- Similar to Swagger/REST API documentation

**Example:**
```json
{
  "items": [
    {
      "id": "get-users",
      "path": "/api/v1/users",
      "method": "GET",
      "name": "Get Users"
    },
    {
      "id": "create-user",
      "path": "/api/v1/users",
      "method": "POST",
      "name": "Create User"
    }
  ]
}
```

**Use Case:** REST API documentation

### Graph API

Nodes with relationships/edges between them.

**Structure:**
- Items are nodes
- Items have `relationships` array
- Relationships reference other items by ID

**Example:**
```json
{
  "items": [
    {
      "id": "service1",
      "name": "Service 1",
      "relationships": [
        { "relationship_name": "depends_on", "target_item_id": "service2" }
      ]
    },
    {
      "id": "service2",
      "name": "Service 2"
    }
  ]
}
```

**Use Case:** Service dependencies, API relationships

## Scope System

### System Scope

- Created by admin users
- Accessible by all users
- Shared across the platform
- Use for standard API sets

### User Scope

- Created by any user
- Only accessible by creator
- Private to the user
- Use for custom/personal API sets

## Permission Model

### PluginAPI

- **Create/Update/Delete**: Admin only
- **Read**: Public (all users)

### PluginApiInstance

- **System scope**:
  - Create: Admin only
  - Read: All users
  - Update/Delete: Admin only

- **User scope**:
  - Create: Any authenticated user
  - Read: Creator only
  - Update/Delete: Creator only

### Model Integration

- User must have write permission on model
- User must have access to PluginApiInstance (system scope or owner)

## Storage Strategy

### Single Document Approach

- Entire API set stored in one `PluginApiInstance` document
- All items stored in `data.items` array
- MongoDB document size limit: 16MB

### Size Considerations

- **Typical size**: Hundreds of items × 1-5KB = 100KB-5MB
- **Risk**: Low for current use case
- **Future**: Consider chunking if sets grow beyond thousands of items

### Update Operations

- Use MongoDB array update operators for efficient partial updates
- `$set`, `$push`, `$pull`, positional `$` operators
- Supports adding/updating/removing individual items

## Usage Examples

### Creating a PluginAPI Schema

```javascript
POST /v2/system/plugin-api
{
  "code": "covesa",
  "name": "COVESA API",
  "type": "tree",
  "attributes": [
    { "name": "name", "data_type": "string", "required": true },
    { "name": "value", "data_type": "mixed", "required": false }
  ],
  "tree_config": {
    "separator": ".",
    "max_depth": 10
  }
}
```

### Creating an Instance

```javascript
POST /v2/vehicle-data/plugin-api-instances
{
  "plugin_api": "<plugin_api_id>",
  "plugin_api_code": "covesa",
  "scope": "system",
  "name": "Vehicle Signals",
  "data": {
    "items": [
      { "id": "Vehicle", "path": "Vehicle", "name": "Vehicle" },
      { "id": "Vehicle.Speed", "path": "Vehicle.Speed", "parent_id": "Vehicle", "name": "Speed" }
    ]
  }
}
```

### Linking to Model

```javascript
PATCH /v2/vehicle-data/models/{modelId}
{
  "plugin_api_instances": ["<instance_id>"]
}
```

### Adding an Item

```javascript
POST /v2/vehicle-data/plugin-api-instances/{id}/items
{
  "item": {
    "id": "Vehicle.Battery",
    "path": "Vehicle.Battery",
    "parent_id": "Vehicle",
    "name": "Battery"
  }
}
```

## Validation

### Schema Validation

- Items must match PluginAPI attribute definitions
- Required attributes must be present
- Data types must match schema

### Structure Validation

- **Tree**: Parent references must exist
- **Graph**: Relationship targets must exist
- **List**: No structural validation

### Permission Validation

- Scope-based access checks
- Ownership verification for user-scoped instances
- Model write permission checks

## Migration Guide

### From custom_apis

The existing `custom_apis` field in Model can coexist with the new system. To migrate:

1. Create PluginAPI schema for custom APIs
2. Create PluginApiInstance from existing `custom_apis` data
3. Link instance to model via `plugin_api_instances`
4. Optionally remove `custom_apis` field

### Backward Compatibility

- `custom_apis` field remains supported
- Existing models continue to work
- New models can use PluginAPI system

## Best Practices

### Schema Design

1. **Keep attributes minimal**: Only include essential fields
2. **Use appropriate types**: Choose tree/list/graph based on structure
3. **Version schemas**: Use version field for schema evolution
4. **Document attributes**: Provide descriptions for clarity

### Instance Management

1. **Use system scope**: For shared, standard API sets
2. **Use user scope**: For personal/custom API sets
3. **Validate before save**: Ensure data matches schema
4. **Keep items organized**: Maintain consistent structure

### Performance

1. **Index frequently queried fields**: `plugin_api_code`, `scope`, `owner`
2. **Limit item count**: Keep sets under 1000 items when possible
3. **Use pagination**: For large instance lists
4. **Cache schemas**: PluginAPI schemas rarely change

## Testing

Run the self-test script to validate the system:

```bash
# Run tests and clean up
node src/scripts/test-plugin-api-system.js

# Keep test data for inspection
node src/scripts/test-plugin-api-system.js --keep-data

# Clean existing test data
node src/scripts/test-plugin-api-system.js --clean
```

The test script validates:
- CRUD operations
- Scope-based permissions
- Model integration
- Validation rules
- Item-level operations

