import FormInventoryItem from '@/components/molecules/inventory/FormInventoryItem'
import React from 'react'

const PageTestHome = () => {
  return (
    <div className="flex h-[800px]">
      <div className="m-auto">
        <FormInventoryItem type="create" />
      </div>
    </div>
  )
}

export default PageTestHome
