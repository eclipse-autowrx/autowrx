// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { serverAxios } from '@/services/base'

export interface Plugin {
  id: string
  name: string
  slug: string
  image?: string
  description?: string
  is_internal: boolean
  url?: string
  config?: any
  createdAt: string
  updatedAt: string
}

export interface Paged<T> {
  results: T[]
  page: number
  limit: number
  totalPages: number
  totalResults: number
}

export const listPlugins = (params?: any): Promise<Paged<Plugin>> =>
  serverAxios.get('/system/plugin', { params }).then((r) => r.data)

export const getPluginById = (id: string): Promise<Plugin> =>
  serverAxios.get(`/system/plugin/id/${id}`).then((r) => r.data)

export const getPluginBySlug = (slug: string): Promise<Plugin> =>
  serverAxios.get(`/system/plugin/slug/${slug}`).then((r) => r.data)

export const createPlugin = (data: Partial<Plugin>): Promise<Plugin> =>
  serverAxios.post('/system/plugin', data).then((r) => r.data)

export const updatePlugin = (id: string, data: Partial<Plugin>): Promise<Plugin> =>
  serverAxios.put(`/system/plugin/${id}`, data).then((r) => r.data)

export const deletePlugin = (id: string): Promise<void> =>
  serverAxios.delete(`/system/plugin/${id}`).then(() => {})

export const uploadInternalZip = (
  slug: string,
  file: File,
): Promise<{ url: string; plugin: Plugin }> => {
  const fd = new FormData()
  fd.append('file', file)
  return serverAxios
    .post(`/system/plugin/upload/${slug}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}


