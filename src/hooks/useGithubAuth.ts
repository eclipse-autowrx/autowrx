import config from '@/configs/config'

import { Socket, io } from 'socket.io-client'
import useSelfProfileQuery from './useSelfProfile'
import { useEffect, useRef, useState } from 'react'
import { getGithubCurrentUser } from '@/services/github.service'
import { GithubUser } from '@/types/github.type'

const useGithubAuth = () => {
  const [access, setAccess] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<GithubUser>()

  const { data: self } = useSelfProfileQuery()
  const socketRef = useRef<Socket | null>(null)

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
      async (data: { accessToken?: string }) => {
        console.log('data', data)
        setAccess(data?.accessToken)
        try {
          if (data.accessToken) {
            const res = await getGithubCurrentUser(data.accessToken)
            setUser(res)
          }
        } catch (error) {
          console.error('Error getting github user:', error)
        } finally {
          setLoading(false)
          socketRef.current?.off('auth/github')
        }
      },
    )
  }

  const onTriggerAuth = () => {
    window.open(
      `https://github.com/login/oauth/authorize/?client_id=${config.github.clientId}&redirect_uri=${config.serverBaseUrl}/${config.serverVersion}/auth/github/callback?userId=${self?.id}&scope=user:email%20public_repo`,
      '_blank',
    )
    listenForAuth()
  }

  return { onTriggerAuth, access, loading, user }
}

export default useGithubAuth
