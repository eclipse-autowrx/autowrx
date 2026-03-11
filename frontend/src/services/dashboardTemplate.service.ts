// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import { serverAxios } from '@/services/base'

export interface DashboardTemplate {
  id: string
  name: string
  description?: string
  image?: string
  visibility: 'public' | 'private'
  widget_config?: any
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

export const listDashboardTemplates = (params?: any): Promise<Paged<DashboardTemplate>> =>
  serverAxios.get('/system/dashboard-template', { params }).then((r) => r.data)

export const getDashboardTemplateById = (id: string): Promise<DashboardTemplate> =>
  serverAxios.get(`/system/dashboard-template/${id}`).then((r) => r.data)

export const createDashboardTemplate = (data: Partial<DashboardTemplate>): Promise<DashboardTemplate> =>
  serverAxios.post('/system/dashboard-template', data).then((r) => r.data)

export const updateDashboardTemplate = (
  id: string,
  data: Partial<DashboardTemplate>,
): Promise<DashboardTemplate> =>
  serverAxios.put(`/system/dashboard-template/${id}`, data).then((r) => r.data)

export const deleteDashboardTemplate = (id: string): Promise<void> =>
  serverAxios.delete(`/system/dashboard-template/${id}`).then((r) => r.data)
