import { User, UserCreate, UserUpdate } from '@/types/user.type'
import { serverAxios } from './base'
import { List } from '@/types/common.type'
import { users } from '@/data/users_mock'

const IS_MOCK = false

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

export const createUserService = async (data: UserCreate) => {
  return (await serverAxios.post<User>('/users', data)).data
}

export const updateUserService = async (id: string, data: UserUpdate) => {
  if (data.password === '') {
    delete data.password
  }
  return (await serverAxios.patch<User>(`/users/${id}`, data)).data
}

export const deleteUserService = async (id: string) => {
  return (await serverAxios.delete(`/users/${id}`)).data
}

export const partialUpdateUserService = async (data: Partial<User>) => {
  return (await serverAxios.patch<User>(`/users/self`, data)).data
}
