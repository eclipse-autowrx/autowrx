import { CVI } from '@/types/api.type'
import { serverAxios } from './base'

export const getApiByModelIdService = async (modelId: string) => {
  return (await serverAxios.get<CVI>(`/apis/model_id/${modelId}`)).data
}
