// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/atoms/button'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { getGithubAuthStatus, disconnectGithub } from '@/services/github.service'
import { GithubAuthStatus } from '@/types/git.type'
import { VscGithub } from 'react-icons/vsc'
import { TbLoader } from 'react-icons/tb'
import Cookies from 'js-cookie'
import useSelfProfileQuery from '@/hooks/useSelfProfile'

interface GitHubAuthProps {
  onAuthChange?: (authenticated: boolean) => void
}

const GitHubAuth: React.FC<GitHubAuthProps> = ({ onAuthChange }) => {
  const [authStatus, setAuthStatus] = useState<GithubAuthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()
  const { data: currentUser } = useSelfProfileQuery()

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      const status = await getGithubAuthStatus()
      setAuthStatus(status)
      
      // Store in cookie for persistence
      if (status.authenticated) {
        Cookies.set('github_auth', JSON.stringify({
          authenticated: true,
          username: status.username,
          avatar_url: status.avatar_url,
        }), { expires: 365 })
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
  }

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
  }, [])

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
        Cookies.set('github_auth', JSON.stringify({
          authenticated: true,
          username: event.data.username,
          avatar_url: event.data.avatar_url,
        }), { expires: 365 })
        onAuthChange?.(true)
        
        toast({
          title: 'Success',
          description: 'GitHub account connected successfully',
        })
      } else if (event.data.type === 'GITHUB_AUTH_ERROR') {
        toast({
          title: 'Authentication Failed',
          description: event.data.error || 'Failed to authenticate with GitHub',
          variant: 'destructive',
        })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onAuthChange, toast])

  const handleConnect = async () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || process.env.VITE_GITHUB_CLIENT_ID
    
    if (!clientId) {
      toast({
        title: 'Configuration Error',
        description: 'GitHub OAuth is not configured. Please set VITE_GITHUB_CLIENT_ID environment variable.',
        variant: 'destructive',
      })
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
      toast({
        title: 'Error',
        description: 'Failed to open popup window. Please check your browser settings.',
        variant: 'destructive',
      })
    }
  }

  const handleDisconnect = async () => {
    try {
      setProcessing(true)
      await disconnectGithub()
      setAuthStatus({ authenticated: false })
      Cookies.remove('github_auth')
      onAuthChange?.(false)
      
      toast({
        title: 'Disconnected',
        description: 'GitHub account disconnected successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect GitHub account',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <TbLoader className="animate-spin" />
        <span>Checking GitHub connection...</span>
      </div>
    )
  }

  if (authStatus?.authenticated) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-center space-x-3">
          {authStatus.avatar_url && (
            <img
              src={authStatus.avatar_url}
              alt={authStatus.username}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">
              Connected as {authStatus.username}
            </p>
            {authStatus.email && (
              <p className="text-xs text-gray-500">{authStatus.email}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={processing}
        >
          {processing && <TbLoader className="mr-2 animate-spin" />}
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md">
      <div className='p-0.5'>
        <p className="text-sm font-medium text-gray-900">Connect to GitHub</p>
        <p className="text-xs text-gray-500">
          Connect your GitHub account to push, pull, and sync code
        </p>
      </div>
      <Button
        variant="default"
        size="sm"
        onClick={handleConnect}
        className="flex items-center space-x-2 w-full"
        disabled={processing}
      >
        {processing && <TbLoader className="mr-2 animate-spin" />}
        <VscGithub className="text-lg" />
        <span>Connect</span>
      </Button>
    </div>
  )
}

export default GitHubAuth
