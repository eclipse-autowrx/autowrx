## GenAI Proxy (/v2/genai)

- All requests under `/v2/genai/*` are proxied to the configured GenAI service (`config.services.genAI.url`).
- **Auth**: Required + `GENERATIVE_AI` permission for the current user.
- Streaming (SSE) is supported; proxy flushes response chunks.

### Data Model

```yaml
GenAIProxy:
  description: Proxy endpoint, response model depends on upstream GenAI service
```

### OpenAPI (Swagger)

```yaml
/v2/genai/{path}:
  any:
    summary: Proxy to GenAI service
    security:
      - bearerAuth: []
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
