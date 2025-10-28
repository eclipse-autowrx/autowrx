# Site Management API

Site configuration management with key-value pairs supporting different data types and secret/public visibility.

## Base Path
`/v2/site-config`

## Data Types Supported
- `string` - Text values
- `number` - Numeric values  
- `boolean` - True/false values
- `object` - JSON objects
- `array` - JSON arrays
- `date` - Date values

## Public Endpoints (No Authentication Required)

### Get All Public Configs
```http
GET /v2/site-config/public
```

Returns all non-secret site configurations.

**Response:**
```json
{
  "site-logo": "https://example.com/logo.png",
  "site-name": "AutoWRX",
  "theme-color": "#007bff",
  "max-upload-size": 10485760
}
```

### Get Single Public Config Value
```http
GET /v2/site-config/public/{key}
```

Returns the value for a specific public configuration key.

**Parameters:**
- `key` (string) - The configuration key

**Response:**
```json
{
  "key": "site-logo",
  "value": "https://example.com/logo.png"
}
```

## Admin Endpoints (Authentication + Admin Permission Required)

### Create Site Config
```http
POST /v2/site-config
```

Create a new site configuration.

**Request Body:**
```json
{
  "key": "site-logo",
  "value": "https://example.com/logo.png",
  "secret": false,
  "description": "Main site logo URL",
  "category": "branding"
}
```

**Response:**
```json
{
  "id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "key": "site-logo",
  "value": "https://example.com/logo.png",
  "valueType": "string",
  "secret": false,
  "description": "Main site logo URL",
  "category": "branding",
  "created_by": "60f7b3b3b3b3b3b3b3b3b3b3",
  "updated_by": "60f7b3b3b3b3b3b3b3b3b3b3",
  "createdAt": "2023-07-20T10:00:00.000Z",
  "updatedAt": "2023-07-20T10:00:00.000Z"
}
```

### Get All Site Configs (Admin)
```http
GET /v2/site-config/all
```

Returns all site configurations including secret ones.

**Response:**
```json
{
  "site-logo": "https://example.com/logo.png",
  "llm-api-key": "sk-1234567890abcdef",
  "database-url": "mongodb://localhost:27017/autowrx"
}
```

### Get Site Configs with Filtering
```http
GET /v2/site-config?secret=true&category=api&limit=10&page=1
```

**Query Parameters:**
- `secret` (boolean) - Filter by secret status
- `category` (string) - Filter by category
- `key` (string) - Filter by key pattern
- `sortBy` (string) - Sort field (e.g., "createdAt:desc")
- `limit` (number) - Results per page (default: 10)
- `page` (number) - Page number (default: 1)

### Get Multiple Configs by Keys
```http
POST /v2/site-config/by-keys
```

**Request Body:**
```json
{
  "keys": ["site-logo", "site-name", "theme-color"]
}
```

**Response:**
```json
{
  "site-logo": "https://example.com/logo.png",
  "site-name": "AutoWRX",
  "theme-color": "#007bff"
}
```

### Bulk Upsert Configs
```http
POST /v2/site-config/bulk-upsert
```

Create or update multiple configurations at once.

**Request Body:**
```json
{
  "configs": [
    {
      "key": "site-logo",
      "value": "https://example.com/logo.png",
      "secret": false,
      "description": "Main site logo",
      "category": "branding"
    },
    {
      "key": "llm-api-key",
      "value": "sk-1234567890abcdef",
      "secret": true,
      "description": "OpenAI API key",
      "category": "api"
    }
  ]
}
```

### Get Site Config by ID
```http
GET /v2/site-config/{siteConfigId}
```

### Get Site Config by Key
```http
GET /v2/site-config/key/{key}
```

### Update Site Config by ID
```http
PATCH /v2/site-config/{siteConfigId}
```

**Request Body:**
```json
{
  "value": "https://new-example.com/logo.png",
  "description": "Updated site logo URL"
}
```

### Update Site Config by Key
```http
PATCH /v2/site-config/key/{key}
```

**Request Body:**
```json
{
  "value": "https://new-example.com/logo.png",
  "secret": false
}
```

### Delete Site Config by ID
```http
DELETE /v2/site-config/{siteConfigId}
```

### Delete Site Config by Key
```http
DELETE /v2/site-config/key/{key}
```

## Usage Examples

### Frontend Usage (TypeScript)
```typescript
import { getConfig, getConfigs, getPublicConfigs } from '@/utils/siteConfig';

// Get single config
const logoUrl = await getConfig('site-logo', '/default-logo.png');

// Get multiple configs
const branding = await getConfigs(['site-logo', 'site-name', 'theme-color']);

// Get all public configs
const allPublicConfigs = await getPublicConfigs();

// Use React hook
const { configs, loading, error } = useSiteConfigs(['site-logo', 'site-name']);
```

### Backend Usage (Node.js)
```javascript
const { getConfig, getConfigs, getPublicConfigs } = require('../utils/siteConfig');

// Get single config
const logoUrl = await getConfig('site-logo', '/default-logo.png');

// Get multiple configs
const branding = await getConfigs(['site-logo', 'site-name', 'theme-color']);

// Get all public configs
const allPublicConfigs = await getPublicConfigs();
```

## Common Configuration Keys

### Branding
- `site-logo` - Main site logo URL
- `site-name` - Site name
- `theme-color` - Primary theme color
- `favicon` - Favicon URL

### API Configuration
- `llm-api-key` - LLM service API key (secret)
- `llm-endpoint` - LLM service endpoint
- `max-upload-size` - Maximum file upload size

### Feature Flags
- `enable-registration` - Allow user registration
- `enable-discussions` - Enable discussion features
- `maintenance-mode` - Site maintenance mode

### System Settings
- `default-page-size` - Default pagination size
- `session-timeout` - User session timeout in minutes
- `max-login-attempts` - Maximum login attempts before lockout
