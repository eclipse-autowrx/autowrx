## Plugin Endpoints (/v2/system/plugin)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Public | List plugins (paginated). |
| GET | /id/:id | Public | Get plugin by ID. |
| GET | /slug/:slug | Public | Get plugin by slug. |
| POST | / | Required + Admin | Create a plugin (remote or internal). |
| PUT | /:id | Required + Admin | Update a plugin by ID (slug immutable). |
| DELETE | /:id | Required + Admin | Delete a plugin by ID. |
| POST | /upload/:slug | Required + Admin | Upload a ZIP for an internal plugin and extract to static dir. |

### Data Model

```yaml
Plugin:
  type: object
  properties:
    id:
      type: string
    name:
      type: string
    slug:
      type: string
      description: Unique, lowercase slug used for folder name and slug-based lookups
    image:
      type: string
      description: URL to avatar image
    description:
      type: string
    is_internal:
      type: boolean
    url:
      type: string
      description: If internal, serve from /plugin/{slug}/index.js; else external https URL
    config:
      type: object
    created_by:
      type: string
    updated_by:
      type: string
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
```

### OpenAPI (Swagger)

```yaml
/v2/system/plugin:
  get:
    summary: List plugins
    parameters:
      - in: query
        name: is_internal
        schema:
          type: boolean
      - in: query
        name: slug
        schema:
          type: string
      - in: query
        name: name
        schema:
          type: string
      - in: query
        name: limit
        schema:
          type: integer
      - in: query
        name: page
        schema:
          type: integer
    responses:
      '200':
        description: Plugins list
  post:
    summary: Create plugin (admin)
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreatePluginRequest'
    responses:
      '201':
        description: Created

/v2/system/plugin/id/{id}:
  get:
    summary: Get plugin by ID
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Plugin

/v2/system/plugin/slug/{slug}:
  get:
    summary: Get plugin by slug
    parameters:
      - in: path
        name: slug
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Plugin

/v2/system/plugin/{id}:
  put:
    summary: Update plugin (admin)
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UpdatePluginRequest'
    responses:
      '200':
        description: Updated
  delete:
    summary: Delete plugin (admin)
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: string
    responses:
      '204':
        description: Deleted

/v2/system/plugin/upload/{slug}:
  post:
    summary: Upload internal plugin ZIP and extract (admin)
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: slug
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        multipart/form-data:
          schema:
            type: object
            properties:
              file:
                type: string
                format: binary
    responses:
      '200':
        description: Uploaded and extracted
```

### Request Schemas

```yaml
CreatePluginRequest:
  type: object
  required: [name, is_internal]   # slug is auto-generated from name; type is optional
  properties:
    name: { type: string }
    is_internal: { type: boolean }
    type: { type: string, enum: [prototype_function, deploy] }   # optional, default prototype_function
    image: { type: string }
    description: { type: string }
    url: { type: string, description: "Required when is_internal is false (external URL)" }
    config: { type: object }

UpdatePluginRequest:
  type: object
  properties:
    name: { type: string }
    image: { type: string }
    description: { type: string }
    is_internal: { type: boolean }
    type: { type: string, enum: [prototype_function, deploy] }
    url: { type: string }
    config: { type: object }
```


