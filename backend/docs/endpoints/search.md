## Search Endpoints (/v2/search)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | Optional (strictAuth=false) | Full-text search across resources. |
| GET | /email/:email | Optional (strictAuth=false) | Search user by email. |
| GET | /prototypes/by-signal/:signal | Optional (strictAuth=false) | Search prototypes by signal. |

### Data Model

```yaml
SearchResult:
  description: Result shape varies by index; typically includes matched documents and metadata
```

### OpenAPI (Swagger)

```yaml
/v2/search:
  get:
    summary: Full-text search across resources
    security:
      - bearerAuth: []
    parameters:
      - in: query
        name: q
        schema:
          type: string
    responses:
      '200':
        description: Search results

/v2/search/email/{email}:
  get:
    summary: Search user by email
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: email
        required: true
        schema:
          type: string
    responses:
      '200':
        description: User results

/v2/search/prototypes/by-signal/{signal}:
  get:
    summary: Search prototypes by signal
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: signal
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Prototype results
```

### How /v2/search Works

- **Collections Searched:** Only the Model and Prototype tables (MongoDB collections) are searched by this endpoint. Search matches the `name` and `description` fields in both models and prototypes you have access to.
- **Other tables (users, assets, discussions, etc.) are not searched** by this endpoint.
- **Result Format:** The response will contain `models` and `prototypes` arrays, and paging info.

#### Example result:
```json
{
  "models": [ { "id": "...", "name": "Brake Model", ... } ],
  "prototypes": [ { "id": "...", "name": "Proto-A", ... } ],
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "totalResults": 2
}
```

#### Example usage:

- Search for "brake" (requires Authorization header):
  ```bash
  curl -G "http://localhost:8080/v2/search" \
    -H "Authorization: Bearer <access_token>" \
    --data-urlencode "q=brake"
  ```
- In UI (Hoppscotch, Postman):
  - Method: GET
  - URL: http://localhost:8080/v2/search?q=engine
  - Header: Authorization: Bearer <access_token>

- Example queries:
  - q=brake
  - q=autonomous
  - q=Electric Vehicle

You must supply a non-empty value for `q`. Always include your valid access token.
