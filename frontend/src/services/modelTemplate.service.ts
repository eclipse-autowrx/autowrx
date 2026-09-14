import { serverAxios } from '@/services/base'

export interface ModelTemplate {
  id: string
  name: string
  description?: string
  image?: string
  visibility: 'public' | 'private' | 'editable'
  is_default?: boolean
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

export const listModelTemplates = (params?: any): Promise<Paged<ModelTemplate>> =>
  serverAxios.get('/system/model-template', { params }).then(r => r.data)

export const getModelTemplateById = (id: string): Promise<ModelTemplate> =>
  serverAxios.get(`/system/model-template/${id}`).then(r => r.data)

export const createModelTemplate = (data: Partial<ModelTemplate>): Promise<ModelTemplate> =>
  serverAxios.post('/system/model-template', data).then(r => r.data)

export const updateModelTemplate = (id: string, data: Partial<ModelTemplate>): Promise<ModelTemplate> =>
  serverAxios.put(`/system/model-template/${id}`, data).then(r => r.data)

export const deleteModelTemplate = (id: string): Promise<void> =>
  serverAxios.delete(`/system/model-template/${id}`).then(r => r.data)


