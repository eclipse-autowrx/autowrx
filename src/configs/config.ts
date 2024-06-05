// config.ts
export default {
  serverBaseUrl:
    import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:8080',
  serverVersion: import.meta.env.VITE_SERVER_VERSION || 'v2',
  studioUrl: 'https://studio.digital.auto',
  studioBeUrl: 'https://bewebstudio.digitalauto.tech',
  widgetMarketPlaceUrl: 'https://marketplace.digital.auto/packagetype/widget',
  widgetMarketPlaceBe: 'https://store-be.digitalauto.tech',
  uploadFileUrl: 'https://upload.digitalauto.asia',
  genAI: {
    sdvApp: {
      default: {
        id: 'etas-sdv-genai',
        type: 'GenAI_Python' as const, // Ensuring the type matches the AddOn interface
        name: 'ETAS SDV GenAI',
        description: 'ETAS GenAI for Python code generation',
        apiKey: 'Empty',
        endpointUrl: 'https://backend-core-etas.digital.auto/v2/genai',
        customPayload: (prompt: string) => ({ prompt }),
      },
    },
    dashboard: {
      default: {
        id: 'etas-dashboard-genai',
        type: 'GenAI_Python' as const, // Ensuring the type matches the AddOn interface
        name: 'ETAS Dashboard GenAI',
        description: 'ETAS GenAI for Python code generation',
        apiKey: 'Empty',
        endpointUrl: 'https://backend-core-etas.digital.auto/v2/genai',
        customPayload: (prompt: string) => ({ prompt }),
      },
    },
    marketplaceUrl: 'https://store-be.digitalauto.tech/marketplace/genai',
  },
}
