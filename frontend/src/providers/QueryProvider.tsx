// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import axios, { isAxiosError } from 'axios'
import { useState } from 'react'
import config from '@/configs/config'
import useAuthStore from '@/stores/authStore'
import { shallow } from 'zustand/shallow'

type QueryProviderProps = {
  children: React.ReactNode
}

const refreshAxios = axios.create({
  baseURL: `${config.serverBaseUrl}/${config.serverVersion}`,
  withCredentials: true,
})

let isRefreshing = false

const QueryProvider = ({ children }: QueryProviderProps) => {
  const [setAccess, logOut] = useAuthStore(
    (state) => [state.setAccess, state.logOut],
    shallow,
  )
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: async (error, query) => {
            if (isAxiosError(error) && error?.response?.status === 401) {
              if (isRefreshing) return

              isRefreshing = true
              try {
                const res = await refreshAxios.post('/auth/refresh-tokens', {})
                if (res.data?.access?.token) {
                  setAccess(res.data.access)
                  query.invalidate()
                }
              } catch {
                logOut()
              } finally {
                isRefreshing = false
              }
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30000,
            retry: (failureCount, error) => {
              if (isAxiosError(error) && error?.response?.status === 401) {
                return false
              }

              return failureCount <= 1
            },
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools /> */}
    </QueryClientProvider>
  )
}

export default QueryProvider
