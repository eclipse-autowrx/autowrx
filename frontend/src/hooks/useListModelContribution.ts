// useListModelContribution hook stub
import { useQuery } from '@tanstack/react-query'

const useListModelContribution = () => {
  return useQuery({
    queryKey: ['model-contributions'],
    queryFn: async () => {
      return []
    },
  })
}

export default useListModelContribution
