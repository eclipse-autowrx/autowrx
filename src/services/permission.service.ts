import { Permission } from '@/types/permission.type'
import { serverAxios } from './base'

export const checkPermissionService = async (
  permissions: ([Permission, string] | Permission)[],
) => {
  return (
    await serverAxios.get<boolean[]>(`/permissions`, {
      params: {
        permissions: permissions
          .map((perm) => (typeof perm === 'string' ? [perm] : perm).join(':'))
          .join(','),
      },
    })
  ).data
}
