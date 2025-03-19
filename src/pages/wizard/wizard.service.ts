import { serverAxios } from '@/services/base'

export const updateGenAIProfile = async (profile: string) => {
  return await serverAxios.post(`/genai/etas/profiles/${profile}`)
}
