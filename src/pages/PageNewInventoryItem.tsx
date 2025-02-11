import FormInventoryItem from '@/components/molecules/inventory/FormInventoryItem'

const PageNewInventoryItem = () => {
  return (
    <div className="flex p-8">
      <div className="m-auto">
        <FormInventoryItem type="create" />
      </div>
    </div>
  )
}

export default PageNewInventoryItem
