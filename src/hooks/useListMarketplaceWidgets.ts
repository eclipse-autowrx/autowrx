import { useQuery } from '@tanstack/react-query'
import { loadMarketWidgets } from '@/services/widget.service'

const useListMarketplaceWidgets = () => {
  return useQuery({
    queryKey: ['listMarketplaceAddOns'],
    queryFn: () => loadMarketWidgets(),
  })
}

export default useListMarketplaceWidgets
