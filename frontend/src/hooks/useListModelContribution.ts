// useListModelContribution hook stub
import { useQuery } from '@tanstack/react-query'
import { ModelLite } from '@/types/model.type'

interface ModelContributionResponse {
  results: ModelLite[]
  totalPages?: number
  currentPage?: number
}

const useListModelContribution = () => {
  return useQuery<ModelContributionResponse>({
    queryKey: ['model-contributions'],
    queryFn: async () => {
      return {
        results: [],
        totalPages: 0,
        currentPage: 1,
      }
    },
  })
}

export default useListModelContribution
