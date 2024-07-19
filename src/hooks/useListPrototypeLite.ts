import { useQuery } from '@tanstack/react-query'
import { listAllPrototypes } from '@/services/prototype.service'

const useListPrototypeLite = () => {
  return useQuery({
    queryKey: ['listPrototypeLite', listAllPrototypes],
    queryFn: listAllPrototypes,
  })
}
export default useListPrototypeLite
