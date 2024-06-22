import { serverAxios } from './base'
import { ExtendedApi, ExtendedApiCreate } from '@/types/api.type'

export const createExtendedApi = async (
  data: ExtendedApiCreate,
): Promise<ExtendedApi> => {
  return (await serverAxios.post<ExtendedApi>('/extendedApis', data)).data
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
