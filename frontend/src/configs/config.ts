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
    import.meta.env.VITE_SERVER_BASE_URL || 'http://localhost:3200',
  serverVersion: import.meta.env.VITE_SERVER_VERSION || 'v2',
  logBaseUrl: '',
  // cacheBaseUrl: '',
  uploadFileUrl: import.meta.env.VITE_SERVER_BASE_URL + '/v2/file',
  showPrivacyPolicy: false,
  github: {
    clientId: '',
  },
  runtime: {
    url: 'https://kit.digitalauto.tech',
  },
  strictAuth: false,
}

export default config
