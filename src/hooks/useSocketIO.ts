import config from '@/configs/config'
import useAuthStore from '@/stores/authStore'
import useSocketStore from '@/stores/socketStore'
import { useMemo } from 'react'

const useSocketIO = (url?: string) => {
  const getSocketIO = useSocketStore((state) => state.getSocketIO)
  const access = useAuthStore((state) => state.access)

  return useMemo(() => {
    const socketUrl = (url || config.serverBaseUrl) as string
    if (access) {
      return getSocketIO(socketUrl, access.token)
    }
    console.log('No access token provided. Cannot connect to socket.')
    return null
  }, [url, access])
}

export default useSocketIO
