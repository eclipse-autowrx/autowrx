// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import { serverAxios } from '@/services/base'

export interface ProjectTemplate {
  id: string
  name: string
  description?: string
  data: string
  visibility: 'public' | 'private'
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

export const listProjectTemplates = (params?: any): Promise<Paged<ProjectTemplate>> =>
  serverAxios.get('/system/project-template', { params }).then((r) => r.data)

export const getProjectTemplateById = (id: string): Promise<ProjectTemplate> =>
  serverAxios.get(`/system/project-template/${id}`).then((r) => r.data)

export const createProjectTemplate = (data: Partial<ProjectTemplate>): Promise<ProjectTemplate> =>
  serverAxios.post('/system/project-template', data).then((r) => r.data)

export const updateProjectTemplate = (
  id: string,
  data: Partial<ProjectTemplate>,
): Promise<ProjectTemplate> =>
  serverAxios.put(`/system/project-template/${id}`, data).then((r) => r.data)

export const deleteProjectTemplate = (id: string): Promise<void> =>
  serverAxios.delete(`/system/project-template/${id}`).then((r) => r.data)
