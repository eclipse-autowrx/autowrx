import { LogLevel } from '@azure/msal-browser'
import config from '@/configs/config'

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_REACT_SSO_CLIENT_ID,
    authority: import.meta.env.VITE_REACT_SSO_AUTHORITY,
    redirectUri: window.location.origin.includes('localhost')
      ? 'http://localhost:3000'
      : config.instance === 'xhub'
        ? 'https://xhub.digital.auto'
        : config.instance === 'etas'
          ? 'https://etas.digital.auto'
          : 'https://autowrx.digital.auto',
  },
  cache: {
    cacheLocation: 'sessionStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: any, containsPii: any) => {
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

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
  scopes: ['User.Read'],
}
