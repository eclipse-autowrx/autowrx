import { Config } from '@/types/addon.type'

const config: Config = {
  serverBaseUrl:
    import.meta.env.VITE_SERVER_BASE_URL ||
    'https://backend-core-dev.digital.auto',
  serverVersion: import.meta.env.VITE_SERVER_VERSION || 'v2',
  studioUrl: 'https://studio.digital.auto',
  studioBeUrl: 'https://bewebstudio.digitalauto.tech',
  widgetMarketPlaceUrl: 'https://marketplace.digital.auto/packagetype/widget',
  widgetMarketPlaceBe: 'https://store-be.digitalauto.tech',
  uploadFileUrl: 'https://upload.digitalauto.asia',
  instanceLogo:
    'https://static.wixstatic.com/media/604381_7624c1d2f72b45c18183be743e983e45~mv2.png/v1/fill/w_77,h_77,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/Logo-Icon.png',
  instance: 'digitalauto',
  defaultModelId: '665826e3194aff003dd2f67b',
  genAI: {
    defaultEndpointUrl: 'https://intermediate.digitalauto.tech/v1/genai',
    marketplaceUrl: 'https://store-be.digitalauto.tech/marketplace/genai',
    sdvApp: [],
    dashboard: [],
    widget: [],
  },
}

export default config
