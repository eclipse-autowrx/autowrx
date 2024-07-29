const config: any = {
  serverBaseUrl: 'https://backend-core-covesa.digital.auto',
  serverVersion: import.meta.env.VITE_SERVER_VERSION || 'v2',
  studioUrl: 'https://studio.digital.auto',
  studioBeUrl: 'https://bewebstudio.digitalauto.tech',
  widgetMarketPlaceUrl: 'https://marketplace.digital.auto/packagetype/widget',
  widgetMarketPlaceBe: 'https://store-be.digitalauto.tech',
  uploadFileUrl: 'https://upload.digitalauto.tech',
  instanceLogo:
    'https://covesa.global/wp-content/uploads/2024/03/covesa_logo.png',
  instance: 'covesa',
  defaultModelId: '667d48dde2e9cb0027710f52',
  genAI: {
    defaultEndpointUrl: 'https://intermediate.digitalauto.tech/v1/genai',
    marketplaceUrl: 'https://store-be.digitalauto.tech/marketplace/genai',
    sdvApp: [],
    dashboard: [],
    widget: [],
  },
  github: {
    clientId: 'Ov23livVYo2MXyqoIHox',
  },
}

export default config
