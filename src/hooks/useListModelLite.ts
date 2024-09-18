import { useQuery } from '@tanstack/react-query'
import { listModelsLite } from '@/services/model.service'
import useAuthStore from '@/stores/authStore'

const useListModelLite = (params?: Record<string, unknown>) => {
  const access = useAuthStore((state) => state.access)
  return useQuery({
    queryKey: ['listModelLite', access, params],
    queryFn: () => listModelsLite(params),
  })
}
export default useListModelLite
