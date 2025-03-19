import { serverAxios } from '@/services/base'

export const updateGenAIProfile = async (profile: string) => {
  return await serverAxios.put(`/genai/etas/profiles/${profile}`)
}
