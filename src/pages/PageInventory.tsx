import InventoryItemList from '@/components/molecules/inventory/InventoryItemList'

const PageInventory = () => {
  return (
    <div className="flex">
      <div className="m-auto w-full p-6">
        <InventoryItemList />
      </div>
    </div>
  )
}

export default PageInventory
