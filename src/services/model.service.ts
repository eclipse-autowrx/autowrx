import { List } from '@/types/common.type'
import { serverAxios } from './base'
import { Model, ModelCreate, ModelLite } from '@/types/model.type'
import { models } from '@/data/models_mock'

const IS_MOCK = false

export const listModelsLite = async () => {
  if (IS_MOCK) {
    return {
      results: models,
      page: 1,
      limit: 10,
      totalPages: 1,
      totalResults: models.length,
    }
  }
  return (
    await serverAxios.get<List<ModelLite>>('/models', {
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
      },
    })
  ).data
}

export const getModel = async (model_id: string) => {
  if (IS_MOCK) {
    const model = models.find((model) => model.id === model_id)
    return model
  }
  return (await serverAxios.get<Model>(`/models/${model_id}`)).data
}

export const createModelService = async (model: ModelCreate) => {
  return (await serverAxios.post<Model>('/models', model)).data
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

export const updateModelService = async (
  model_id: string,
  data: Partial<Model>,
) => {
  return (await serverAxios.patch<Model>(`/models/${model_id}`, data)).data
}
