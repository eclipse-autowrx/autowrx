import { List } from '@/types/common.type'
import { serverAxios } from './base'
import { Prototype } from '@/types/model.type'

export const listProposalPrototype = async (): Promise<List<Prototype>> => {
  let page = 1
  const limit = 12
  let allResults: Prototype[] = []
  let totalPages = 1
  // do {
  // Only get 1 page since we have different component for this Popular Prototypes that not migrated yet
  const response = await serverAxios.get<List<Prototype>>('/prototypes', {
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
        'state',
      ].join(','),
      page,
      limit,
    },
  })
  allResults = [...allResults, ...response.data.results]
  totalPages = response.data.totalPages
  page++
  // } while (page <= totalPages)

  // Filter results to only include prototypes with the specified conditions
  const filteredResults = allResults.filter(
    (prototype) =>
      prototype.image_file !== 'https://placehold.co/600x400' &&
      prototype.state === 'Released',
  )

  return {
    results: filteredResults,
    totalPages: Math.ceil(filteredResults.length / limit),
    totalResults: filteredResults.length,
    page: 1,
    limit,
  }
}

export const getPrototype = async (prototype_id: string) => {
  if (!prototype_id) return null
  return (await serverAxios.get<Prototype>(`/prototypes/${prototype_id}`)).data
}

export const listModelPrototypes = async (model_id: string) => {
  return (
    await serverAxios.get<List<Prototype>>(`/prototypes?model_id=${model_id}`)
  ).data.results
}

export const createPrototypeService = async (prototype: any) => {
  return (await serverAxios.post<Prototype>('/prototypes', prototype)).data
}

export const updatePrototypeService = async (
  prototype_id: string,
  data: Partial<Prototype>,
) => {
  return (
    await serverAxios.patch<Prototype>(`/prototypes/${prototype_id}`, data)
  ).data
}

export const deletePrototypeService = async (prototype_id: string) => {
  return await serverAxios.delete(`/prototypes/${prototype_id}`)
}
