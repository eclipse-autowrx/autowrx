import { List } from '@/types/common.type'
import { serverAxios } from './base'
import { Prototype, Model } from '@/types/model.type'
import { prototypes } from '@/data/models_mock'

const IS_MOCK = false

export const listProposalPrototype = async () => {
  if (IS_MOCK) {
    return {
      results: prototypes,
      page: 1,
      limit: 10,
      totalPages: 1,
      totalResults: prototypes.length,
    }
  }
  return (
    await serverAxios.get<List<Prototype>>('/prototypes', {
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

export const getPrototype = async (prototype_id: string) => {
  if (IS_MOCK) {
    const prototype = prototypes.find(
      (prototype) => prototype.id === prototype_id,
    )
    return prototype
  }
  return (await serverAxios.get<Prototype>(`/prototypes/${prototype_id}`)).data
}

export const listModelPrototypes = async (model_id: string) => {
  if (IS_MOCK) {
    return prototypes
  }
  return (
    await serverAxios.get<List<Prototype>>(`/prototypes?model_id=${model_id}`)
  ).data.results
}

export const createPrototypeService = async (prototype: any) => {
  return (await serverAxios.post<Prototype>('/prototypes', prototype)).data
}
