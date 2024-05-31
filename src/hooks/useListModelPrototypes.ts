import { useQuery } from '@tanstack/react-query'
import { listModelPrototypes } from '@/services/prototype.service'

const useListModelPrototypes = (model_id: string) => {
  return useQuery({
    queryKey: ['listModelPrototypes', model_id],
    queryFn: () => listModelPrototypes(model_id),
  })
}

export default useListModelPrototypes
