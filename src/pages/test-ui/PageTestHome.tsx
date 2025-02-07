import FormInventoryItem from '@/components/molecules/inventory/FormInventoryItem'
import React from 'react'

const PageTestHome = () => {
  return (
    <div className="flex h-[800px]">
      <div className="w-[600px] border shadow-medium rounded-xl p-4 m-auto">
        <FormInventoryItem type="create" />
      </div>
    </div>
  )
}

export default PageTestHome
