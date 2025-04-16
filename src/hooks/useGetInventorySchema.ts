import { getSchemaService } from '@/services/inventory.service'
import { useQuery } from '@tanstack/react-query'

const useGetInventorySchema = (id?: string) => {
  return useQuery({
    queryKey: ['inventorySchema', id],
    queryFn: () => getSchemaService(id!),
    enabled: !!id, // Only run the query if id is available
  })
}

export default useGetInventorySchema
