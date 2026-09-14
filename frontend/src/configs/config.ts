// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const config: any = {
  instance: 'autowrx',
  serverBaseUrl: (() => {
    const env = (import.meta.env.VITE_SERVER_BASE_URL || '').trim()
    if (env) return env
    return typeof window !== 'undefined' ? window.location.origin : ''
  })(),
  serverVersion: import.meta.env.VITE_SERVER_VERSION || 'v2',
  logBaseUrl: '',
  // cacheBaseUrl: '',
  showPrivacyPolicy: false,
  github: {
    clientId: '',
  },
  runtime: {
    url: 'https://kit.digitalauto.tech',
  },
  // strictAuth has been replaced by granular auth configs (PUBLIC_VIEWING, SELF_REGISTRATION, etc.)
  // See useAuthConfigs hook for the new implementation
}

export default config
