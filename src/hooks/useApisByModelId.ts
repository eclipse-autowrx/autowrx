import { getApiByModelIdService } from '@/services/api.service'
import { useQuery } from '@tanstack/react-query'

const useApisByModelId = (modelId?: string) => {
  return useQuery({
    queryKey: ['apis', 'model_id', modelId],
    queryFn: () => getApiByModelIdService(modelId!),
    enabled: !!modelId,
  })
}

export default useApisByModelId
