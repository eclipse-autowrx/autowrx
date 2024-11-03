import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleGitHubCallback } from '@/lib/githubAuth'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const authenticate = async () => {
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        try {
          console.log('Authorization code received:', code)

          await handleGitHubCallback(code)
          console.log('GitHub callback handled successfully.')

          // Retrieve the original URL path and navigate back to it
          const redirectTo = sessionStorage.getItem('postAuthRedirect') || '/'
          sessionStorage.removeItem('postAuthRedirect')
          navigate(redirectTo) // Ensure `redirectTo` is a path, not a full URL
        } catch (error) {
          console.error('GitHub authentication failed:', error)
        }
      } else {
        navigate('/') // Redirect home if no code is found
      }
    }

    authenticate()
  }, [navigate])

  return <p>Authenticating...</p>
}

export default AuthCallback
