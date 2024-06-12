import { checkPermissionService } from '@/services/permission.service'
import { Permission } from '@/types/permission.type'
import { useQuery } from '@tanstack/react-query'

type PermissionHookType = (
  permissions: ([Permission, string] | Permission)[],
) => boolean[]

const usePermissionHook: PermissionHookType = (...params) => {
  const { data } = useQuery({
    queryKey: ['permissions', params],
    queryFn: () => checkPermissionService(...params),
  })
  return data || Array(params.length).fill(false)
}

export default usePermissionHook
