import { instances } from '@/components/molecules/inventory/data'
import { useQuery } from '@tanstack/react-query'
import React from 'react'

const useInventoryItems = () => {
  return useQuery({
    queryKey: ['inventoryItems'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return instances
    },
  })
}

export default useInventoryItems
