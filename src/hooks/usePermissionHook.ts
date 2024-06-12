import { checkPermissionService } from '@/services/permission.service'
import { Permission } from '@/types/permission.type'
import { useQuery } from '@tanstack/react-query'

const usePermissionHook = (permission: Permission, ref?: string) => {
  const { data } = useQuery({
    queryKey: ['permissions', { permission, ref }],
    queryFn: () => checkPermissionService(permission, ref),
  })
  return !!data?.hasPermission
}

export default usePermissionHook
