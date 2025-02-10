import { List } from '@/types/common.type'
import { serverAxios } from './base'
import { Model, ModelCreate, ModelLite } from '@/types/model.type'
import { VehicleAPI } from '@/types/api.type'

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
          'state',
          'stats',
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

interface AllModelsResponse {
  ownedModels: List<ModelLite>
  contributedModels: List<ModelLite>
  publicReleasedModels: List<ModelLite>
}

export const listAllModels = async (): Promise<{
  ownedModels: ModelLite[]
  contributedModels: ModelLite[]
  publicReleasedModels: ModelLite[]
}> => {
  try {
    const { data } = await serverAxios.get<AllModelsResponse>('/models/all')
    console.log('Raw data from /models/all:', data)

    const ownedModels = data.ownedModels?.results || []
    const contributedModels = data.contributedModels?.results || []
    const publicReleasedModels = data.publicReleasedModels?.results || []

    return {
      ownedModels,
      contributedModels,
      publicReleasedModels,
    }
  } catch (error: any) {
    console.error('[listAllModels] error:', error.message)
    throw error
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
          'state',
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

export const getApiDetailService = async (
  model_id: string,
  api_name: string,
) => {
  return (
    await serverAxios.get<VehicleAPI>(`/models/${model_id}/api/${api_name}`)
  ).data
}
