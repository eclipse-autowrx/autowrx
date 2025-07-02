// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

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
