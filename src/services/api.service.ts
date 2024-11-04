import { CVI, VSSRelease } from '@/types/api.type'
import { serverAxios } from './base'

export const getApiByModelIdService = async (modelId: string) => {
  return (await serverAxios.get<CVI>(`/apis/model_id/${modelId}`)).data
}

export const listVSSVersionsService = async () => {
  return (await serverAxios.get<VSSRelease[]>(`/apis/vss`)).data
}
