const config: any = {
  serverBaseUrl:
    import.meta.env.VITE_SERVER_BASE_URL ||
    'https://backend-core-dev.digital.auto',
  serverBaseWssUrl:
    import.meta.env.VITE_SERVER_BASE_WSS_URL ||
    'wss://backend-core-dev.digital.auto',
  serverVersion: import.meta.env.VITE_SERVER_VERSION || 'v2',
  logBaseUrl: import.meta.env.PROD
    ? 'https://logs.digital.auto'
    : 'https://logs.digitalauto.asia',
  cacheBaseUrl:
    import.meta.env.VITE_CACHE_BASE_URL || 'https://cache.digitalauto.tech',
  studioUrl: 'https://studio.digital.auto',
  studioBeUrl: 'https://bewebstudio.digitalauto.tech',
  widgetMarketPlaceUrl: 'https://marketplace.digital.auto/packagetype/widget',
  widgetMarketPlaceBe: 'https://store-be.digitalauto.tech',
  uploadFileUrl: 'https://upload.digitalauto.tech',
  instanceLogo:
    'https://covesa.global/wp-content/uploads/2024/03/covesa_logo.png',
  sso: 'bosch',
  instance: 'digitalauto',
  showPrivacyPolicy: false,
  showGenAIWizard: false,
  defaultModelId: '665826e3194aff003dd2f67b',
  genAI: {
    wizardCover: '/imgs/default_prototype_cover.jpg',
    hideMarketplace: false,
    defaultEndpointUrl: 'https://backend-core-dev.digital.auto/v2/genai',
    marketplaceUrl: 'https://store-be.digitalauto.tech/marketplace/genai',
    sdvApp: [
      {
        id: '674fed13c2a9e9b37198ff2a',
        type: 'GenAI_Python',
        name: 'SDV Copilot',
        description: 'Support develop basic SDV Python App',
        apiKey: 'Empty',
        endpointUrl: 'https://backend-core-dev.digital.auto/v2/genai',
        customPayload: (prompt: string) => ({ prompt }),
      },
    ],
    dashboard: [],
    widget: [],
  },
  inventory: {
    frontend: {
      url:
        import.meta.env.VITE_INVENTORY_FRONTEND_URL ||
        'http://fe.inventory.digital.auto',
    },
  },
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
  },
  disableEmailLogin: false,
  runtime: {
    url: import.meta.env.VITE_KIT_SERVER_URL || 'https://kit.digitalauto.tech',
  },
  strictAuth: false,
  enableSupport: true,
}

export default config
