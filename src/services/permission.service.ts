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
