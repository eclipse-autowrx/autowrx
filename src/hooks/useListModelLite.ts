import { useQuery } from '@tanstack/react-query'
import { listModelsLite } from '@/services/model.service'
import useAuthStore from '@/stores/authStore'

const useListModelLite = () => {
  const access = useAuthStore((state) => state.access)
  return useQuery({
    queryKey: ['listModelLite', access],
    queryFn: listModelsLite,
  })
}
export default useListModelLite
