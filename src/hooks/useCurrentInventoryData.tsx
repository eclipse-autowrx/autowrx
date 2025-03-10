import { useParams } from 'react-router-dom'
import { instances, roles } from '@/components/molecules/inventory/data'
import { InventoryItem } from '@/types/inventory.type'

type Result = {
  data: {
    inventoryItem: InventoryItem | null
    roleData: Record<string, any> | null
  }
}

const useCurrentInventoryData = () => {
  const { inventory_id } = useParams()
  const { inventory_role } = useParams()

  const result: Result = {
    data: {
      inventoryItem: null,
      roleData: null,
    },
  }

  if (inventory_id) {
    result.data.inventoryItem =
      instances.find((instance) => instance.id === inventory_id) || null
  }

  if (inventory_role) {
    result.data.roleData =
      roles.find((role) => role.name === inventory_role) || null
  }

  return result
}

export default useCurrentInventoryData
