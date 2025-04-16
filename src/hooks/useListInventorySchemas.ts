import { listInventorySchemasService } from '@/services/inventory.service'
import { useQuery } from '@tanstack/react-query'

const useListInventorySchemas = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['inventorySchemaList'],
    queryFn: () => listInventorySchemasService(),
    ...options,
  })
}

export default useListInventorySchemas
