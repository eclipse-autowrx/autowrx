// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import config from '@/configs/config.ts'
import useAuthStore from '@/stores/authStore.ts'
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

export const serverAxios = axios.create({
  baseURL: `${config.serverBaseUrl}/${config.serverVersion}`,
  withCredentials: true,
})

export const cacheAxios = axios.create({
  baseURL: config.cacheBaseUrl,
})

// Track if we're currently refreshing the token to avoid multiple simultaneous refreshes
let isRefreshing = false
// Queue of failed requests that need to be retried after token refresh
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (error?: any) => void
  config: InternalAxiosRequestConfig
}> = []

// Process queued requests after token refresh
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      // Ensure headers object exists and update the Authorization header with the new token
      if (!prom.config.headers) {
        prom.config.headers = {} as any
      }
      prom.config.headers.Authorization = `Bearer ${token}`
      // Retry the original request
      serverAxios(prom.config).then(prom.resolve).catch(prom.reject)
    }
  })
  
  failedQueue = []
}

serverAxios.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().access?.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle 401 errors and refresh tokens
serverAxios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If error is 401 and we haven't already tried to refresh
    // Skip refresh for auth endpoints to avoid infinite loops
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh-tokens') &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/logout')
    ) {
      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Create a temporary axios instance without interceptors to avoid recursion
        const refreshAxios = axios.create({
          baseURL: `${config.serverBaseUrl}/${config.serverVersion}`,
          withCredentials: true,
        })

        // Attempt to refresh the token
        const response = await refreshAxios.post<{ access: { token: string; expires: string } }>(
          '/auth/refresh-tokens',
          {}
        )

        const newToken = response.data.access.token
        // Update the auth store with the new token
        useAuthStore.getState().setAccess(response.data.access)

        // Ensure headers object exists and update with the new token
        if (!originalRequest.headers) {
          originalRequest.headers = {} as any
        }
        originalRequest.headers.Authorization = `Bearer ${newToken}`

        // Process queued requests with the new token
        processQueue(null, newToken)

        // Retry the original request
        return serverAxios(originalRequest)
      } catch (refreshError) {
        // Token refresh failed - clear auth state and process queue with error
        processQueue(refreshError, null)
        useAuthStore.getState().logOut()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export const logAxios = config.logBaseUrl ? axios.create({
  baseURL: config.logBaseUrl,
  withCredentials: true,
}) : null
