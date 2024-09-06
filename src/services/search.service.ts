import { InvitedUser } from '@/types/user.type'
import { serverAxios } from './base'
import { SearchPrototype } from '@/types/model.type'

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

export const searchPrototypesBySignal = async (signal: string) => {
  if (IS_MOCK) {
    return [
      {
        id: '66c5b686f9f90c0035e2e7f9',
        name: 'test',
        image_file: '/imgs/default_prototype_cover.jpg',
        model: {
          id: '66c5b682f9f90c0035e2e7d7',
          name: 'test',
        },
      },
      {
        id: '66c5b686f9f90c0z035e2e7f9',
        name: 'test',
        image_file: '/imgs/default_prototype_cover.jpg',
        model: {
          id: '66c5b682f9f90c0035e2e7d7',
          name: 'test',
        },
      },
      {
        id: '66c5b686f9f90cz0035e2e7f9',
        name: 'test',
        image_file: '/imgs/default_prototype_cover.jpg',
        model: {
          id: '66c5b682f9f90c0035e2e7d7',
          name: 'test',
        },
      },
      {
        id: '66c5b686f9f90c0035ze2e7f9',
        name: 'test',
        image_file: '/imgs/default_prototype_cover.jpg',
        model: {
          id: '66c5b682f9f90c0035e2e7d7',
          name: 'test',
        },
      },
      {
        id: '66c5zb686f9f90cz0035e2e7f9',
        name: 'test',
        image_file: '/imgs/default_prototype_cover.jpg',
        model: {
          id: '66c5b682f9f90c0035e2e7d7',
          name: 'test',
        },
      },
      {
        id: '66c5b68z6f9f90c0035ze2e7f9',
        name: 'test',
        image_file: '/imgs/default_prototype_cover.jpg',
        model: {
          id: '66c5b682f9f90c0035e2e7d7',
          name: 'test',
        },
      },
    ]
  }
  return (
    await serverAxios.get<SearchPrototype[]>(
      `/search/prototypes/by-signal/${signal}`,
    )
  ).data
}
