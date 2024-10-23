import { getExtendedApi } from '@/services/extendedApis.service'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

const useCurrentExtendedApi = () => {
  const { model_id, api } = useParams()

  return useQuery({
    queryKey: ['current-extended-api', model_id, api],
    queryFn: () => getExtendedApi(api!, model_id!),
    enabled: !!model_id && !!api,
    retry: false,
  })
}

export default useCurrentExtendedApi
