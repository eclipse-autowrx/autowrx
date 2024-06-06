import { useQuery } from '@tanstack/react-query'
import { fetchMarketAddOns } from '@/services/widget.service'

const useListMarketplaceAddOns = (type: string) => {
  return useQuery({
    queryKey: ['listMarketplaceAddOns', type],
    queryFn: () => fetchMarketAddOns(type),
  })
}

export default useListMarketplaceAddOns
