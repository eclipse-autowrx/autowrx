## Homologation Proxy (/v2/homologation)

- All requests under `/v2/homologation/*` are proxied to the configured Homologation service (`config.services.homologation.url`).
- **Auth**: Optional when `strictAuth=false`, otherwise required.

### Data Model

```yaml
HomologationProxy:
  description: Proxy endpoint, response model depends on upstream Homologation service
```

### OpenAPI (Swagger)

```yaml
/v2/homologation/{path}:
  any:
    summary: Proxy to Homologation service
    parameters:
      - in: path
        name: path
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Proxied response
```
