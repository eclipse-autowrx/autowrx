import { List } from '@/types/common.type'
import { serverAxios } from './base'
import { Model, ModelCreate, ModelLite } from '@/types/model.type'

export const listModelsLite = async (
  params?: Record<string, unknown>,
): Promise<List<ModelLite>> => {
  let page = 1
  const limit = 10
  let allResults: ModelLite[] = []
  let totalPages = 1

  do {
    const response = await serverAxios.get<List<ModelLite>>('/models', {
      params: {
        ...params,
        fields: [
          'name',
          'visibility',
          'model_home_image_file',
          'id',
          'created_at',
          'created_by',
          'tags',
        ].join(','),
        page,
        limit,
      },
    })

    allResults = [...allResults, ...response.data.results]
    totalPages = response.data.totalPages
    page++
  } while (page <= totalPages)

  return {
    results: allResults,
    totalPages,
    totalResults: allResults.length,
    page: 1,
    limit,
  }
}

export const listModelContributions = async (): Promise<List<ModelLite>> => {
  let page = 1
  const limit = 10
  let allResults: ModelLite[] = []
  let totalPages = 1

  do {
    const response = await serverAxios.get<List<ModelLite>>(`/models`, {
      params: {
        fields: [
          'name',
          'visibility',
          'model_home_image_file',
          'id',
          'created_at',
          'created_by',
          'tags',
        ].join(','),
        is_contributor: true,
        page,
        limit,
      },
    })
    allResults = [...allResults, ...response.data.results]
    totalPages = response.data.totalPages
    page++
  } while (page <= totalPages)

  return {
    results: allResults,
    totalPages,
    totalResults: allResults.length,
    page: 1,
    limit,
  }
}

export const getModel = async (model_id: string) => {
  return (await serverAxios.get<Model>(`/models/${model_id}`)).data
}

export const createModelService = async (model: ModelCreate) => {
  return (await serverAxios.post('/models', model)).data
}

export const updateModelPermissionService = async (
  model_id: string,
  role: string,
  userId: string,
) => {
  return (
    await serverAxios.post<Model>(`/models/${model_id}/permissions`, {
      role,
      userId,
    })
  ).data
}

export const deleteModelPermissionService = async (
  model_id: string,
  role: string,
  userId: string,
) => {
  return await serverAxios.delete(`/models/${model_id}/permissions`, {
    params: { userId, role },
  })
}

export const updateModelService = async (
  model_id: string,
  data: Partial<Model>,
) => {
  return (await serverAxios.patch<Model>(`/models/${model_id}`, data)).data
}

export const deleteModelService = async (model_id: string) => {
  return await serverAxios.delete(`/models/${model_id}`)
}

export const getComputedAPIs = async (model_id: string) => {
  return (await serverAxios.get(`/models/${model_id}/api`)).data
}
