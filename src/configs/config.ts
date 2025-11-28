// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { url } from 'inspector'

const config: any = {
  serverBaseUrl:
    import.meta.env.VITE_SERVER_BASE_URL ||
    'https://backend-core-dev.digital.auto',
  serverBaseWssUrl:
    import.meta.env.VITE_SERVER_BASE_WSS_URL ||
    'wss://backend-core-dev.digital.auto',
  serverVersion: import.meta.env.VITE_SERVER_VERSION || 'v2',
  logBaseUrl: '',
  cacheBaseUrl: '',
  studioUrl: 'https://studio.digital.auto',
  studioBeUrl: 'https://bewebstudio.digitalauto.tech',
  widgetMarketPlaceUrl: 'https://marketplace.digital.auto/packagetype/widget',
  widgetMarketPlaceBe: 'https://store-be.digitalauto.tech',
  uploadFileUrl: import.meta.env.VITE_SERVER_BASE_URL + '/v2/file',
  instanceLogo:
    'https://covesa.global/wp-content/uploads/2024/03/covesa_logo.png',
  sso: '',
  instance: 'uaes',
  showPrivacyPolicy: false,
  showGenAIWizard: false,
  defaultModelId: '665826e3194aff003dd2f67b',
  genAI: {
    sdvApp: [],
    dashboard: [],
    widget: [],
  },
  inventory: {
    frontend: {
      url: '',
    },
  },
  github: {
    clientId: '',
  },
  disableEmailLogin: false,
  runtime: {
    // url: 'https://uspsimulation-qa.uaes.com/kit',
    url: 'https://kit.digitalauto.tech',
  },
  githubOpenSourceUrl: import.meta.env.VITE_GITHUB_OPEN_SOURCE_URL || 'https://github.com/eclipse-autowrx/autowrx',
  strictAuth: false,
  enableSupport: true,
  supportUrl: import.meta.env.VITE_SUPPORT_URL || 'https://github.com/eclipse-autowrx/autowrx/issues',
  learning: {
    url: import.meta.env.VITE_LEARNING_URL || 'https://learning-dev.digital.auto',
  },
  requirements: {
    journey_2_requirements: '',
  },
}

export default config
