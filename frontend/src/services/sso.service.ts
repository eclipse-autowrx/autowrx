// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { LogLevel, PublicClientApplication, Configuration } from '@azure/msal-browser'
import { serverAxios } from './base'
import config from '@/configs/config'

export interface SSOProvider {
  id: string
  name: string
  type: 'MSAL' | 'GITHUB'
  enabled: boolean
  clientId: string
  authority?: string
  clientSecret?: string
  scopes?: string[]
}

/**
 * Fetch public SSO providers from backend
 */
export const getPublicSSOProviders = async (): Promise<SSOProvider[]> => {
  try {
    const response = await serverAxios.get('/system/site-management/sso/providers')
    return response.data || []
  } catch (error) {
    console.error('Failed to fetch SSO providers:', error)
    return []
  }
}

/**
 * Build GitHub SSO start URL (redirect user to backend, then to GitHub).
 */
export const getGithubSsoStartUrl = (providerId: string): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const params = new URLSearchParams({ providerId, origin })
  return `${config.serverBaseUrl}/${config.serverVersion}/auth/github-sso/start?${params.toString()}`
}

/**
 * Create MSAL configuration from SSO provider (MSAL only).
 */
export const createMSALConfig = (provider: SSOProvider): Configuration => {
  return {
    auth: {
      clientId: provider.clientId,
      authority: provider.authority || '',
      redirectUri: `${window.location.origin}/`,
      postLogoutRedirectUri: `${window.location.origin}/`,
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level: any, _message: any, containsPii: any) => {
          if (containsPii) {
            return
          }
          switch (level) {
            case LogLevel.Error:
              // console.error(message);
              return
            case LogLevel.Info:
              // console.info(message);
              return
            case LogLevel.Verbose:
              // console.debug(message);
              return
            case LogLevel.Warning:
              // console.warn(message);
              return
            default:
              return
          }
        },
      },
    },
  }
}

/**
 * Create MSAL PublicClientApplication instance for a provider
 */
export const createMSALInstance = (provider: SSOProvider): PublicClientApplication => {
  const config = createMSALConfig(provider)
  return new PublicClientApplication(config)
}

/**
 * Default login request scopes
 */
export const getLoginRequest = (provider: SSOProvider) => {
  return {
    scopes: provider.scopes || ['User.Read'],
  }
}
