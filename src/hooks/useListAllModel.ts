// useListAllModels.ts
import { useQuery } from '@tanstack/react-query'
import { listAllModels } from '@/services/model.service'
import useSelfProfileQuery from './useSelfProfile'

const useListAllModels = () => {
  const { data: self } = useSelfProfileQuery()

  return useQuery({
    queryKey: ['listAllModels', self?.id],
    queryFn: listAllModels,
  })
}

export default useListAllModels
