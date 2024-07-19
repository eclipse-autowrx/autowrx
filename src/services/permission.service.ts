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
    await serverAxios.post('/permissions/remove-role-from-user', {
      user: userId,
      role: roleId,
    })
  ).data
}
