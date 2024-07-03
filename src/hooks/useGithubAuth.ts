import config from '@/configs/config'

import { Socket, io } from 'socket.io-client'
import useSelfProfileQuery from './useSelfProfile'
import { useEffect, useRef, useState } from 'react'
import { getGithubCurrentUser } from '@/services/github.service'
import { GithubUser } from '@/types/github.type'
import useGithubAuthStore from '@/stores/githubAuthStore'
import { shallow } from 'zustand/shallow'
import dayjs from 'dayjs'

const useGithubAuth = () => {
  const [access, setAccess, clear] = useGithubAuthStore(
    (state) => [state.access, state.setAccess, state.clear],
    shallow,
  )
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<GithubUser>()

  const { data: self } = useSelfProfileQuery()
  const socketRef = useRef<Socket | null>(null)

  const redirectUri = encodeURIComponent(
    `${config.serverBaseUrl}/${config.serverVersion}/auth/github/callback?userId=${self?.id}&origin=${window.location.origin}`,
  )

  useEffect(() => {
    if (!self) return
    socketRef.current = io(config.serverBaseUrl, {
      query: {
        userId: self.id,
      },
    })
  }, [self?.id])

  const listenForAuth = () => {
    setLoading(true)
    socketRef.current?.on(
      'auth/github',
      async (data: { accessToken: string; expiresIn?: number }) => {
        setAccess({
          expires: new Date(
            Date.now() + (data.expiresIn || 28800) * 1000,
          ).toISOString(),
          token: data.accessToken,
        })
        try {
          if (data.accessToken) {
            const res = await getGithubCurrentUser(data.accessToken)
            setUser(res)
          }
        } catch (error) {
          console.error('Error getting github user:', error)
        } finally {
          setLoading(false)
          setError('')
          socketRef.current?.off('auth/github')
          socketRef.current?.off('auth/github/error')
        }
      },
    )
    socketRef.current?.on('auth/github/error', (data: { message: string }) => {
      setError(data.message)
      setLoading(false)
      clear()
      setUser(undefined)
      socketRef.current?.off('auth/github')
      socketRef.current?.off('auth/github/error')
    })
  }

  const retrieveUser = async (token: string) => {
    try {
      setLoading(true)
      const user = await getGithubCurrentUser(token)
      setUser(user)
    } catch (error) {
      console.error('Error getting github user:', error)
    } finally {
      setLoading(false)
    }
  }

  const isExpired = () => {
    if (!access) return true
    return dayjs(access.expires).isBefore(dayjs())
  }

  const onTriggerAuth = () => {
    if (isExpired()) {
      window.open(
        `https://github.com/login/oauth/authorize/?client_id=${config.github.clientId}&redirect_uri=${redirectUri}&scope=user:email%20public_repo`,
        '_blank',
      )
      listenForAuth()
    } else {
      retrieveUser(access?.token!)
    }
  }

  return { onTriggerAuth, access, loading, user, error }
}

export default useGithubAuth
