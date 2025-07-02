// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import config from '@/configs/config'
import useAuthStore from '@/stores/authStore'
import axios from 'axios'

export const serverAxios = axios.create({
  baseURL: `${config.serverBaseUrl}/${config.serverVersion}`,
  withCredentials: true,
})

export const cacheAxios = axios.create({
  baseURL: config.cacheBaseUrl,
})

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

export const logAxios = axios.create({
  baseURL: config.logBaseUrl,
  withCredentials: true,
})
