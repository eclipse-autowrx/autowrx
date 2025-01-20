// useListAllModels.ts
import { useQuery } from '@tanstack/react-query'
import { listAllModels } from '@/services/model.service'
import useAuthStore from '@/stores/authStore'

const useListAllModels = () => {
  const access = useAuthStore((state) => state.access)
  return useQuery({
    queryKey: ['listAllModels'],
    queryFn: listAllModels,
    enabled: access !== undefined,
  })
}

export default useListAllModels
