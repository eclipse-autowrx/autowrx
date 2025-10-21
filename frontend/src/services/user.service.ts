// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { User, UserCreate, UserUpdate } from '@/types/user.type.ts'
import { serverAxios } from './base'
import { List, ListQueryParams } from '@/types/common.type.ts'
// import { users } from '@/data/users_mock'

// const IS_MOCK = false

export const getSelfService = async () => {
  return (await serverAxios.get<User>('/users/self')).data
}

export const getUsersService = async (ids: string) => {
  return (await serverAxios.get<any>(`/users/${ids}`)).data
}

export const listUsersService = async (
  params?: Partial<
    Record<
      keyof (User & ListQueryParams & { includeFullDetails?: boolean }),
      unknown
    >
  >,
) => {
  // if (IS_MOCK) {
  //   return {
  //     results: users,
  //     page: 1,
  //     limit: 10,
  //     totalPages: 1,
  //     totalResults: users.length,
  //   }
  // }
  return (
    await serverAxios.get<List<User>>('/users', {
      params,
    })
  ).data
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

export const partialUpdateUserService = async (
  data: Partial<User> | UserUpdate,
) => {
  return (await serverAxios.patch<User>(`/users/self`, data)).data
}
