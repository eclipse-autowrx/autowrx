// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { serverAxios } from './base'

const toPermissionRef = (value: unknown): string | undefined => {
  if (value == null || value === '') return undefined
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    const obj = value as { id?: unknown; _id?: unknown }
    if (typeof obj.id === 'string' && obj.id) return obj.id
    if (obj._id != null) return String(obj._id)
  }
  return undefined
}

export const checkPermissionService = async (
  permissions: [string, string?][],
) => {
  const list = Array.isArray(permissions) ? permissions : [permissions]
  return (
    await serverAxios.get<boolean[]>(`/permissions/has-permission`, {
      params: {
        permissions: list
          .map(([action, ref]) => {
            const refId = toPermissionRef(ref)
            return refId ? `${action}:${refId}` : action
          })
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
