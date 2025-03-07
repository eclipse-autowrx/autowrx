import InventoryItemList from '@/components/molecules/inventory/InventoryItemList'
import InventoryRoleBrowser from '@/components/molecules/inventory/InventoryRoleBrowser'
import { useSearchParams } from 'react-router-dom'

const PageInventory = () => {
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role')

  return (
    <div className="flex">
      <div className="m-auto w-full p-6">
        {role ? <InventoryItemList /> : <InventoryRoleBrowser />}
      </div>
    </div>
  )
}

export default PageInventory
