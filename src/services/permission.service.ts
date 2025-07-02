// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { serverAxios } from './base'

export const checkPermissionService = async (
  permissions: [string, string?][],
) => {
  return (
    await serverAxios.get<boolean[]>(`/permissions/has-permission`, {
      params: {
        permissions: (Array.isArray(permissions) ? permissions : [permissions])
          .map((perm) => perm.join(':'))
          .join(','),
      },
    })
  ).data
}

export const listUsersByRolesService = async () => {
  return (await serverAxios.get('/permissions/users-by-roles')).data
}

export const assignRoleToUserService = async (
  userId: string,
  roleId: string,
) => {
  try {
    const response = await serverAxios.post('/permissions', {
      user: userId,
      role: roleId,
    })
    return response.data
  } catch (error) {
    console.error('Error assigning role to user:', error)
    throw error
  }
}

export const removeRoleFromUserService = async (
  userId: string,
  roleId: string,
) => {
  return (
    await serverAxios.delete('/permissions', {
      params: {
        user: userId,
        role: roleId,
      },
    })
  ).data
}

export const fetchFeaturesService = async () => {
  try {
    const rawData = (await serverAxios.get('/permissions/roles')).data
    const filteredData = rawData.filter(
      (feature: any) => feature.not_feature !== true,
    )
    return filteredData
  } catch (error) {
    console.error('Error fetching features:', error)
    throw error
  }
}
