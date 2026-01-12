// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useEffect } from 'react'
import { Button } from '@/components/atoms/button'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { VscGithub } from 'react-icons/vsc'
import { TbLoader } from 'react-icons/tb'
import { useGithubAuth } from '@/hooks/useGithubAuth'

interface GitHubAuthProps {
  onAuthChange?: (authenticated: boolean) => void
}

const GitHubAuth: React.FC<GitHubAuthProps> = ({ onAuthChange }) => {
  const { toast } = useToast()
  const { authStatus, loading, processing, handleConnect, handleDisconnect } = useGithubAuth(onAuthChange)

  const handleConnectClick = async () => {
    await handleConnect((errorMessage: string) => {
      toast({
        title: 'Configuration Error',
        description: errorMessage,
        variant: 'destructive',
      })
    })
  }

  const handleDisconnectClick = async () => {
    try {
      await handleDisconnect()
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
    }
  }

  // Listen for auth popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
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
  }, [toast])

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
      <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-md">
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
              {authStatus.username}
            </p>
            {authStatus.email && (
              <p className="text-xs text-gray-500">{authStatus.email}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnectClick}
          disabled={processing}
        >
          {processing && <TbLoader className="mr-2 animate-spin" />}
          Signout
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md">
      <div className="p-0.5">
        <p className="text-sm font-medium text-gray-900">Connect to GitHub</p>
        <p className="text-xs text-gray-500">
          Connect your GitHub account to push, pull, and sync code
        </p>
      </div>
      <Button
        variant="default"
        size="sm"
        onClick={handleConnectClick}
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
