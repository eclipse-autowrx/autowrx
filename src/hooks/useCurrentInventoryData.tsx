import { useParams } from 'react-router-dom'
import { instances, roles } from '@/components/molecules/inventory/data'
import { InventoryItem } from '@/types/inventory.type'
import { useListUsers } from './useListUsers'

type Result = {
  data: {
    inventoryItem: InventoryItem | null
    roleData: Record<string, any> | null
  }
}

const useCurrentInventoryData = () => {
  const { inventory_id } = useParams()
  const { inventory_role } = useParams()
  const { data: users } = useListUsers({
    id: '6724a8cb3e09ac00279ed6f5,6714fe1a9c8a740026eb7f97,6699fa83964f3f002f35ea03',
  })

  const hashStr = (s: string) => {
    let hash = 0,
      i,
      chr
    if (s.length === 0) return hash
    for (i = 0; i < s.length; i++) {
      chr = s.charCodeAt(i)
      hash = (hash << 5) - hash + chr
      hash |= 0
    }
    return hash
  }

  const result: Result = {
    data: {
      inventoryItem: null,
      roleData: null,
    },
  }

  if (inventory_id) {
    result.data.inventoryItem =
      instances.find((instance) => instance.id === inventory_id) || null
    if (result.data.inventoryItem?.data) {
      result.data.inventoryItem.data.createdBy = users.at(
        hashStr(inventory_id) % users.length,
      )
    }
  }

  if (inventory_role) {
    result.data.roleData =
      roles.find((role) => role.name === inventory_role) || null
  }

  return result
}

export default useCurrentInventoryData
