import { User } from '@/types/user.type'
import { serverAxios } from './base'
import { List } from '@/types/common.type'
import { users } from '@/data/users_mock'

const IS_MOCK = true

export const getSelfService = async () => {
  return (await serverAxios.get<User>('/users/self')).data
}

export const listUsersService = async () => {
  if (IS_MOCK) {
    return {
      results: users,
      page: 1,
      limit: 10,
      totalPages: 1,
      totalResults: users.length,
    }
  }
  return (await serverAxios.get<List<User>>('/users')).data
}
