import { listVSSVersionsService } from '@/services/api.service'
import { useQuery } from '@tanstack/react-query'

const useListVSSVersions = () => {
  return useQuery({
    queryKey: ['listVSSVersions'],
    queryFn: listVSSVersionsService,
  })
}

export default useListVSSVersions
