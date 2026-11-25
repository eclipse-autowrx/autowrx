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

// One refresh at a time. Every query that failed with 401 waits for it and is
// then refetched; queries that fail while a refresh is running must not be
// dropped, or they keep their error (e.g. an empty user list) until a reload.
let refreshPromise: Promise<boolean> | null = null

const QueryProvider = ({ children }: QueryProviderProps) => {
  const [setAccess, logOut] = useAuthStore(
    (state) => [state.setAccess, state.logOut],
    shallow,
  )
  const [queryClient] = useState(() => {
    const client: QueryClient = new QueryClient({
      queryCache: new QueryCache({
        onError: async (error, query) => {
          if (isAxiosError(error) && error?.response?.status === 401) {
            if (!refreshPromise) {
              refreshPromise = (async () => {
                try {
                  const res = await refreshAxios.post(
                    '/auth/refresh-tokens',
                    {},
                  )
                  if (res.data?.access?.token) {
                    setAccess(res.data.access)
                    return true
                  }
                  if (res.data?.user) {
                    useAuthStore.getState().setUser(res.data.user, null)
                    return true
                  }
                  return false
                } catch {
                  logOut()
                  return false
                } finally {
                  refreshPromise = null
                }
              })()
            }

            if (await refreshPromise) {
              // query.invalidate() only marks the query stale; refetch it
              // so the request that got the 401 runs again with the new token.
              void client.invalidateQueries({
                queryKey: query.queryKey,
                exact: true,
              })
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
    })
    return client
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools /> */}
    </QueryClientProvider>
  )
}

export default QueryProvider
