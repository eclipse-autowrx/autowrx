import { useQuery } from '@tanstack/react-query'
import { listModelContributions } from '@/services/model.service'
import useAuthStore from '@/stores/authStore'

const useListModelContribution = () => {
  const access = useAuthStore((state) => state.access)
  return useQuery({
    queryKey: ['listModelContributions', access],
    queryFn: () => listModelContributions(),
  })
}
export default useListModelContribution
