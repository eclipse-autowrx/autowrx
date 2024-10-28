import { List } from '@/types/common.type'
import { serverAxios } from './base'
import {
  ExtendedApi,
  ExtendedApiCreate,
  ExtendedApiRet,
} from '@/types/api.type'

export const createExtendedApi = async (
  data: ExtendedApiCreate,
): Promise<ExtendedApiRet> => {
  const res = (
    await serverAxios.post<ExtendedApi>('/extendedApis', {
      ...data,
      type: data.type ?? 'branch',
    })
  ).data
  return {
    ...res,
    name: res.apiName,
    type: res.type ?? 'branch',
    description: res.description ?? '',
  }
}

export const getExtendedApi = async (name: string, model_id: string) => {
  return (
    await serverAxios.get<ExtendedApi>(
      `/extendedApis/by-api-and-model?apiName=${name}&model=${model_id}`,
    )
  ).data
}

export const updateExtendedApi = async (
  data: Partial<ExtendedApiCreate>,
  id: string,
) => {
  return (
    await serverAxios.patch<Partial<ExtendedApiCreate>>(
      `/extendedApis/${id}`,
      data,
    )
  ).data
}

export const deleteExtendedApi = async (id: string) => {
  return (await serverAxios.delete(`/extendedApis/${id}`)).data
}

export const listExtendedApis = async (model_id: string) => {
  return (
    await serverAxios.get<List<ExtendedApi>>(`/extendedApis?model=${model_id}`)
  ).data
}
