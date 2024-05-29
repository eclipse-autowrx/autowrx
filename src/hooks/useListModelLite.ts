import { useQuery } from '@tanstack/react-query'
import { listModelsLite } from '@/services/model.service'

const useListModelLite = () => {
  return useQuery({ queryKey: ['listModelLite'], queryFn: listModelsLite })
}
export default useListModelLite
