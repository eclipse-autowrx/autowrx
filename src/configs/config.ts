const config = {
  serverBaseUrl:
    import.meta.env.VITE_SERVER_BASE_URL ||
    'https://backend-core-dev.digital.auto',
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
  uploadFileUrl: 'https://upload.digitalauto.asia',
  instanceLogo:
    'https://static.wixstatic.com/media/604381_7624c1d2f72b45c18183be743e983e45~mv2.png/v1/fill/w_77,h_77,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/Logo-Icon.png',
  instance: 'digitalauto',
  defaultModelId: '667a9194694a35002f961ba8',
  genAI: {
    defaultEndpointUrl: '',
    marketplaceUrl: 'https://store-be.digitalauto.tech/marketplace/genai',
    sdvApp: [],
    dashboard: [],
    widget: [],
  },
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
  },
  features: []
}

export default config
