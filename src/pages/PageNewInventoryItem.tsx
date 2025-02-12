import { DaButton } from '@/components/atoms/DaButton'
import DaText from '@/components/atoms/DaText'
import FormInventoryItem from '@/components/molecules/inventory/FormInventoryItem'

const PageNewInventoryItem = () => {
  return (
    <div className="flex-col flex">
      <div className="container flex items-center justify-between py-2">
        <DaText className="text-da-primary-500" variant="title">
          New Inventory Item
        </DaText>
        <DaButton>Create Item</DaButton>
      </div>
      <div className="border-b" />
      <div className="m-auto container">
        <FormInventoryItem type="create" />
      </div>
    </div>
  )
}

export default PageNewInventoryItem
