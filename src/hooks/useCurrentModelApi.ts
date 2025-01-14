import { getComputedAPIs } from '@/services/model.service'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

const useCurrentModelApi = () => {
  const { model_id } = useParams()
  return useQuery({
    queryKey: ['currentModelApi', model_id],
    queryFn: () => getComputedAPIs(model_id!),
    enabled: !!model_id,
    retry: false,
  })
}

export default useCurrentModelApi
