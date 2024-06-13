import { checkPermissionService } from '@/services/permission.service'
import { useQuery } from '@tanstack/react-query'

const usePermissionHook = (...params: [string, string?][]) => {
  const { data } = useQuery({
    queryKey: ['permissions', params],
    queryFn: () => checkPermissionService(params),
  })
  return data || Array(params.length).fill(false)
}

export default usePermissionHook
