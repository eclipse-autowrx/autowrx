import { CheckPermissionResponse } from '@/types/permission.type'
import { serverAxios } from './base'

export const checkPermissionService = async (
  permission: string,
  ref?: string,
) => {
  return (
    await serverAxios.get<CheckPermissionResponse>(`/permissions`, {
      params: { ref, permission },
    })
  ).data
}
