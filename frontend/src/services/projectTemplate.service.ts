// Copyright (c) 2025 Eclipse Foundation.
// SPDX-License-Identifier: MIT

import { serverAxios } from '@/services/base'
import { List } from '@/types/common.type'

export interface ProjectTemplate {
  id: string
  name: string
  description?: string
  data: string
  visibility: 'public' | 'private'
  createdAt: string
  updatedAt: string
}

export interface ListProjectTemplatesParams {
  name?: string
  limit?: number
  page?: number
  sortBy?: string
}

export const listProjectTemplates = (params?: ListProjectTemplatesParams): Promise<List<ProjectTemplate>> =>
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
