// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { useState, useEffect, useCallback } from 'react'
import Cookies from 'js-cookie'
import { getGithubAuthStatus, disconnectGithub } from '@/services/github.service'
import { GithubAuthStatus } from '@/types/git.type'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

interface UseGithubAuthReturn {
  authStatus: GithubAuthStatus | null
  loading: boolean
  processing: boolean
  checkAuthStatus: () => Promise<void>
  handleConnect: (onError: (message: string) => void) => Promise<void>
  handleDisconnect: () => Promise<void>
}

/**
 * Custom hook for GitHub authentication
 * Manages auth status, login/logout, and cookie persistence
 */
export const useGithubAuth = (onAuthChange?: (authenticated: boolean) => void): UseGithubAuthReturn => {
  const [authStatus, setAuthStatus] = useState<GithubAuthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const { data: currentUser } = useSelfProfileQuery()

  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true)
      const status = await getGithubAuthStatus()
      setAuthStatus(status)

      // Store in cookie for persistence
      if (status.authenticated) {
        Cookies.set(
          'github_auth',
          JSON.stringify({
            authenticated: true,
            username: status.username,
            avatar_url: status.avatar_url,
          }),
          { expires: 365 }
        )
      } else {
        Cookies.remove('github_auth')
      }

      onAuthChange?.(status.authenticated)
    } catch (error) {
      console.error('Failed to check GitHub auth status:', error)
      setAuthStatus({ authenticated: false })
      Cookies.remove('github_auth')
      onAuthChange?.(false)
    } finally {
      setLoading(false)
    }
  }, [onAuthChange])

  // Initialize auth status on mount
  useEffect(() => {
    // Check cookie first for faster UI
    const cachedAuth = Cookies.get('github_auth')
    if (cachedAuth) {
      try {
        setAuthStatus(JSON.parse(cachedAuth))
      } catch (e) {
        // Invalid cookie
      }
    }

    checkAuthStatus()
  }, [checkAuthStatus])

  // Listen for messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
        setAuthStatus({
          authenticated: true,
          username: event.data.username,
          avatar_url: event.data.avatar_url,
          email: event.data.email,
        })
        Cookies.set(
          'github_auth',
          JSON.stringify({
            authenticated: true,
            username: event.data.username,
            avatar_url: event.data.avatar_url,
          }),
          { expires: 365 }
        )
        onAuthChange?.(true)
      } else if (event.data.type === 'GITHUB_AUTH_ERROR') {
        // Error will be handled by component
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onAuthChange])

  const handleConnect = useCallback(
    async (onError: (message: string) => void) => {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || process.env.VITE_GITHUB_CLIENT_ID

      if (!clientId) {
        onError('GitHub OAuth is not configured. Please set VITE_GITHUB_CLIENT_ID environment variable.')
        return
      }

      const scope = 'repo,user:email'
      const state = Math.random().toString(36).substring(7)

      // Build redirect URI with state and userId as query parameters
      let redirectUri = `${window.location.origin}/github/callback?state=${encodeURIComponent(state)}`
      if (currentUser?.id) {
        redirectUri += `&userId=${encodeURIComponent(currentUser.id)}`
      }

      const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`

      // Open popup window
      const popupWidth = 500
      const popupHeight = 600
      const left = window.screenX + (window.outerWidth - popupWidth) / 2
      const top = window.screenY + (window.outerHeight - popupHeight) / 2

      const popup = window.open(
        authUrl,
        'github-auth',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
      )

      if (!popup) {
        onError('Failed to open popup window. Please check your browser settings.')
      }
    },
    [currentUser?.id]
  )

  const handleDisconnect = useCallback(async () => {
    try {
      setProcessing(true)
      await disconnectGithub()
      setAuthStatus({ authenticated: false })
      Cookies.remove('github_auth')
      onAuthChange?.(false)
    } finally {
      setProcessing(false)
    }
  }, [onAuthChange])

  return {
    authStatus,
    loading,
    processing,
    checkAuthStatus,
    handleConnect,
    handleDisconnect,
  }
}

export default useGithubAuth
