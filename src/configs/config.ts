const config: any = {
  serverBaseUrl: 'https://backend-core-dev.digital.auto',
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
  defaultModelId: '665826e3194aff003dd2f67b',
  genAI: {
    wizardCover: '/imgs/default_prototype_cover.jpg',
    hideMarketplace: false,
    defaultEndpointUrl: 'https://backend-core-dev.digital.auto/v2/genai',
    marketplaceUrl: 'https://store-be.digitalauto.tech/marketplace/genai',
    sdvApp: [
      {
        id: 'mock-genai',
        type: 'GenAI_Python',
        name: 'Mock SDV GenAI',
        description: 'Mock GenAI for Python code generation',
        apiKey: 'Empty',
        endpointUrl: 'https://backend-core-etas.digital.auto/v2/genai/etas',
        customPayload: (prompt: string) => ({ prompt }),
        isMock: true,
      },
    ],
    dashboard: [],
    widget: [],
  },
  github: {
    clientId: 'Ov23livVYo2MXyqoIHox',
  },
  disableEmailLogin: false,
  runtime: {
    url: 'https://kit.digitalauto.tech',
  },
  strictAuth: false,
}

export default config
