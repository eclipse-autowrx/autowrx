import { useParams } from 'react-router-dom'
import { instances, roles } from '@/components/molecules/inventory/data'
import { InventoryItem } from '@/types/inventory.type'
import { useListUsers } from './useListUsers'
import { useCallback, useMemo } from 'react'

type Result = {
  data: {
    inventoryItem: InventoryItem | null
    roleData: Record<string, any> | null
  }
}

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

const useCurrentInventoryData = () => {
  const { inventory_id, inventory_role } = useParams()
  const { data: users } = useListUsers({
    id: '6724a8cb3e09ac00279ed6f5,6714fe1a9c8a740026eb7f97,6699fa83964f3f002f35ea03',
  })

  return useMemo(() => {
    const ret: Result = {
      data: {
        inventoryItem: null,
        roleData: null,
      },
    }

    if (inventory_id) {
      ret.data.inventoryItem =
        instances.find((instance) => instance.id === inventory_id) || null
      if (ret.data.inventoryItem?.data) {
        ret.data.inventoryItem.data.createdBy = users.at(
          hashStr(inventory_id) % (users.length || 1),
        )
      }
    }

    if (inventory_role) {
      ret.data.roleData =
        roles.find((role) => role.name === inventory_role) || null
    }

    return ret
  }, [inventory_id, inventory_role, users])
}

export default useCurrentInventoryData
