// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { githubOAuthCallback } from '@/services/github.service'
import { TbLoader } from 'react-icons/tb'

const GitHubCallback: React.FC = () => {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const userId = searchParams.get('userId')

      try {
        if (!code) {
          throw new Error('No authorization code received from GitHub')
        }

        if (!state) {
          throw new Error('Invalid state parameter. Possible CSRF attack.')
        }

        // Exchange code for token and save credentials
        const result = await githubOAuthCallback(code, userId || undefined)

        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GITHUB_AUTH_SUCCESS',
            username: result.user.username,
            avatar_url: result.user.avatar_url,
            email: result.user.email,
          }, window.location.origin)

          // Close the popup
          setTimeout(() => {
            window.close()
          }, 1000)
        } else {
          // Fallback: redirect to home if opened directly
          window.location.href = '/'
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed'

        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GITHUB_AUTH_ERROR',
            error: errorMessage,
          }, window.location.origin)

          // Close the popup
          setTimeout(() => {
            window.close()
          }, 2000)
        } else {
          // Fallback: redirect to home if opened directly
          window.location.href = '/'
        }
      }
    }

    handleCallback()
  }, [searchParams])

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
