// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { ReactNode, useState, useEffect } from 'react'
import { PublicClientApplication } from '@azure/msal-browser'
import { createMSALInstance, getLoginRequest, getGithubSsoStartUrl, SSOProvider } from '@/services/sso.service'
import { ssoService } from '@/services/auth.service'
import { useToast } from '@/components/molecules/toaster/use-toast'

interface SSOHandlerProps {
  provider: SSOProvider
  setSSOLoading?: (loading: boolean) => void
  children: ReactNode
}

const SSOHandler = ({ provider, setSSOLoading, children }: SSOHandlerProps) => {
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (provider?.type === 'MSAL') {
      const initializeMsal = async () => {
        try {
          setIsInitializing(true)
          const instance = createMSALInstance(provider)
          await instance.initialize()
          setMsalInstance(instance)
        } catch (error) {
          console.error('Failed to initialize MSAL instance:', error)
          toast({
            title: 'SSO Configuration Error',
            description: 'Failed to initialize SSO. Please contact your administrator.',
            variant: 'destructive',
          })
        } finally {
          setIsInitializing(false)
        }
      }
      initializeMsal()
    } else {
      setMsalInstance(null)
      setIsInitializing(false)
    }
  }, [provider, toast])

  const handleSSOLogin = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (provider.type === 'GITHUB') {
      if (setSSOLoading) setSSOLoading(true)
      window.location.href = getGithubSsoStartUrl(provider.id)
      return
    }

    if (isInitializing) {
      toast({
        title: 'SSO Initializing',
        description: 'Please wait while SSO is being initialized...',
      })
      return
    }

    if (!msalInstance) {
      toast({
        title: 'SSO Not Ready',
        description: 'SSO authentication is not initialized. Please try again.',
        variant: 'destructive',
      })
      return
    }

    if (setSSOLoading) setSSOLoading(true)

    try {
      const loginRequest = getLoginRequest(provider)
      const loginResponse = await msalInstance.loginPopup(loginRequest)

      if (!loginResponse || !loginResponse.accessToken) {
        throw new Error('No access token received from Microsoft')
      }

      const response = await ssoService(loginResponse.idToken, provider.id)

      if (response.data) {
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${response.data.user?.name || 'User'}!`,
        })
        setTimeout(() => {
          window.location.href = window.location.href
        }, 500)
      }
    } catch (error: any) {
      if (error.errorCode === 'user_cancelled') {
        toast({
          title: 'Login Cancelled',
          description: 'You cancelled the login process.',
        })
      } else {
        console.error('SSO login error:', error)
        if (error.errorCode === 'popup_window_error') {
          toast({
            title: 'Popup Blocked',
            description: 'Please allow popups for this site to use SSO login.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Login Failed',
            description: error.response?.data?.message || error.message || 'Failed to authenticate with SSO.',
            variant: 'destructive',
          })
        }
      }
    } finally {
      if (setSSOLoading) setSSOLoading(false)
    }
  }

  return <div onClick={handleSSOLogin}>{children}</div>
}

export default SSOHandler
