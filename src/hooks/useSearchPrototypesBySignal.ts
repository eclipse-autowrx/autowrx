import { searchPrototypesBySignal } from '@/services/search.service'
import { useQuery } from '@tanstack/react-query'

const useSearchPrototypesBySignal = (signal?: string) => {
  return useQuery({
    queryKey: ['searchPrototypesBySignal', signal],
    queryFn: async () => await searchPrototypesBySignal(signal!),
    retry: 0,
    enabled: !!signal,
  })
}

export default useSearchPrototypesBySignal
