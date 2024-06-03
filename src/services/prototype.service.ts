import { List } from '@/types/common.type'
import { serverAxios } from './base'
import { Prototype, Model } from '@/types/model.type'
import { prototypes } from '@/data/models_mock'

const IS_MOCK = false

const DEFAULT_PY_CODE = `from sdv_model import Vehicle
import plugins
from browser import aio

vehicle = Vehicle()

# write your code here

`;

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
          'model_id',
          'name',
          'visibility',
          'image_file',
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
  if(!prototype_id) return null
  if (IS_MOCK) {
    const prototype = prototypes.find(
      (prototype) => prototype.id === prototype_id,
    )
    if(prototype && !prototype.code) {
      prototype.code = DEFAULT_PY_CODE
    }
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
