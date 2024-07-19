import { serverAxios, cacheAxios } from './base'
import { Prototype, ModelLite } from '@/types/model.type'

export const searchService = async (query: string) => {
  const response = await serverAxios.get(`/search?q=${query}`, {})
  const top10prototypes = response.data.prototypes
  const top10models = response.data.models
  return { top10prototypes, top10models }
}
