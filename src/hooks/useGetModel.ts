import { useQuery } from '@tanstack/react-query'
import { getModel } from '@/services/model.service'

const useGetModel = (model_id: string) => {
  return useQuery({
    queryKey: ['getModel', model_id],
    queryFn: () => getModel(model_id),
  })
}

export default useGetModel
