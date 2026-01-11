// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { githubOAuthCallback } from '@/services/github.service'
import { useToast } from '@/components/molecules/toaster/use-toast'
import { TbLoader } from 'react-icons/tb'

const GitHubCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const savedState = sessionStorage.getItem('github_oauth_state')

      if (!code) {
        toast({
          title: 'Authentication Failed',
          description: 'No authorization code received from GitHub',
          variant: 'destructive',
        })
        navigate('/')
        return
      }

      if (state !== savedState) {
        toast({
          title: 'Authentication Failed',
          description: 'Invalid state parameter. Possible CSRF attack.',
          variant: 'destructive',
        })
        navigate('/')
        return
      }

      try {
        await githubOAuthCallback(code)
        
        sessionStorage.removeItem('github_oauth_state')
        
        toast({
          title: 'Success',
          description: 'GitHub account connected successfully',
        })

        // Redirect back to previous page or home
        const returnPath = sessionStorage.getItem('github_return_path') || '/'
        sessionStorage.removeItem('github_return_path')
        navigate(returnPath)
      } catch (error) {
        console.error('GitHub OAuth error:', error)
        toast({
          title: 'Authentication Failed',
          description: 'Failed to connect GitHub account. Please try again.',
          variant: 'destructive',
        })
        navigate('/')
      }
    }

    handleCallback()
  }, [searchParams, navigate, toast])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <TbLoader className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connecting to GitHub
        </h2>
        <p className="text-gray-600">Please wait while we authenticate your account...</p>
      </div>
    </div>
  )
}

export default GitHubCallback
