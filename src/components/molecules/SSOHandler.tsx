import { useState, useEffect, useCallback } from 'react'
import { loginRequest, callMsGraph } from '@/services/sso.service'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { loginService, registerService } from '@/services/auth.service'
import { addLog } from '@/services/log.service'

interface SSOHandlerProps {
  children: React.ReactNode
}

const SSOHandler = ({ children }: SSOHandlerProps) => {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  const handleSSOAuth = async () => {
    try {
      console.log('Attempt sign in with SSO silent')
      // Attempt to acquire token silently
      if (accounts.length > 0) {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        })
        handleSSOAuthSuccess(response.accessToken)
      } else {
        throw new Error('No accounts found')
      }
    } catch (e) {
      console.log(
        'Silent token acquisition failed, falling back to loginPopup: ',
        e,
      )
      // Fall back to interactive login if silent token acquisition fails
      await instance
        .loginPopup(loginRequest)
        .then((response) => {
          handleSSOAuthSuccess(response.accessToken)
        })
        .catch((error) => {
          console.log('SSO error: ', error)
        })
    }
  }

  const handleSSOAuthSuccess = async (accessToken: any) => {
    // Fetch user profile data from Microsoft Graph
    const graphResponse = await callMsGraph(accessToken)
    const { id, displayName, mail, userPrincipalName, userPhotoUrl } =
      graphResponse

    try {
      // Attempt to log in using the SSO credentials
      await loginService(mail, id)
      await addLog({
        name: `User log in`,
        description: `User ${mail} logged in via SSO`,
        type: 'user-login@email',
        create_by: mail,
      })
      console.log('SSO login success')
    } catch (loginError) {
      console.error(
        'SSO login failed, attempting to register user:',
        loginError,
      )

      // If login fails, attempt to register the user
      try {
        await registerService(displayName, mail, id)
        await addLog({
          name: `User registered`,
          description: `User registered with email: ${mail}`,
          type: 'user-register@email',
          create_by: mail,
        })
        console.log('SSO registration success, retrying login')

        // Retry logging in after successful registration
        await loginService(mail, id)
        await addLog({
          name: `User log in`,
          description: `User ${mail} logged in via SSO after registration`,
          type: 'user-login@email',
          create_by: mail,
        })
      } catch (registrationError) {
        console.error('SSO registration failed:', registrationError)
      }
    } finally {
      // Redirect or update state after successful login or registration
      window.location.href = window.location.href
    }
  }

  return <div onClick={handleSSOAuth}>{children}</div>
}

export default SSOHandler
