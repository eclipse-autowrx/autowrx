import { InvitedUser } from '@/types/user.type'
import { serverAxios } from './base'

const IS_MOCK = false

export const searchService = async (query: string) => {
  const response = await serverAxios.get(`/search?q=${query}`, {})
  const top10prototypes = response.data.prototypes
  const top10models = response.data.models
  return { top10prototypes, top10models }
}

export const searchUserByEmailService = async (query: string) => {
  if (IS_MOCK) {
    console.log('Trigger')
    await new Promise((resolve) => setTimeout(resolve, 200))
    if (query.length > 5)
      return {
        name: 'John Doe',
        email: query,
        image_file: 'https://randomuser.me/api/portraits',
        roles: [],
        email_verified: true,
        provider: '',
        created_at: '',
        id: '',
        accessLevel: 'test',
      } as unknown as InvitedUser
  }
  return (await serverAxios.get(`/search/email/${query}`)).data
}
