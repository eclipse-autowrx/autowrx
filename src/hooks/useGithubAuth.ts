import config from '@/configs/config'

import { Socket, io } from 'socket.io-client'
import useSelfProfileQuery from './useSelfProfile'
import { useEffect, useRef } from 'react'
import useThirdPartyAuthStore from '@/stores/thirdPartyAuthStore'

const useGithubAuth = () => {
  const { data: self } = useSelfProfileQuery()
  const setAccess = useThirdPartyAuthStore((state) => state.setGithubAccess)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!self) return
    socketRef.current = io('http://localhost:9800', {
      query: {
        userId: self.id,
      },
    })
  }, [self?.id])

  const listenForAuth = () => {
    socketRef.current?.on('auth/github', (data: { accessToken?: string }) => {
      setAccess(data?.accessToken)
      socketRef.current?.off('auth/github')
    })
  }

  const onTriggerAuth = () => {
    window.open(
      `https://github.com/login/oauth/authorize/?client_id=${config.github.clientId}&redirect_uri=https://backend-core-dev.digital.auto/${config.serverVersion}/auth/github/callback?userId=${self?.id}&scope=user:email`,
      '_blank',
    )
    listenForAuth()
  }

  return { onTriggerAuth }
}

export default useGithubAuth
