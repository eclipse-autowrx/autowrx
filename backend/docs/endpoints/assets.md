## Asset Endpoints (/v2/assets)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | / | Required | Create an asset. |
| GET | / | Required | List assets for current user. |
| GET | /manage | Required + Admin | List all assets (admin management). |
| GET | /:id | Required + READ_ASSET | Get asset by ID. |
| PATCH | /:id | Required + WRITE_ASSET | Update asset. |
| DELETE | /:id | Required + WRITE_ASSET | Delete asset. |
| POST | /:id/generate-token | Required + READ_ASSET | Generate access token for asset. |
| POST | /:id/permissions | Required + WRITE_ASSET | Add authorized user to asset. |
| DELETE | /:id/permissions | Required + WRITE_ASSET | Remove authorized user from asset. |

### Data Model

```yaml
Asset:
  type: object
  properties:
    id:
      type: string
    name:
      type: string
    type:
      type: string
    data:
      type: object
    created_by:
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
/v2/assets:
  get:
    summary: List assets for current user
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Assets list
  post:
    summary: Create asset
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateAssetRequest'
    responses:
      '201':
        description: Created

/v2/assets/manage:
  get:
    summary: List all assets (admin)
    security:
      - bearerAuth: []
    responses:
      '200':
        description: All assets

/v2/assets/{id}:
  get:
    summary: Get asset by ID
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Asset
  patch:
    summary: Update asset
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UpdateAssetRequest'
    responses:
      '200':
        description: Updated
  delete:
    summary: Delete asset
    security:
      - bearerAuth: []
    responses:
      '204':
        description: No content

/v2/assets/{id}/generate-token:
  post:
    summary: Generate access token for asset
    security:
      - bearerAuth: []
    responses:
      '200':
        description: Token generated

/v2/assets/{id}/permissions:
  post:
    summary: Add authorized user to asset
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/AddAssetAuthorizedUserRequest'
    responses:
      '200':
        description: Added
  delete:
    summary: Remove authorized user from asset
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/DeleteAssetAuthorizedUserRequest'
    responses:
      '204':
        description: Removed
```
